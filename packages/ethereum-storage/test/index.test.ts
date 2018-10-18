import { assert } from 'chai';
import { EthereumStorage } from '../src/index';

describe('index', () => {
  it('needs tests', () => {
    const ethereumStorage = new EthereumStorage();
    assert.equal(ethereumStorage.add(), '1');
  });
});
