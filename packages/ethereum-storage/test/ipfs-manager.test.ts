import { StorageTypes } from '@requestnetwork/types';
import IpfsManager from '../src/ipfs-manager';
import { setupServer } from 'msw/node';
import { HttpResponse, delay, http } from 'msw';

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
      ipfsTimeout: 1000,
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
    expect(pinnedHash[0]).toBe(hash);
  });

  it('allows to pin multiple files to ipfs', async () => {
    await ipfsManager.add(content);
    await ipfsManager.add(content2);
    const pinnedHashes = await ipfsManager.pin([hash, hash2]);
    expect(pinnedHashes).toMatchObject([hash, hash2]);
  });

  it('allows to read files from ipfs', async () => {
    await ipfsManager.add(content);
    let contentReturned = await ipfsManager.read(hash);
    expect(contentReturned.content).toBe(content);

    await ipfsManager.add(content2);
    contentReturned = await ipfsManager.read(hash2);
    expect(contentReturned.content).toBe(content2);
  });

  it('allows to get file size from ipfs', async () => {
    await ipfsManager.add(content);
    let sizeReturned = await ipfsManager.getContentLength(hash);
    expect(sizeReturned).toEqual(contentLengthOnIpfs);

    await ipfsManager.add(content2);
    sizeReturned = await ipfsManager.getContentLength(hash2);
    expect(sizeReturned).toEqual(contentLengthOnIpfs2);
  });

  it('operations with a invalid host network should throw ENOTFOUND errors', async () => {
    ipfsManager = new IpfsManager({
      ipfsUrl: 'http://nonexistent:5001',
      ipfsTimeout: 1500,
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
      ipfsErrorHandling: retryTestErrorHandling,
    });
    const mock = jest.fn();
    const mockServer = setupServer(
      http.all('*', () => {
        mock();
        return HttpResponse.error();
      }),
    );
    mockServer.listen();

    await expect(ipfsManager.read(hash)).rejects.toThrowError('Failed to fetch');
    expect(mock).toHaveBeenCalledTimes(retryTestErrorHandling.maxRetries + 1);
    mockServer.close();
  });

  it('timeout errors should generate retry', async () => {
    ipfsManager = new IpfsManager({
      ipfsTimeout: 1,
      ipfsErrorHandling: retryTestErrorHandling,
    });

    await expect(ipfsManager.add('test')).rejects.toThrowError('timeout of 1ms exceeded');
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
    const contentRead = await ipfsManager.read(hash);
    expect(contentRead.ipfsSize).toEqual(contentSizeOnIPFS);
    const contentReadSize = Buffer.from(contentRead.content, 'utf-8').length;
    expect(contentReadSize).toBe(contentSize);
    expect(contentRead.content).toBe(content);
  });
});
