/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

/* global run */

'use strict';

import app           from './server';
import db            from '../src/models/db';
import should        from 'should';
import supertest     from 'supertest';

import * as CONST from './constants';
import * as ERR   from '../src/errors';

const ERRORS   = ERR.errors;
const ERRNOS   = ERR.errnos;
const entities = CONST.entities;

const server = supertest.agent(app);

const prepath = '/v1.0/';
const getError = (done, endpoint, code, errno, error) => {
  server.get(prepath + endpoint)
  .expect('Content-Type', /json/)
  .expect(code)
  .end((err, res) => {
    should.not.exist(err);
    res.status.should.be.equal(code);
    res.body.code.should.be.equal(code);
    res.body.errno.should.be.equal(errno);
    res.body.error.should.be.equal(error);
    done();
  });
}

db().then(models => {

  let noAssociations = {};
  Object.keys(entities).forEach(entity => {
    noAssociations[entity] = [];
    const associations = models[entity].associations;
    const singularEntities = Object.keys(entities).map(plural => {
      return entities[plural]
    });
    Object.keys(entities).concat(singularEntities).forEach(entity_ => {
      if (!associations[entity_] && entity !== entity_) {
        noAssociations[entity].push(entity_);
      }
    });
  });

  describe('Associations', () => {
    describe('Invalid associations', () => {
      Object.keys(entities).forEach(model => {
        noAssociations[model].forEach(anotherModel => {
          const endpoint = model + '(1)/' + anotherModel;
          it('GET ' + endpoint + ' should respond 400 errno 102 ' +
             'INVALID_ASSOCIATION', done => {
            getError(done, endpoint, 400, ERRNOS[ERR.ERRNO_INVALID_ASSOCIATION],
                     ERRORS[ERR.BAD_REQUEST]);
          });
        });
      });
    });

    describe('Valid associations but not found entity', () => {
      let ids = {};
      beforeEach(done => {
        const promises = Object.keys(entities).map(modelName => {
          return models[modelName].destroy({ where: {} }).then(() => {
            return models[modelName].create(CONST[modelName + 'Entity']);
          }).then(result => {
            ids[modelName] = result.id;
          });
        });
        Promise.all(promises).then(() => {
          done();
        });
      });

      Object.keys(entities).forEach(model => {
        Object.keys(models[model].associations).forEach(association => {
          let endpoint = model + '(id)/' + association;
          switch (models[model].associations[association].associationType) {
            case 'HasMany':
            case 'BelongsToMany':
              it('GET ' + endpoint + ' should respond 200 with an empty array ',
                 done => {
                endpoint = endpoint.replace('id', ids[model]);
                server.get(prepath + endpoint)
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                  should.not.exist(err);
                  res.status.should.be.equal(200);
                  res.body['@iot.count'].should.be.equal(0);
                  res.body.value.should.be.deepEqual([]);
                  done();
                });
              });
            break;

            case 'HasOne':
            case 'BelongsTo':
              it('GET ' + endpoint + ' should respond 404 errno 404 ' +
                 'RESOURCE_NOT_FOUND', done => {
                endpoint = endpoint.replace('id', ids[model]);
                const NOT_FOUND_ERRNO = ERRNOS[ERR.ERRNO_RESOURCE_NOT_FOUND];
                getError(done, endpoint, 404, NOT_FOUND_ERRNO,
                         ERRORS[ERR.NOT_FOUND]);
              });
            break;
            default:
              throw new Error('Something went wrong. Invalid association');
          }
        });
      });

      // Using --delay and run() allows us to build a suite that is the result
      // of an asynchronous computation like getting the models from the db.
      run();
    });
  });
});
