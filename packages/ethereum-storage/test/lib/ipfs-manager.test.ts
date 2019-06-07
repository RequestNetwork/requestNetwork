import 'mocha';

import { StorageTypes } from '@requestnetwork/types';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { EventEmitter } from 'events';
import * as http from 'http';
import IpfsManager from '../../src/lib/ipfs-manager';

// Extends chai for promises
chai.use(chaiAsPromised);
const assert = chai.assert;

const ipfsGatewayConnection: StorageTypes.IIpfsGatewayConnection = {
  host: 'localhost',
  port: 5001,
  protocol: StorageTypes.IpfsGatewayProtocol.HTTP,
  timeout: 1000,
};

const invalidHostIpfsGatewayConnection: StorageTypes.IIpfsGatewayConnection = {
  host: 'nonexistent',
  port: 5001,
  protocol: StorageTypes.IpfsGatewayProtocol.HTTP,
  timeout: 1000,
};

const invalidProtocolIpfsGatewayConnection: StorageTypes.IIpfsGatewayConnection = {
  host: 'localhost',
  port: 5001,
  protocol: 'invalidprotocol' as StorageTypes.IpfsGatewayProtocol,
  timeout: 1000,
};

let ipfsManager: IpfsManager;

const content = 'this is a little test !';
const hash = 'QmNXA5DyFZkdf4XkUT81nmJSo3nS2bL25x7YepxeoDa6tY';

const content2 = 'content\nwith\nspecial\ncharacters\n';
const hash2 = 'QmQj8fQ9T16Ddrxfij5eyRnxXKTVxRXyQuazYnezt9iZpy';

const notAddedHash = 'QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73sNonExisting';

// Content length stored on ipfs is slightly superior to actual content length
// because of some stream data stored into ipfs
const contentLengthOnIpfs = 29;
const contentLengthOnIpfs2 = 38;

