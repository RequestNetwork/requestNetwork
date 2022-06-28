import { providers } from 'ethers';
import { getDefaultProvider, initPaymentDetectionApiKeys, setProviderFactory } from '../src';

describe('getDefaultProvider', () => {
  afterEach(() => {
    // reset the provider factory
    setProviderFactory();
  });

  it('Defaults to Infura Mainnet', async () => {
    const provider = getDefaultProvider();

    expect(provider).toBeInstanceOf(providers.InfuraProvider);
    await expect(provider.getNetwork()).resolves.toMatchObject({ chainId: 1 });
  });

  it('Can take a standard network (Rinkeby)', async () => {
    const provider = getDefaultProvider('rinkeby');

    expect(provider).toBeInstanceOf(providers.InfuraProvider);
    await expect(provider.getNetwork()).resolves.toMatchObject({ chainId: 4 });
  });

  it('Can take a standard network (Goerli)', async () => {
    const provider = getDefaultProvider('goerli');

    expect(provider).toBeInstanceOf(providers.InfuraProvider);
    await expect(provider.getNetwork()).resolves.toMatchObject({ chainId: 5 });
  });

  it('Can take a private network', async () => {
    const provider = getDefaultProvider('private') as providers.JsonRpcProvider;

    expect(provider).toBeInstanceOf(providers.JsonRpcProvider);
    expect(provider.connection.url).toBe('http://localhost:8545');
  });

  it('Can take a non-standard network', async () => {
    expect(() => getDefaultProvider('matic')).not.toThrow();
  });

  it('Throws on non-supported network', () => {
    expect(() => getDefaultProvider('bitcoin')).toThrowError(
      'unsupported getDefaultProvider network',
    );
  });

  it('Can override the RPC configuration for an existing network', async () => {
    expect(getDefaultProvider('matic')).toBeInstanceOf(providers.JsonRpcProvider);
    expect((getDefaultProvider('matic') as providers.JsonRpcProvider).connection.url).toBe(
      'https://polygon-rpc.com/',
    );
    setProviderFactory(() => 'http://matic.fake');
    expect(getDefaultProvider('matic')).toBeInstanceOf(providers.JsonRpcProvider);
    expect((getDefaultProvider('matic') as providers.JsonRpcProvider).connection.url).toBe(
      'http://matic.fake',
    );
  });

  it('Can override the RPC configuration for a new network', async () => {
    const fakenet = 'fakenet';
    expect(() => getDefaultProvider(fakenet)).toThrowError(
      'unsupported getDefaultProvider network',
    );
    setProviderFactory((network, defaultFactory) => {
      if (network === fakenet) {
        return 'http://fakenet.fake';
      }
      return defaultFactory(network);
    });
    expect(getDefaultProvider(fakenet)).toBeInstanceOf(providers.JsonRpcProvider);
    expect((getDefaultProvider(fakenet) as providers.JsonRpcProvider).connection.url).toBe(
      'http://fakenet.fake',
    );
    // still works for standard providers
    expect((getDefaultProvider('rinkeby') as providers.JsonRpcProvider).connection.url).toMatch(
      /https:\/\/rinkeby\.infura.*/,
    );
    expect((getDefaultProvider('goerli') as providers.JsonRpcProvider).connection.url).toMatch(
      /https:\/\/goerli\.infura.*/,
    );
  });

  it('Can override the api key for a standard provider', async () => {
    initPaymentDetectionApiKeys({
      infura: 'foo-bar',
    });

    const provider = getDefaultProvider() as providers.InfuraProvider;
    expect(provider.connection.url).toEqual('https://mainnet.infura.io/v3/foo-bar');
  });
});
