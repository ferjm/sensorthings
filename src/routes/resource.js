import db         from '../models/db';
import express    from 'express';
import response   from '../response';

import * as ERR   from '../errors';

module.exports = function resource(endpoint, exclude, associations = []) {

  const handleModelError = res => {
    return err => {
      switch (err.name) {
        case ERR.modelErrors[ERR.VALIDATION_ERROR]:
          ERR.ApiError(res, 400, ERR.ERRNO_VALIDATION_ERROR, ERR.BAD_REQUEST,
                       JSON.stringify(err.errors));
          break;
        case ERR.NOT_FOUND:
          ERR.ApiError(res, 404, ERR.ERRNO_RESOURCE_NOT_FOUND, ERR.NOT_FOUND,
                       JSON.stringify(err.errors));
          break;
        default:
          ERR.ApiError(res, 400, err.errno || ERR.ERRNO_BAD_REQUEST,
                       ERR.BAD_REQUEST, JSON.stringify(err.errors));
      }
    };
  };

  let router = express.Router({ mergeParams: true });

  router.get('', (req, res) => {
    db().then(models => {
      if (req.params && req.params[0]) {
        models[endpoint].findById(req.params[0], {
          attributes: { exclude }
        }).then(instance => {
          if (!instance) {
            return ERR.ApiError(res, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                                ERR.NOT_FOUND);
          }
          res.status(200).send(response.generate(instance, associations));
        });
      } else {
        models[endpoint].findAll({
          attributes: { exclude }
        }).then(instances => {
          res.status(200).send(response.generate(instances, associations));
        });
      }
    }).catch(() => {
      ERR.ApiError(res, 500, ERR.ERRNO_INTERNAL_ERROR, ERR.INTERNAL_ERROR);
    });
  });

  router.post('/', (req, res) => {
    db().then(models => {
      models.createInstance(endpoint, req.body).then(instance => {
        // XXX #13 Response urls should be absolute
        res.location('/' + endpoint + '(' + instance.id + ')');
        res.status(201).send(response.generate(instance, associations));
      }).catch(handleModelError(res));
    }).catch(() => {
      ERR.ApiError(res, 500, ERR.ERRNO_INTERNAL_ERROR, ERR.INTERNAL_ERROR);
    });
  });

  router.patch('', (req, res) => {
    const id = req.params && req.params[0];
    if (!id) {
      return ERR.ApiError(res, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                          ERR.NOT_FOUND);
    }

    db().then(models => {
      Reflect.deleteProperty(req.body, 'id');
      models.updateInstance(endpoint, id, req.body, exclude)
      .then(instance => {
        res.location('/' + endpoint + '(' + id + ')');
        res.status(200).json(response.generate(instance, associations));
      }).catch(handleModelError(res));
    }).catch(() => {
      ERR.ApiError(res, 500, ERR.ERRNO_INTERNAL_ERROR, ERR.INTERNAL_ERROR);
    });
  });

  router.delete('', (req, res) => {
    if (!req.params || !req.params[0]) {
      return ERR.ApiError(res, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                          ERR.NOT_FOUND);
    }

    db().then(models => {
      models[endpoint].destroy({
        where: { id: req.params[0] }
      }).then(count => {
        if (!count) {
          return ERR.ApiError(res, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                              ERR.NOT_FOUND);
        }
        res.status(204).send();
      });
    }).catch(() => {
      ERR.ApiError(res, 500, ERR.ERRNO_INTERNAL_ERROR, ERR.INTERNAL_ERROR);
    });
  });

  return router;
};
