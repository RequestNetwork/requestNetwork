/* eslint-disable spellcheck/spell-checker */
import { StorageTypes } from '@requestnetwork/types';
import { EventEmitter } from 'events';
import * as http from 'http';
import IpfsManager from '../src/ipfs-manager';

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

const testErrorHandling: StorageTypes.IIpfsErrorHandlingConfiguration = {
  delayBetweenRetries: 0,
  maxRetries: 0,
};

const retryTestErrorHandling: StorageTypes.IIpfsErrorHandlingConfiguration = {
  delayBetweenRetries: 0,
  maxRetries: 3,
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
    ipfsManager = new IpfsManager(ipfsGatewayConnection, testErrorHandling);
  });

  it('allows to verify repository', async () => {
    await ipfsManager.getIpfsNodeId();

    ipfsManager = new IpfsManager(invalidHostIpfsGatewayConnection, testErrorHandling);
    await expect(ipfsManager.getIpfsNodeId()).rejects.toThrowError('getaddrinfo ENOTFOUND');
  });

  it('allows to get the bootstrap list', async () => {
    const bootstrapList = await ipfsManager.getBootstrapList();
    expect(bootstrapList).toHaveProperty('length');
  });

  it('must throw if the ipfs node is not reachable when using getBootstrapList()', async () => {
    ipfsManager = new IpfsManager(invalidHostIpfsGatewayConnection, testErrorHandling);
    await expect(ipfsManager.getBootstrapList()).rejects.toThrowError('getaddrinfo ENOTFOUND');
  });

  it('allows to add files to ipfs', async () => {
    let hashReturned = await ipfsManager.add(content);
    expect(hash).toBe(hashReturned);

    hashReturned = await ipfsManager.add(content2);
    expect(hash2).toBe(hashReturned);
  });

  it('allows to pin one file ipfs', async () => {
    const pinnedHash = await ipfsManager.pin([hash]);
    expect(hash).toBe(pinnedHash[0]);
  });

  it('allows to pin multiple files to ipfs', async () => {
    const pinnedHashes = await ipfsManager.pin([hash, hash2]);
    expect([hash, hash2]).toMatchObject(pinnedHashes);
  });

  it('allows to read files from ipfs', async () => {
    await ipfsManager.add(content);
    let contentReturned = await ipfsManager.read(hash, 36);
    expect(content).toBe(contentReturned.content);

    await ipfsManager.add(content2);
    contentReturned = await ipfsManager.read(hash2);
    expect(content2).toBe(contentReturned.content);
  });

  it('must throw if max size reached', async () => {
    await ipfsManager.add(content);

    const maxSize = 10;
    await expect(ipfsManager.read(hash, maxSize)).rejects.toThrowError(
      `File size (63) exceeds the declared file size (${maxSize})`,
    );
  });

  it('allows to get file size from ipfs', async () => {
    let hashReturned = await ipfsManager.add(content);
    let sizeReturned = await ipfsManager.getContentLength(hashReturned);
    expect(contentLengthOnIpfs).toEqual(sizeReturned);

    hashReturned = await ipfsManager.add(content2);
    sizeReturned = await ipfsManager.getContentLength(hashReturned);
    expect(contentLengthOnIpfs2).toEqual(sizeReturned);
  });

  it('operations with a invalid host network should throw ENOTFOUND errors', async () => {
    ipfsManager = new IpfsManager(invalidHostIpfsGatewayConnection, testErrorHandling);

    await expect(ipfsManager.add(content)).rejects.toThrowError('getaddrinfo ENOTFOUND');
    await expect(ipfsManager.read(hash)).rejects.toThrowError('getaddrinfo ENOTFOUND');
    await expect(ipfsManager.getContentLength(hash)).rejects.toThrowError('getaddrinfo ENOTFOUND');
  }, 10000);

  it('read a non-existent hash on an existent network should throw a timeout error', async () => {
    await expect(ipfsManager.read(notAddedHash)).rejects.toThrowError('Ipfs read request timeout');
  });

  it('getContentLength on a non-existent hash on an existent network should throw a timeout error', async () => {
    await expect(ipfsManager.getContentLength(notAddedHash)).rejects.toThrowError(
      'Ipfs stat request timeout',
    );
  });

  it('initializing ipfs-manager with default values should not throw an error', async () => {
    expect(() => new IpfsManager()).not.toThrow();
  });

  it('initializing ipfs-manager with an invalid protocol should throw an error', async () => {
    expect(
      () => new IpfsManager(invalidProtocolIpfsGatewayConnection, testErrorHandling),
    ).toThrowError('Protocol not implemented for IPFS');
  });

  it('aborting read request should throw an error', async () => {
    let hookedRequest: any;

    // Hook the get function of the protocol module to allow us to send customized event
    const requestHook = (request: string, _resCallback: any): EventEmitter => {
      // We filter the response of the request to prevent the promise to resolve
      // tslint:disable-next-line:no-empty
      hookedRequest = http.get(request, (_res) => {});
      return hookedRequest;
    };
    const hookedIpfsConnectionModule = { get: requestHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    setTimeout(() => hookedRequest.emit('abort'), 1000);
    await expect(ipfsManager.read(hash)).rejects.toThrowError('Ipfs read request has been aborted');
  });

  it('aborting read request response should throw an error', async () => {
    let hookedRequestResponse: any;

    // Hook the response of the request response to send customized event ot it
    const requestHook = (request: string, resCallback: any): EventEmitter => {
      hookedRequestResponse = new EventEmitter();
      return http.get(request, (_res) => {
        resCallback(hookedRequestResponse);
      });
    };
    const hookedIpfsConnectionModule = { get: requestHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    setTimeout(() => hookedRequestResponse.emit('aborted'), 1000);
    await expect(ipfsManager.read(hash)).rejects.toThrowError(
      'Ipfs read request response has been aborted',
    );
  });

  it('error on read request response should throw an error', async () => {
    let hookedRequestResponse: any;

    // Hook the response of the request response to send customized event ot it
    const requestHook = (request: string, resCallback: any): EventEmitter => {
      hookedRequestResponse = new EventEmitter();
      return http.get(request, (_res) => {
        resCallback(hookedRequestResponse);
      });
    };
    const hookedIpfsConnectionModule = { get: requestHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    setTimeout(() => hookedRequestResponse.emit('error'), 1000);
    await expect(ipfsManager.read(hash)).rejects.toThrowError('Ipfs read request response error');
  });

  it('aborting getContentLength request should throw an error', async () => {
    let hookedRequest: any;

    // Hook the get function of the protocol module to allow us to send customized event
    const requestHook = (request: string, _resCallback: any): EventEmitter => {
      // tslint:disable-next-line:no-empty
      hookedRequest = http.get(request, (_res) => {});
      return hookedRequest;
    };
    const hookedIpfsConnectionModule = { get: requestHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    setTimeout(() => hookedRequest.emit('abort'), 1000);
    await expect(ipfsManager.getContentLength(hash)).rejects.toThrowError(
      'Ipfs stat request has been aborted',
    );
  });

  it('aborting getContentLength request response should throw an error', async () => {
    let hookedRequestResponse: any;

    // Hook the response of the request response to send customized event ot it
    const requestHook = (request: string, resCallback: any): EventEmitter => {
      hookedRequestResponse = new EventEmitter();
      return http.get(request, (_res) => {
        resCallback(hookedRequestResponse);
      });
    };
    const hookedIpfsConnectionModule = { get: requestHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    setTimeout(() => hookedRequestResponse.emit('aborted'), 1000);
    await expect(ipfsManager.getContentLength(hash)).rejects.toThrowError(
      'Ipfs stat request response has been aborted',
    );
  });

  it('error on getContentLength request response should throw an error', async () => {
    let hookedRequestResponse: any;

    // Hook the response of the request response to send customized event ot it
    const requestHook = (request: string, resCallback: any): EventEmitter => {
      hookedRequestResponse = new EventEmitter();
      return http.get(request, (_res) => {
        resCallback(hookedRequestResponse);
      });
    };
    const hookedIpfsConnectionModule = { get: requestHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    setTimeout(() => hookedRequestResponse.emit('error'), 1000);
    await expect(ipfsManager.getContentLength(hash)).rejects.toThrowError(
      'Ipfs stat request response error',
    );
  });

  it('empty getContentLength request response should throw an error', async () => {
    let hookedRequestResponse: any;

    // Hook the response of the request response to send customized event ot it
    const requestHook = (request: string, resCallback: any): EventEmitter => {
      hookedRequestResponse = new EventEmitter();
      return http.get(request, (_res) => {
        resCallback(hookedRequestResponse);
      });
    };
    const hookedIpfsConnectionModule = { get: requestHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    // We emit end event directly, we will call end callball with no response data
    setTimeout(() => hookedRequestResponse.emit('end'), 1000);
    await expect(ipfsManager.getContentLength(hash)).rejects.toThrowError(
      'Ipfs stat request response cannot be parsed into JSON format',
    );
  });

  it('getContentLength request response with no field DataSize should throw an error', async () => {
    let hookedRequestResponse: any;

    // Hook the response of the request response to send customized event ot it
    const requestHook = (request: string, resCallback: any): EventEmitter => {
      hookedRequestResponse = new EventEmitter();
      return http.get(request, (_res) => {
        resCallback(hookedRequestResponse);
      });
    };
    const hookedIpfsConnectionModule = { get: requestHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    // We emit custom json data with no DataSize field
    setTimeout(() => hookedRequestResponse.emit('data', `{"name":"John"}`), 500);
    setTimeout(() => hookedRequestResponse.emit('end'), 1000);
    await expect(ipfsManager.getContentLength(hash)).rejects.toThrowError(
      'Ipfs stat request response has no DataSize field',
    );
  });

  it('timeout should not retry', async () => {
    ipfsManager = new IpfsManager(ipfsGatewayConnection, retryTestErrorHandling);

    await expect(ipfsManager.getContentLength(notAddedHash)).rejects.toThrowError(
      'Ipfs stat request timeout',
    );
  });

  it.skip('error on read request should retry', async () => {
    ipfsManager = new IpfsManager(ipfsGatewayConnection, retryTestErrorHandling);
    let hookedGetResponse: any;

    const spy = jest.fn();
    // Hook the response of the request response to send customized event ot it
    const getHook = (request: string, resCallback: any): EventEmitter => {
      hookedGetResponse = new EventEmitter();
      return http.get(request, (_res) => {
        spy();
        resCallback(hookedGetResponse);
      });
    };

    const hookedIpfsConnectionModule = { get: getHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    // Fails for the original request, the retries and the last one that will fail
    for (let i = 0; i < retryTestErrorHandling.maxRetries + 2; i++) {
      setTimeout(() => hookedGetResponse.emit('error'), 100 + 100 * i);
    }
    await expect(ipfsManager.read(hash)).rejects.toThrowError('Ipfs read request response error');
    expect(spy).toHaveBeenCalledTimes(5);
  });

  it.skip('error on pin request should retry', async () => {
    ipfsManager = new IpfsManager(ipfsGatewayConnection, retryTestErrorHandling);
    let hookedGetResponse: any;

    const spy = jest.fn();
    // Hook the response of the request response to send customized event ot it
    const getHook = (request: string, resCallback: any): EventEmitter => {
      hookedGetResponse = new EventEmitter();
      return http.get(request, (_res) => {
        spy();
        resCallback(hookedGetResponse);
      });
    };
    const hookedIpfsConnectionModule = { get: getHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    // Fails for the original request, the retries and the last one that will fail
    for (let i = 0; i < retryTestErrorHandling.maxRetries + 2; i++) {
      setTimeout(() => hookedGetResponse.emit('error'), 100 + 100 * i);
    }
    await expect(ipfsManager.pin([hash])).rejects.toThrowError('Ipfs pin request response error');
    expect(spy).toHaveBeenCalledTimes(5);
  });

  it.skip('error on getContentLength request should retry', async () => {
    ipfsManager = new IpfsManager(ipfsGatewayConnection, retryTestErrorHandling);
    let hookedGetResponse: any;

    const spy = jest.fn();
    // Hook the response of the request response to send customized event ot it
    const getHook = (request: string, resCallback: any): EventEmitter => {
      hookedGetResponse = new EventEmitter();
      return http.get(request, (_res) => {
        spy();
        resCallback(hookedGetResponse);
      });
    };

    const hookedIpfsConnectionModule = { get: getHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    for (let i = 0; i < retryTestErrorHandling.maxRetries + 2; i++) {
      setTimeout(() => hookedGetResponse.emit('error'), 100 + 100 * i);
    }
    await expect(ipfsManager.getContentLength(hash)).rejects.toThrowError(
      'Ipfs stat request response error',
    );
    expect(spy).toHaveBeenCalledTimes(5);
  });
});
