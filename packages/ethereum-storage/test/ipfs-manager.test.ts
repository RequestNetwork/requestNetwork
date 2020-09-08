import { StorageTypes } from '@requestnetwork/types';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { EventEmitter } from 'events';
import * as http from 'http';
import IpfsManager from '../src/ipfs-manager';

const spies = require('chai-spies');

// Extends chai for promises
chai.use(chaiAsPromised);
chai.use(spies);
const assert = chai.assert;
const expect = chai.expect;

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
    await assert.isRejected(ipfsManager.getIpfsNodeId(), Error, 'getaddrinfo ENOTFOUND');
  });

  it('allows to get the bootstrap list', async () => {
    const bootstrapList = await ipfsManager.getBootstrapList();
    assert.isArray(bootstrapList);
  });

  it(
    'must throw if the ipfs node is not reachable when using getBootstrapList()',
    async () => {
      ipfsManager = new IpfsManager(invalidHostIpfsGatewayConnection, testErrorHandling);
      await assert.isRejected(ipfsManager.getBootstrapList(), Error, 'getaddrinfo ENOTFOUND');
    }
  );

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
    let contentReturned = await ipfsManager.read(hash, 82);
    assert.equal(content, contentReturned.content);

    await ipfsManager.add(content2);
    contentReturned = await ipfsManager.read(hash2);
    assert.equal(content2, contentReturned.content);
  });

  it('must throw if max size reached', async () => {
    await ipfsManager.add(content);

    const maxSize = 10;
    await assert.isRejected(
      ipfsManager.read(hash, maxSize),
      Error,
      `File size (82) exceeds maximum file size of ${maxSize}`,
    );
  });

  it('allows to get file size from ipfs', async () => {
    let hashReturned = await ipfsManager.add(content);
    let sizeReturned = await ipfsManager.getContentLength(hashReturned);
    assert.equal(contentLengthOnIpfs, sizeReturned);

    hashReturned = await ipfsManager.add(content2);
    sizeReturned = await ipfsManager.getContentLength(hashReturned);
    assert.equal(contentLengthOnIpfs2, sizeReturned);
  });

  it(
    'operations with a invalid host network should throw ENOTFOUND errors',
    async () => {
      ipfsManager = new IpfsManager(invalidHostIpfsGatewayConnection, testErrorHandling);

      await assert.isRejected(ipfsManager.add(content), Error, 'getaddrinfo ENOTFOUND');
      await assert.isRejected(ipfsManager.read(hash), Error, 'getaddrinfo ENOTFOUND');
      await assert.isRejected(ipfsManager.getContentLength(hash), Error, 'getaddrinfo ENOTFOUND');
    }
  );

  it(
    'read a non-existent hash on an existent network should throw a timeout error',
    async () => {
      await assert.isRejected(ipfsManager.read(notAddedHash), Error, 'Ipfs read request timeout');
    }
  );

  it(
    'getContentLength on a non-existent hash on an existent network should throw a timeout error',
    async () => {
      await assert.isRejected(
        ipfsManager.getContentLength(notAddedHash),
        Error,
        'Ipfs stat request timeout',
      );
    }
  );

  it(
    'initializing ipfs-manager with default values should not throw an error',
    async () => {
      assert.doesNotThrow(() => new IpfsManager(), Error);
    }
  );

  it(
    'initializing ipfs-manager with an invalid protocol should throw an error',
    async () => {
      assert.throws(
        () => new IpfsManager(invalidProtocolIpfsGatewayConnection, testErrorHandling),
        Error,
        'Protocol not implemented for IPFS',
      );
    }
  );

  it('aborting read request should throw an error', async () => {
    let hookedRequest: any;

    // Hook the get function of the protocol module to allow us to send customized event
    const requestHook = (request: string, _resCallback: any): EventEmitter => {
      // We filter the response of the request to prevent the promise to resolve
      hookedRequest = http.get(request, _res => {});
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
      hookedRequest = http.get(request, _res => {});
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

  it(
    'aborting getContentLength request response should throw an error',
    async () => {
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
    }
  );

  it(
    'error on getContentLength request response should throw an error',
    async () => {
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
    }
  );

  it(
    'empty getContentLength request response should throw an error',
    async () => {
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
    }
  );

  it(
    'getContentLength request response with no field DataSize should throw an error',
    async () => {
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
    }
  );

  it('timeout should not retry', async () => {
    ipfsManager = new IpfsManager(ipfsGatewayConnection, retryTestErrorHandling);

    await assert.isRejected(
      ipfsManager.getContentLength(notAddedHash),
      Error,
      'Ipfs stat request timeout',
    );
  });

  it.skip('error on read request should retry', async () => {
    ipfsManager = new IpfsManager(ipfsGatewayConnection, retryTestErrorHandling);
    let hookedGetResponse: any;

    const spy = chai.spy();
    // Hook the response of the request response to send customized event ot it
    const getHook = (request: string, resCallback: any): EventEmitter => {
      hookedGetResponse = new EventEmitter();
      return http.get(request, _res => {
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
    await assert.isRejected(ipfsManager.read(hash), Error, 'Ipfs read request response error');
    expect(spy).to.have.been.called.exactly(5);
  });

  it.skip('error on pin request should retry', async () => {
    ipfsManager = new IpfsManager(ipfsGatewayConnection, retryTestErrorHandling);
    let hookedGetResponse: any;

    const spy = chai.spy();
    // Hook the response of the request response to send customized event ot it
    const getHook = (request: string, resCallback: any): EventEmitter => {
      hookedGetResponse = new EventEmitter();
      return http.get(request, _res => {
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
    await assert.isRejected(ipfsManager.pin([hash]), Error, 'Ipfs pin request response error');
    expect(spy).to.have.been.called.exactly(5);
  });

  it.skip('error on getContentLength request should retry', async () => {
    ipfsManager = new IpfsManager(ipfsGatewayConnection, retryTestErrorHandling);
    let hookedGetResponse: any;

    const spy = chai.spy();
    // Hook the response of the request response to send customized event ot it
    const getHook = (request: string, resCallback: any): EventEmitter => {
      hookedGetResponse = new EventEmitter();
      return http.get(request, _res => {
        spy();
        resCallback(hookedGetResponse);
      });
    };

    const hookedIpfsConnectionModule = { get: getHook };
    ipfsManager.ipfsConnectionModule = hookedIpfsConnectionModule;

    for (let i = 0; i < retryTestErrorHandling.maxRetries + 2; i++) {
      setTimeout(() => hookedGetResponse.emit('error'), 100 + 100 * i);
    }
    await assert.isRejected(
      ipfsManager.getContentLength(hash),
      Error,
      'Ipfs stat request response error',
    );
    expect(spy).to.have.been.called.exactly(5);
  });
});
