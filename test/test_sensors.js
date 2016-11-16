import commonTests  from './common';
import * as CONST   from './constants';
import {
  BAD_REQUEST,
  ERRNO_VALIDATION_ERROR
} from '../src/errors';

const mandatory     = ['name', 'description', 'encodingType'];
const optional      = ['metadata'];
const associations  = { 'Datastreams': 'Datastreams' };

const tester = commonTests('Sensors', mandatory, optional, associations);

describe('Sensors API - specific', () => {
  describe('Check invalid ecodingTypes', () => {

    [CONST.encodingTypes.UNKNOWN,
     CONST.encodingTypes.GEO_JSON,
     CONST.encodingTypes.TEXT_HTML,
     CONST.encodingTypes.LOCATION_TYPE].forEach(type => {
      it('should respond 400 if encodingType is ' + type,
        done => {
        const body = Object.assign({}, CONST.SensorsEntity, {
          encodingType: type,
        });
        tester.postError(done, body, 400, ERRNO_VALIDATION_ERROR, BAD_REQUEST);
      });
    });
  });
});
