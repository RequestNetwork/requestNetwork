import { assert } from 'chai';
import { RequestLogic } from '../src/index';

describe('index', () => {
  it('needs tests', () => {
    const fakeDataAccess = {
      get: () => '1',
      persist: () => '2',
    };
    const requestLogic = new RequestLogic(fakeDataAccess);
    assert.equal(requestLogic.createRequest(), '2');
  });
});
