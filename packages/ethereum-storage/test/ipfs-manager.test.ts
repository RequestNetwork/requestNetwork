import { StorageTypes } from '@requestnetwork/types';
import IpfsManager from '../src/ipfs-manager';
import { AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';

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

/* eslint-disable no-magic-numbers */
describe('Ipfs manager', () => {
  beforeEach(() => {
    ipfsManager = new IpfsManager({
      ipfsGatewayConnection,
      ipfsErrorHandling: testErrorHandling,
    });
  });

  it('initializing ipfs-manager with default values should not throw any error', async () => {
    expect(() => new IpfsManager()).not.toThrow();
  });

  it('allows to verify repository', async () => {
    await ipfsManager.getIpfsNodeId();
    await expect(ipfsManager.getIpfsNodeId()).resolves.toMatchObject({ ID: /.+/ });
  });

  it('allows to get the bootstrap list', async () => {
    const bootstrapList = await ipfsManager.getBootstrapList();
    expect(bootstrapList).toHaveProperty('length');
  });

  it('allows to add files to ipfs', async () => {
    const hashReturned1 = await ipfsManager.add(content);
    expect(hashReturned1).toBe(hash);

    const hashReturned2 = await ipfsManager.add(content2);
    expect(hashReturned2).toBe(hash2);
  });

  it('allows to pin one file ipfs', async () => {
    await ipfsManager.add(content);
    const pinnedHash = await ipfsManager.pin([hash]);
    expect(hash).toBe(pinnedHash[0]);
  });

  it('allows to pin multiple files to ipfs', async () => {
    await ipfsManager.add(content);
    await ipfsManager.add(content2);
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
    const bigContent = '#'.repeat(550);
    const maxSize = 10;
    const hash = await ipfsManager.add(bigContent);
    await expect(ipfsManager.read(hash, maxSize)).rejects.toThrowError(
      `maxContentLength size of 500 exceeded`,
    );
  });

  it('allows to get file size from ipfs', async () => {
    await ipfsManager.add(content);
    let sizeReturned = await ipfsManager.getContentLength(hash);
    expect(contentLengthOnIpfs).toEqual(sizeReturned);

    await ipfsManager.add(content2);
    sizeReturned = await ipfsManager.getContentLength(hash2);
    expect(contentLengthOnIpfs2).toEqual(sizeReturned);
  });

  it('operations with a invalid host network should throw ENOTFOUND errors', async () => {
    ipfsManager = new IpfsManager({
      ipfsGatewayConnection: invalidHostIpfsGatewayConnection,
      ipfsErrorHandling: testErrorHandling,
    });
    await expect(ipfsManager.getIpfsNodeId()).rejects.toThrowError('getaddrinfo ENOTFOUND');
    await expect(ipfsManager.getBootstrapList()).rejects.toThrowError('getaddrinfo ENOTFOUND');
    await expect(ipfsManager.add(content)).rejects.toThrowError('getaddrinfo ENOTFOUND');
    await expect(ipfsManager.read(hash)).rejects.toThrowError('getaddrinfo ENOTFOUND');
    await expect(ipfsManager.getContentLength(hash)).rejects.toThrowError('getaddrinfo ENOTFOUND');
  }, 10000);

  it('reading a non-existent hash should throw a timeout error', async () => {
    await expect(ipfsManager.read(notAddedHash)).rejects.toThrowError('timeout of 1000ms exceeded');
  });

  it('getContentLength on a non-existent hash should throw a timeout error', async () => {
    await expect(ipfsManager.getContentLength(notAddedHash)).rejects.toThrowError(
      'timeout of 1000ms exceeded',
    );
  });

  it('should retry on error', async () => {
    ipfsManager = new IpfsManager({
      ipfsGatewayConnection,
      ipfsErrorHandling: retryTestErrorHandling,
    });
    const axiosInstance: AxiosInstance = (ipfsManager as any).axiosInstance;
    const axiosInstanceMock = new MockAdapter(axiosInstance);
    axiosInstanceMock.onAny().networkError();
    await expect(ipfsManager.read(hash)).rejects.toThrowError('Network Error');
    expect(axiosInstanceMock.history.get.length).toBe(retryTestErrorHandling.maxRetries + 1);
  });

  it('timeout errors should not generate any retry', async () => {
    ipfsManager = new IpfsManager({
      ipfsGatewayConnection: { ...ipfsGatewayConnection, timeout: 1 },
      ipfsErrorHandling: retryTestErrorHandling,
    });
    const axiosInstance: AxiosInstance = (ipfsManager as any).axiosInstance;
    const axiosInstanceMock = new MockAdapter(axiosInstance);
    axiosInstanceMock.onAny().timeout();
    await expect(ipfsManager.add('test')).rejects.toThrowError('timeout of 1ms exceeded');
    // only one request should have been sent, no retry should happen on timeouts
    expect(axiosInstanceMock.history.post.length).toBe(1);
  });

  it('added and read files should have the same size and content', async () => {
    let content = `{
  test;
\ttest again tab
  spéci@l çhàractêrs
}`;
    const lengthyString = '='.repeat(10000);
    content += lengthyString;
    const contentSize = Buffer.from(content, 'utf-8').length;
    const hash = await ipfsManager.add(content);
    const contentSizeOnIPFS = await ipfsManager.getContentLength(hash);
    const contentRead = await ipfsManager.read(hash, contentSizeOnIPFS);
    expect(contentRead.ipfsSize).toEqual(contentSizeOnIPFS);
    const contentReadSize = Buffer.from(contentRead.content, 'utf-8').length;
    expect(contentReadSize).toBe(contentSize);
    expect(contentRead.content).toBe(content);
  });
});
