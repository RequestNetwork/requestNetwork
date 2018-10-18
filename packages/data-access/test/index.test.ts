import { assert } from 'chai';
import { DataAccess } from '../src/index';

describe('index', () => {
  it('needs tests', () => {
    const fakeStorage = {
      add: () => '1',
      read: () => '2',
    };
    const dataAccess = new DataAccess(fakeStorage);
    assert.equal(dataAccess.persist(), '1');
  });
});
