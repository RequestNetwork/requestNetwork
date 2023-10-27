import { IpfsStorage } from '../src/ipfs-storage';

describe('IPFS Storage', () => {
  let ipfsStorage: IpfsStorage;
  beforeEach(() => {
    jest.resetAllMocks();
    ipfsStorage = new IpfsStorage({ ipfsTimeout: 1000 });
  });
  it('cannot initialize if ipfs node not reachable', async () => {
    const ipfsStorage = new IpfsStorage({
      ipfsUrl: 'http://nonexistent:5001',
      ipfsTimeout: 1500,
      ipfsErrorHandling: { maxRetries: 1, delayBetweenRetries: 0 }, // speedup test
    });
    await expect(ipfsStorage.initialize()).rejects.toThrowError(
      'IPFS node is not accessible or corrupted: Error: getaddrinfo ENOTFOUND nonexistent',
    );
  });
  it('cannot initialize if ipfs node not in the right network', async () => {
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
