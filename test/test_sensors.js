import app           from './server';
import db            from '../src/models/db';
import should        from 'should';
import supertest     from 'supertest';

import * as C from './constants';
import * as E from '../src/errors';

const server = supertest.agent(app);

describe('Sensors API', () => {
  describe('Preconditions', () => {
    beforeEach(done => {
      db().then(models => {
        return Promise.all([
          models.Sensors.destroy({ where: {} }),
          models.Datastreams.destroy({ where: {} })
        ]).then(() => done());
      });
    });

    it('/Sensors endpoint should exist and be empty', done => {
      server.get('/Sensors')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(200);
        res.body[C.iotCount].should.be.equal(0);
        res.body.value.should.be.instanceof(Array).and.have.lengthOf(0);
        done();
      });
    });
  });

  describe('GET /Sensors(:id)', () => {
    let sensorId;
    let anotherSensorId;

    beforeEach(done => {
      let Sensors;
      let Datastreams;
      db().then(_db => {
        Sensors = _db.Sensors;
        Datastreams = _db.Datastreams;
        return Promise.all([
          Sensors.destroy({ where: {} }),
          Datastreams.destroy({ where: {} })
        ]);
      }).then(() => {
        const entity = Object.assign({}, C.sensorEntity, {
          datastreams: [ C.datastreamEntity ]
        });
        const anotherEntity = Object.assign({}, C.sensorEntity, {
          name: C.anotherName
        });
        Promise.all([
          Sensors.create(entity, {
            include: [{ model: Datastreams, as: 'datastreams' }]
          }),
          Sensors.create(anotherEntity)
        ]).then(results => {
          sensorId = results[0].id;
          anotherSensorId = results[1].id;
          done();
        });
      });
    });

    it('should respond 200 with a list of sensors if no id is provided',
       done => {
      server.get('/Sensors')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(200);
        res.body[C.iotCount].should.be.equal(2);
        res.body.value.should.be.instanceof(Array).and.have.lengthOf(2);
        res.body.value.forEach(value => {
          value[C.iotId].should.be.equalOneOf([sensorId, anotherSensorId]);
          const selfLink = '/Sensors(' + sensorId + ')';
          const anotherSelfLink = '/Sensors(' + anotherSensorId + ')';
          value[C.iotSelfLink].should.be.equalOneOf([selfLink,
                                                     anotherSelfLink]);
          value[C.datastreamsNavigationLink].should.be.equalOneOf([
            selfLink + '/' + C.datastreams,
            anotherSelfLink + '/' + C.datastreams
          ]);
          value.name.should.be.equalOneOf([C.name, C.anotherName]);
          value.description.should.be.equal(C.description);
          value.encodingType.should.be.equal(C.encodingType);
          value.metadata.should.be.equal(C.metadata);
          should.not.exist(value.createdAt);
          should.not.exist(value.updatedAt);
        });
        done();
      });
    });

    it('should respond 200 with a sensor if id is provided', done => {
      let promises = [];
      [{ id: sensorId, name: C.name },
       { id: anotherSensorId, name: C.anotherName }].forEach(sensor => {
          promises.push(new Promise(resolve => {
            const path = '/Sensors(' + sensor.id + ')';
            server.get(path)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              should.not.exist(err);
              res.status.should.be.equal(200);
              res.body[C.iotId].should.be.equal(sensor.id);
              res.body[C.iotSelfLink].should.be.equal(path);
              res.body[C.datastreamsNavigationLink].should.be.equal(
                path + '/' + C.datastreams
              );
              res.body.name.should.be.equal(sensor.name);
              res.body.description.should.be.equal(C.description);
              res.body.encodingType.should.be.equal(C.encodingType);
              res.body.metadata.should.be.equal(C.metadata);
              should.not.exist(res.body.createdAt);
              should.not.exist(res.body.updatedAt);
              resolve();
            });
          }));
        });
        Promise.all(promises).then(() => done());
    });

    it('should respond 404 if invalid id is provided', done => {
      server.get('/Sensors(0)')
      .expect('Content-Type', /json/)
      .expect(404)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(404);
        res.body.code.should.be.equal(404);
        res.body.errno.should.be.equal(E.errnos[E.ERRNO_RESOURCE_NOT_FOUND]);
        res.body.error.should.be.equal(E.errors[E.NOT_FOUND]);
        done();
      });
    });
  });

  describe('POST /Sensors', () => {
    const resource = '/Sensors';

    const postError = (done, body, code) => {
      server.post(resource).send(body)
      .expect('Content-Type', /json/)
      .expect(code)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(code);
        res.body.code.should.be.equal(code);
        res.body.errno.should.be.equal(E.errnos[E.ERRNO_VALIDATION_ERROR]);
        res.body.error.should.be.equal(E.errors[E.BAD_REQUEST]);
        done();
      });
    };

    const postSuccess = (done, body, expected) => {
      server.post(resource).send(body)
      .expect('Content-Type', /json/)
      .expect(201)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(201);
        res.body.name.should.be.equal(C.name);
        res.body.description.should.be.equal(C.description);
        res.body.encodingType.should.be.equal(C.encodingType);
        res.body.metadata.should.be.equal(C.metadata);
        res.body[C.iotId].should.be.instanceOf(Number);
        res.body[C.iotSelfLink].should.be
           .equal('/Sensors(' + res.body[C.iotId] + ')');
        res.body[C.datastreamsNavigationLink].should.be
           .equal('/Sensors(' + res.body[C.iotId] + ')/Datastreams');
        res.header.location.should.be
           .equal('/Sensors(' + res.body[C.iotId] + ')');
        db().then(models => {
          Promise.all([
            models.Datastreams.findAndCountAll(),
            models.Sensors.findAndCountAll()
          ]).then(results => {
            const datastreams = results[0];
            const sensors = results[1];
            datastreams.count.should.be.equal(expected.datastreams.count);
            sensors.count.should.be.equal(expected.sensors.count);
            // XXX datastreams.rows
            const sensor = sensors.rows[0];
            sensor.id.should.be.equal(res.body[C.iotId]);
            sensor.name.should.be.equal(C.name);
            sensor.description.should.be.equal(C.description);
            sensor.encodingType.should.be.equal(C.encodingType);
            sensor.metadata.should.be.equal(C.metadata);
            done();
          });
        });
      });
    };

    beforeEach(done => {
      db().then(models => {
        Promise.all([
          models.Sensors.destroy({ where: {} }),
          models.Datastreams.destroy({ where: {} })
        ]).then(() => done());
      });
    });

    ['name', 'description', 'encodingType', 'metadata'].forEach(property => {
      it('should respond 400 if missing ' + property +
         ' property', done => {
        let body = Object.assign({}, C.sensorEntity);
        Reflect.deleteProperty(body, property);
        postError(done, body, 400);
      });
    });

    [C.encodingTypes.UNKNOWN,
     C.encodingTypes.GEO_JSON,
     C.encodingTypes.TEXT_HTML,
     C.encodingTypes.LOCATION_TYPE].forEach(type => {
      it('should respond 400 if encodingType is ' + type,
        done => {
        const body = Object.assign({}, C.sensorEntity, {
          encodingType: type,
        });
        postError(done, body, 400);
      });
    });

    xit('should respond 400 if request tries to create a ' +
        'Sensor linked to an unexisting Datastream', done => {
      const body = Object.assign({}, C.sensorEntity, {
        Datastream: {
          '@iot.id': Date.now()
        }
      });
      postError(done, body, 400);
    });

    it('should respond 201 if request to create Sensor is valid', done => {
      postSuccess(done, C.sensorEntity, {
        sensors: {
          count: 1
        },
        datastreams: {
          count: 0
        }
      });
    });

    xit('should respond 201 if request to link Sensor ' +
        'to existing Datastream is valid', done => {
      db().then(models => {
        models.Datastreams.create(C.datastreamEntity).then(datastream => {
          const body = Object.assign({}, C.sensorEntity, {
            Datastream: {
              '@iot.id': datastream.id
            }
          });
          postSuccess(done, body, {
            sensors: {
              count: 1
            },
            datastreams: {
              count: 0
            }
          });
        });
      });
    });

    xit('should respond 201 if request to create Sensor ' +
        'with related Datastream is valid', done => {
      db().then(models => {
        models.Datastreams.create(C.datastreamEntity).then(datastream => {
          const body = Object.assign({}, C.sensorEntity, {
            Datastream: datastream
          });
          postSuccess(done, body, {
            sensors: {
              count: 1
            },
            datastreams: {
              count: 0
            }
          });
        });
      });
    });
  });

  describe('PATCH /Sensors(:id)', () => {
    let sensorId;
    const resource = () => {
      return '/Sensors(' + sensorId + ')';
    };

    const patchError = (done, body, code, errno, error) => {
      server.patch(resource()).send(body)
      .expect('Content-Type', /json/)
      .expect(code)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(code);
        res.body.code.should.be.equal(code);
        res.body.errno.should.be.equal(E.errnos[errno]);
        res.body.error.should.be.equal(E.errors[error]);
        done();
      });
    };

    const patchSuccess = (done, body, expected) => {
      expected = expected || Object.assign({}, body, C.sensorEntity);
      server.patch(resource()).send(body)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(200);
        res.body.name.should.be.equal(expected.name);
        res.body.description.should.be.equal(expected.description);
        res.body.encodingType.should.be.equal(expected.encodingType);
        res.body.metadata.should.be.equal(expected.metadata);
        res.body[C.iotId].should.be.equal(sensorId);
        should.exist(res.body[C.iotSelfLink]);
        res.body[C.datastreamsNavigationLink].should.be
           .equal('/Sensors(' + res.body[C.iotId] + ')/Datastreams');
        res.header.location.should.be
           .equal('/Sensors(' + res.body[C.iotId] + ')');
        db().then(models => {
          models.Sensors.findAndCountAll().then(result => {
            result.count.should.be.equal(1);
            const sensor = result.rows[0];
            sensor.id.should.be.equal(sensorId);
            sensor.name.should.be.equal(expected.name);
            sensor.description.should.be.equal(expected.description);
            sensor.encodingType.should.be.equal(expected.encodingType);
            sensor.metadata.should.be.equal(expected.metadata);
            done();
          });
        });
      });
    };

    beforeEach(done => {
      sensorId = undefined;
      let Sensors;
      let Datastreams;
      db().then(models => {
        Sensors = models.Sensors;
        Datastreams = models.Datastreams;
        return Promise.all([
          Sensors.destroy({ where: {} }),
          Datastreams.destroy({ where: {} })
        ]);
      }).then(() => {
        Sensors.create(C.sensorEntity).then(sensor => {
          sensorId = sensor.id;
          done();
        });
      });
    });

    [C.encodingTypes.UNKNOWN,
     C.encodingTypes.GEO_JSON,
     C.encodingTypes.TEXT_HTML,
     C.encodingTypes.LOCATION_TYPE].forEach(type => {
      it('should respond 400 if encodingType is ' + type, done => {
        const body = Object.assign({}, C.sensorEntity, {
          encodingType: type,
        });
        patchError(done, body, 400, E.ERRNO_VALIDATION_ERROR, E.BAD_REQUEST);
      });
    });

    xit('should respond 400 if request tries to update ' +
        'a Sensor to link it to an unexisting Datastream', done => {
      const body = Object.assign({}, C.sensorEntity, {
        Datastream: {
          '@iot.id': Date.now()
        }
      });
      patchError(done, body, 400);
    });

    xit('should respond 400 if request includes related ' +
        'entities as inline content', done => {
      const body = Object.assign({}, C.sensorEntity, {
        Datastream: {
          Datastream: C.datastreamEntity
        }
      });
      patchError(done, body, 400);
    });

    it('should respond 404 if request tries to update ' +
        'a Sensor that does not exist', done => {
      sensorId = 0;
      patchError(done, C.sensorEntity, 404, E.ERRNO_RESOURCE_NOT_FOUND,
                 E.NOT_FOUND);
    });

    it('should respond 200 if request to update a ' +
        'single property of a Sensor is valid', done => {
      patchSuccess(done, C.sensorEntity);
    });

    it('should respond 200 if request to update all ' +
        'the properties of a Sensor is valid', done => {
      const body = {
        name: 'anotherName'
      };
      patchSuccess(done, body, Object.assign({}, C.sensorEntity, body));
    });

    it('should respond 200 if request to update a ' +
        'Sensor tries to update Sensor id', done => {
      const body = Object.assign({}, C.sensorEntity, {
        '@iot.id': 'something'
      });
      patchSuccess(done, body);
    });
  });

  describe('DELETE /Sensors(:id)', () => {
    let sensorId;
    const resource = () => {
      return '/Sensors(' + sensorId + ')';
    };

    const deleteError = done => {
      server.delete(resource())
      .expect('Content-Type', /json/)
      .expect(404)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(404);
        const body = res.body;
        body.code.should.be.equal(404);
        body.errno.should.be.equal(E.errnos[E.ERRNO_RESOURCE_NOT_FOUND]);
        body.error.should.be.equal(E.errors[E.NOT_FOUND]);
        done();
      });
    };

    const deleteSuccess = (done) => {
      server.delete(resource())
      .expect(204)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(204);
        db().then(models => {
          Promise.all([
            models.Datastreams.findAndCountAll(),
            models.Sensors.findAndCountAll()
          ]).then(results => {
            // XXX Delete datastreams
            // results[0].count.should.be.equal(0);
            results[1].count.should.be.equal(0);
            done();
          });
        });
      });
    };

    beforeEach(done => {
      sensorId = undefined;
      let Sensors;
      let Datastreams;
      db().then(models => {
        Sensors = models.Sensors;
        Datastreams = models.Datastreams;
        return Promise.all([
          Sensors.destroy({ where: {} }),
          Datastreams.destroy({ where: {} })
        ]);
      }).then(() => {
        const entity = Object.assign({}, C.sensorEntity, {
          datastreams: [ C.datastreamEntity ]
        });
        Sensors.create(entity, {
          include: [{ model: Datastreams, as: 'datastreams' }]
        }).then(sensor => {
          sensorId = sensor.id;
          done();
        });
      });
    });

    it('should respond 404 if request tries to delete ' +
        'a Sensor that does not exist', done => {
      sensorId = 0;
      deleteError(done);
    });

    it('should respond 204 if request to delete a Sensor is valid', done => {
      deleteSuccess(done);
    });
  });

});
