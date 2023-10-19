import { StorageTypes } from '@requestnetwork/types';
import { IpfsStorage } from '../src/ipfs-storage.js';

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
  timeout: 10000,
};

const hash1 = 'QmNXA5DyFZkdf4XkUT81nmJSo3nS2bL25x7YepxeoDa6tY';

describe('IPFS Storage', () => {
  let ipfsStorage: IpfsStorage;
  beforeEach(() => {
    jest.resetAllMocks();
    ipfsStorage = new IpfsStorage({ ipfsGatewayConnection });
  });
  it('cannot initialize if ipfs node not reachable', async () => {
    const ipfsStorage = new IpfsStorage({
      ipfsGatewayConnection: invalidHostIpfsGatewayConnection,
    });
    await expect(ipfsStorage.initialize()).rejects.toThrowError(
      'IPFS node is not accessible or corrupted: Error: getaddrinfo ENOTFOUND nonexistent',
    );
  });
  it('cannot initialize if ipfs node not in the right network', async () => {
    const ipfsStorage = new IpfsStorage({
      ipfsGatewayConnection,
    });
    jest
      .spyOn((ipfsStorage as any).ipfsManager, 'getBootstrapList')
      .mockImplementation(async () => ['not findable node']);

    await expect(ipfsStorage.initialize()).rejects.toThrowError(
      `The list of bootstrap node in the ipfs config don't match the expected bootstrap nodes`,
    );
  });

  it('cannot append if ipfs add fail', async () => {
    jest.spyOn((ipfsStorage as any).ipfsManager, 'add').mockImplementation(() => {
      throw Error('expected error');
    });
    await expect(ipfsStorage.ipfsAdd('this is a test')).rejects.toThrowError(
      `Ipfs add request error: Error: expected error`,
    );
  });

  it('failed getContentLength from ipfs-manager in append and read functions should throw an error', async () => {
    jest
      .spyOn((ipfsStorage as any).ipfsManager, 'getContentLength')
      .mockImplementation(async () => {
        throw Error('Any error in getContentLength');
      });
    await expect(ipfsStorage.ipfsAdd('this is a test')).rejects.toThrowError(
      'Ipfs get length request error',
    );
  });

  it('allows to IPFS pin a list of hashes', async () => {
    const spy = jest
      .spyOn((ipfsStorage as any).ipfsManager, 'pin')
      .mockReturnValue(Promise.resolve(['']));

    const pinConfig = {
      delayBetweenCalls: 0,
      maxSize: 100,
      timeout: 1000,
    };

    let hashes = new Array(100).fill(hash1);

    await ipfsStorage.pinDataToIPFS(hashes, pinConfig);

    expect(spy).toHaveBeenCalledTimes(1);

    hashes = new Array(200).fill(hash1);
    await ipfsStorage.pinDataToIPFS(hashes, pinConfig);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('pinning errors are non blocking', async () => {
    const warnLogMock = jest.spyOn((ipfsStorage as any).logger, 'warn');
    jest.spyOn((ipfsStorage as any).ipfsManager, 'pin').mockImplementation(() => {
      throw new Error('expected error');
    });

    await ipfsStorage.pinDataToIPFS([hash1]);
    expect(warnLogMock).toHaveBeenCalledWith(
      'Failed pinning some hashes the IPFS node: Error: expected error',
      ['ipfs'],
    );
  });

  describe('compareBootstrapNodes', () => {
    describe.each(['ipfs', 'p2p'])('It supports the %s path', (path) => {
      it('Returns true for same list', () => {
        expect(
          IpfsStorage.hasRequiredBootstrapNodes([
            `/dns4/ipfs-survival.request.network/tcp/4001/${path}/Qmb6a5DH45k8JwLdLVZUhRhv1rnANpsbXjtsH41esGhNCh`,
            `/dns4/ipfs-2.request.network/tcp/4001/${path}/QmPBPgTDVjveRu6KjGVMYixkCSgGtVyV8aUe6wGQeLZFVd`,
            `/dns4/ipfs-bootstrap-2.request.network/tcp/4001/${path}/QmYdcSoVNU1axgSnkRAyHtwsKiSvFHXeVvRonGCAV9LVEj`,
            `/dns4/ipfs-bootstrap.request.network/tcp/4001/${path}/QmaSrBXFBaupfeGMTuigswtKtsthbVaSonurjTV967Fdxx`,
          ]),
        ).toBeTruthy();
      });

      it('Returns false for additional items', () => {
        expect(
          IpfsStorage.hasRequiredBootstrapNodes([
            `/dns4/ipfs-survival.request.network/tcp/4001/${path}/Qmb6a5DH45k8JwLdLVZUhRhv1rnANpsbXjtsH41esGhNCh`,
            `/dns4/ipfs-2.request.network/tcp/4001/${path}/QmPBPgTDVjveRu6KjGVMYixkCSgGtVyV8aUe6wGQeLZFVd`,
            `/dns4/ipfs-bootstrap-2.request.network/tcp/4001/${path}/QmYdcSoVNU1axgSnkRAyHtwsKiSvFHXeVvRonGCAV9LVEj`,
            `/dns4/ipfs-bootstrap.request.network/tcp/4001/${path}/QmaSrBXFBaupfeGMTuigswtKtsthbVaSonurjTV967Fdxx`,
            `/dns4/ipfs-bootstrap-NONEXISTANT.request.network/tcp/4001/${path}/QmaSrBXFBaupfeGMTuigswtKtsthbVaSonurjTV967FaKe`,
          ]),
        ).toBeTruthy();
      });

      it('Returns false for missing items', () => {
        expect(
          IpfsStorage.hasRequiredBootstrapNodes([
            `/dns4/ipfs-survival.request.network/tcp/4001/${path}/Qmb6a5DH45k8JwLdLVZUhRhv1rnANpsbXjtsH41esGhNCh`,
            `/dns4/ipfs-2.request.network/tcp/4001/${path}/QmPBPgTDVjveRu6KjGVMYixkCSgGtVyV8aUe6wGQeLZFVd`,
            `/dns4/ipfs-bootstrap-2.request.network/tcp/4001/${path}/QmYdcSoVNU1axgSnkRAyHtwsKiSvFHXeVvRonGCAV9LVEj`,
          ]),
        ).toBeFalsy();
      });
    });
  });
});
