import { assert } from 'chai';
import { EthereumStorage } from '../src/index';

describe('index', () => {
  it('needs tests', async () => {
    const ethereumStorage = new EthereumStorage();
    assert.equal(await ethereumStorage.append(), '1');
  });
});
