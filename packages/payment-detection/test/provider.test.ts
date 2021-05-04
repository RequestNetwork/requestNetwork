import { providers } from 'ethers';
import { getDefaultProvider, initPaymentDetectionProvider } from '../src';

describe('getDefaultProvider', () => {
  it('Defaults to Infura Mainnet', async () => {
    const provider = getDefaultProvider();

    expect(provider).toBeInstanceOf(providers.FallbackProvider);
    await expect(provider.getNetwork()).resolves.toMatchObject({ chainId: 1 });
  });

  it('Can take a standard network', async () => {
    const provider = getDefaultProvider('rinkeby');

    expect(provider).toBeInstanceOf(providers.FallbackProvider);
    await expect(provider.getNetwork()).resolves.toMatchObject({ chainId: 4 });
  });

  it('Can take a non-standard network', async () => {
    const provider = getDefaultProvider('matic');

    expect(provider).toBeInstanceOf(providers.JsonRpcProvider);
    await expect(provider.getNetwork()).resolves.toMatchObject({ chainId: 137 });
  });

  it('Throws on non-supported network', () => {
    expect(() => getDefaultProvider('bitcoin')).toThrowError(
      'unsupported getDefaultProvider network',
    );
  });

  it('Can override the RPC configuration for an existing network', async () => {
    expect(getDefaultProvider('matic')).toBeInstanceOf(providers.JsonRpcProvider);
    expect((getDefaultProvider('matic') as providers.JsonRpcProvider).connection.url).toBe(
      'https://rpc-mainnet.matic.network/',
    );
    initPaymentDetectionProvider({
      blockchainRpcs: {
        matic: 'http://matic.fake',
      },
    });
    expect(getDefaultProvider('matic')).toBeInstanceOf(providers.JsonRpcProvider);
    expect((getDefaultProvider('matic') as providers.JsonRpcProvider).connection.url).toBe(
      'http://matic.fake',
    );
  });

  it('Can override the RPC configuration for a new network', async () => {
    expect(() => getDefaultProvider('xdai')).toThrowError('unsupported getDefaultProvider network');
    initPaymentDetectionProvider({
      blockchainRpcs: {
        xdai: 'http://xdaichain.fake',
      },
    });
    expect(getDefaultProvider('xdai')).toBeInstanceOf(providers.JsonRpcProvider);
    expect((getDefaultProvider('xdai') as providers.JsonRpcProvider).connection.url).toBe(
      'http://xdaichain.fake',
    );
  });

  it('Can override the api key for a standard provider', async () => {
    initPaymentDetectionProvider({
      defaultProviderOptions: {
        infura: 'foo-bar',
      },
    });

    const provider = getDefaultProvider() as providers.FallbackProvider;
    expect(provider.providerConfigs[0].provider).toMatchObject({ apiKey: 'foo-bar' });
  });
});
