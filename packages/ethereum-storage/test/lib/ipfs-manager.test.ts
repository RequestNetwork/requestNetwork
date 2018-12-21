import { Storage as StorageTypes } from '@requestnetwork/types';
import { assert } from 'chai';
import IpfsManager from '../../src/lib/ipfs-manager';

const ipfsGatewayConnection: StorageTypes.IIpfsGatewayConnection = {
  host: 'localhost',
  port: 5001,
  protocol: StorageTypes.IpfsGatewayProtocol.HTTP,
  timeout: 10000,
};
const ipfsManager = new IpfsManager(ipfsGatewayConnection);

const content = 'this is a little test !';
const hash = 'QmNXA5DyFZkdf4XkUT81nmJSo3nS2bL25x7YepxeoDa6tY';

const content2 = 'content\nwith\nspecial\ncharacters\n';
const hash2 = 'QmQj8fQ9T16Ddrxfij5eyRnxXKTVxRXyQuazYnezt9iZpy';

// Content length stored on ipfs is slightly superior to actual content length
// because of some stream data stored into ipfs
const contentLengthOnIpfs = 29;
const contentLengthOnIpfs2 = 38;

describe('Ipfs manager', () => {
  it.skip('Allows to add files to ipfs', async () => {
    let hashReturned = await ipfsManager.add(content);
    assert.equal(hash, hashReturned);

    hashReturned = await ipfsManager.add(content2);
    assert.equal(hash2, hashReturned);
  });

  it.skip('Allows to read files from ipfs', async () => {
    await ipfsManager.add(content);
    let contentReturned = await ipfsManager.read(hash);
    assert.equal(content, contentReturned);

    await ipfsManager.add(content2);
    contentReturned = await ipfsManager.read(hash2);
    assert.equal(content2, contentReturned);
  });

  it.skip('Allows to get file size from ipfs', async () => {
    let hashReturned = await ipfsManager.add(content);
    let sizeReturned = await ipfsManager.getContentLength(
      hashReturned,
    );
    assert.equal(contentLengthOnIpfs, sizeReturned);

    hashReturned = await ipfsManager.add(content2);
    sizeReturned = await ipfsManager.getContentLength(
      hashReturned,
    );
    assert.equal(contentLengthOnIpfs2, sizeReturned);
  });
});