// tslint:disable:no-magic-numbers
describe('Ipfs manager', () => {
  beforeEach(() => {
    ipfsManager = new IpfsManager(ipfsGatewayConnection);
  });

  it('allows to verify repository', async () => {
    await ipfsManager.verifyRepository();

    ipfsManager = new IpfsManager(invalidHostIpfsGatewayConnection);
    await assert.isRejected(ipfsManager.verifyRepository(), Error, 'getaddrinfo ENOTFOUND');
  });

  it('allows to connectSwarmPeer repository', async () => {
    const peer = '/ip4/108.129.54.77/tcp/4001/ipfs/QmZz7AHe5i8Vj2hhepfWhPKYpccNQHnAUFnjps2cnZLAPC';
    const swarmPeerAdded = await ipfsManager.connectSwarmPeer(peer);
    assert.equal(peer, swarmPeerAdded);
  });

  it('cannot connectSwarmPeer if ipfs is not reachable', async () => {
    const peer = '/ip4/108.129.54.77/tcp/4001/ipfs/QmZz7AHe5i8Vj2hhepfWhPKYpccNQHnAUFnjps2cnZLAPC';
    ipfsManager = new IpfsManager(invalidHostIpfsGatewayConnection);
    await assert.isRejected(ipfsManager.connectSwarmPeer(peer), Error, 'getaddrinfo ENOTFOUND');
  });

  it('allows to add files to ipfs', async () => {
    let hashReturned = await ipfsManager.add(content);
    assert.equal(hash, hashReturned);

    hashReturned = await ipfsManager.add(content2);
    assert.equal(hash2, hashReturned);
  });

  it('allows to pin one file ipfs', async () => {
    const pinnedHash = await ipfsManager.pin([hash]);
    assert.equal(hash, pinnedHash[0]);
  });

  it('allows to pin multiple files to ipfs', async () => {
    const pinnedHashes = await ipfsManager.pin([hash, hash2]);
    assert.deepEqual([hash, hash2], pinnedHashes);
  });

  it('allows to read files from ipfs', async () => {
    await ipfsManager.add(content);
    let contentReturned = await ipfsManager.read(hash);
    assert.equal(content, contentReturned.content);

    await ipfsManager.add(content2);
    contentReturned = await ipfsManager.read(hash2);
    assert.equal(content2, contentReturned.content);
  });

  it('allows to get file size from ipfs', async () => {
    let hashReturned = await ipfsManager.add(content);
    let sizeReturned = await ipfsManager.getContentLength(hashReturned);
    assert.equal(contentLengthOnIpfs, sizeReturned);

    hashReturned = await ipfsManager.add(content2);
    sizeReturned = await ipfsManager.getContentLength(hashReturned);
    assert.equal(contentLengthOnIpfs2, sizeReturned);
  });

  it('operations with a invalid host network should throw ENOTFOUND errors', async () => {
    ipfsManager = new IpfsManager(invalidHostIpfsGatewayConnection);

    await assert.isRejected(ipfsManager.add(content), Error, 'getaddrinfo ENOTFOUND');
    await assert.isRejected(ipfsManager.read(hash), Error, 'getaddrinfo ENOTFOUND');
    await assert.isRejected(ipfsManager.getContentLength(hash), Error, 'getaddrinfo ENOTFOUND');
  });

  it('read a non-existent hash on an existent network should throw a timeout error', async () => {
    await assert.isRejected(ipfsManager.read(notAddedHash), Error, 'Ipfs read request timeout');
  });

  it('getContentLength on a non-existent hash on an existent network should throw a timeout error', async () => {
    await assert.isRejected(
      ipfsManager.getContentLength(notAddedHash),
      Error,
      'Ipfs stat request timeout',
    );
  });

  it('initializing ipfs-manager with default values should not throw an error', async () => {
    assert.doesNotThrow(() => new IpfsManager(), Error);
  });

  it('initializing ipfs-manager with an invalid protocol should throw an error', async () => {
    assert.throws(
      () => new IpfsManager(invalidProtocolIpfsGatewayConnection),
      Error,
      'Protocol not implemented for IPFS',
    );
  });

  it('aborting read request should throw an error', async () => {
    let hookedRequest: any;

    // Hook the get function of the protocol module to allow us to send customized event
    const requestHook = (request: string, _resCallback: any): EventEmitter => {
      // We filter the response of the request to prevent the promise to resolve
      hookedRequest = http.get(request, _res => { });
      return hookedRequest;
    };
    const hookedIpfsConnectionModule = { get: requestHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    setTimeout(() => hookedRequest.emit('abort'), 1000);
    await assert.isRejected(ipfsManager.read(hash), Error, 'Ipfs read request has been aborted');
  });

  it('aborting read request response should throw an error', async () => {
    let hookedRequestResponse: any;

    // Hook the response of the request response to send customized event ot it
    const requestHook = (request: string, resCallback: any): EventEmitter => {
      hookedRequestResponse = new EventEmitter();
      return http.get(request, _res => {
        resCallback(hookedRequestResponse);
      });
    };
    const hookedIpfsConnectionModule = { get: requestHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    setTimeout(() => hookedRequestResponse.emit('aborted'), 1000);
    await assert.isRejected(
      ipfsManager.read(hash),
      Error,
      'Ipfs read request response has been aborted',
    );
  });

  it('error on read request response should throw an error', async () => {
    let hookedRequestResponse: any;

    // Hook the response of the request response to send customized event ot it
    const requestHook = (request: string, resCallback: any): EventEmitter => {
      hookedRequestResponse = new EventEmitter();
      return http.get(request, _res => {
        resCallback(hookedRequestResponse);
      });
    };
    const hookedIpfsConnectionModule = { get: requestHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    setTimeout(() => hookedRequestResponse.emit('error'), 1000);
    await assert.isRejected(ipfsManager.read(hash), Error, 'Ipfs read request response error');
  });

  it('aborting getContentLength request should throw an error', async () => {
    let hookedRequest: any;

    // Hook the get function of the protocol module to allow us to send customized event
    const requestHook = (request: string, _resCallback: any): EventEmitter => {
      hookedRequest = http.get(request, _res => { });
      return hookedRequest;
    };
    const hookedIpfsConnectionModule = { get: requestHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    setTimeout(() => hookedRequest.emit('abort'), 1000);
    await assert.isRejected(
      ipfsManager.getContentLength(hash),
      Error,
      'Ipfs stat request has been aborted',
    );
  });

  it('aborting getContentLength request response should throw an error', async () => {
    let hookedRequestResponse: any;

    // Hook the response of the request response to send customized event ot it
    const requestHook = (request: string, resCallback: any): EventEmitter => {
      hookedRequestResponse = new EventEmitter();
      return http.get(request, _res => {
        resCallback(hookedRequestResponse);
      });
    };
    const hookedIpfsConnectionModule = { get: requestHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    setTimeout(() => hookedRequestResponse.emit('aborted'), 1000);
    await assert.isRejected(
      ipfsManager.getContentLength(hash),
      Error,
      'Ipfs stat request response has been aborted',
    );
  });

  it('error on getContentLength request response should throw an error', async () => {
    let hookedRequestResponse: any;

    // Hook the response of the request response to send customized event ot it
    const requestHook = (request: string, resCallback: any): EventEmitter => {
      hookedRequestResponse = new EventEmitter();
      return http.get(request, _res => {
        resCallback(hookedRequestResponse);
      });
    };
    const hookedIpfsConnectionModule = { get: requestHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    setTimeout(() => hookedRequestResponse.emit('error'), 1000);
    await assert.isRejected(
      ipfsManager.getContentLength(hash),
      Error,
      'Ipfs stat request response error',
    );
  });

  it('empty getContentLength request response should throw an error', async () => {
    let hookedRequestResponse: any;

    // Hook the response of the request response to send customized event ot it
    const requestHook = (request: string, resCallback: any): EventEmitter => {
      hookedRequestResponse = new EventEmitter();
      return http.get(request, _res => {
        resCallback(hookedRequestResponse);
      });
    };
    const hookedIpfsConnectionModule = { get: requestHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    // We emit end event directly, we will call end callball with no response data
    setTimeout(() => hookedRequestResponse.emit('end'), 1000);
    await assert.isRejected(
      ipfsManager.getContentLength(hash),
      Error,
      'Ipfs stat request response cannot be parsed into JSON format',
    );
  });

  it('getContentLength request response with no field DataSize should throw an error', async () => {
    let hookedRequestResponse: any;

    // Hook the response of the request response to send customized event ot it
    const requestHook = (request: string, resCallback: any): EventEmitter => {
      hookedRequestResponse = new EventEmitter();
      return http.get(request, _res => {
        resCallback(hookedRequestResponse);
      });
    };
    const hookedIpfsConnectionModule = { get: requestHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    // We emit custom json data with no DataSize field
    setTimeout(() => hookedRequestResponse.emit('data', `{"name":"John"}`), 500);
    setTimeout(() => hookedRequestResponse.emit('end'), 1000);
    await assert.isRejected(
      ipfsManager.getContentLength(hash),
      Error,
      'Ipfs stat request response has no DataSize field',
    );
  });
});
