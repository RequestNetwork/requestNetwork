import { singleRequestProxyFactoryArtifact } from '@requestnetwork/smart-contracts';
import { TestERC20__factory } from '@requestnetwork/smart-contracts/types';
import {
  ClientTypes,
  CurrencyTypes,
  ExtensionTypes,
  IdentityTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { providers, Wallet } from 'ethers';
import {
  deploySingleRequestProxy,
  payRequestWithSingleRequestProxy,
} from '../../src/payment/single-request-proxy';

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress = '0x1234567890123456789012345678901234567890';
const payerAddress = '0x91087544a744f5ffd8213323a36e073a13320714';
const feeAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);
const erc20ContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';

const baseRequest: Omit<
  ClientTypes.IRequestData,
  'currency' | 'currencyInfo' | 'extensions' | 'version'
> = {
  balance: {
    balance: '0',
    events: [],
  },
  contentData: {},
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: wallet.address,
  },
  payee: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: paymentAddress,
  },
  payer: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: payerAddress,
  },
  events: [],
  expectedAmount: '100',
  extensionsData: [],
  meta: {
    transactionManagerMeta: {},
  },
  pending: null,
  requestId: 'abcd',
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: 0,
};

const ethRequest: ClientTypes.IRequestData = {
  ...baseRequest,
  currency: 'ETH-private',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ETH,
    value: RequestLogicTypes.CURRENCY.ETH,
  },
  extensions: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress: feeAddress,
        feeAmount: '2',
        paymentAddress: paymentAddress,
        salt: 'salt',
      },
      version: '0.1.0',
    },
  },
  version: '2.0.3',
};

const erc20Request: ClientTypes.IRequestData = {
  ...baseRequest,
  currency: 'DAI',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: erc20ContractAddress,
  },
  extensions: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress: feeAddress,
        feeAmount: '2',
        paymentAddress: paymentAddress,
        salt: 'salt',
      },
      version: '0.1.0',
    },
  },
  version: '1.0',
};

describe('deploySingleRequestProxy', () => {
  it('should throw error if payment network not supported', async () => {
    // Create a request with an unsupported payment network
    const invalidRequestUnsupportedPaymentNetwork = {
      ...baseRequest,
      currency: 'ETH-private',
      currencyInfo: {
        network: 'private' as CurrencyTypes.ChainName,
        type: RequestLogicTypes.CURRENCY.ETH,
        value: RequestLogicTypes.CURRENCY.ETH,
      },
      version: '2.0.3',
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '0.1.0',
        },
      },
    };

    await expect(
      deploySingleRequestProxy(invalidRequestUnsupportedPaymentNetwork, wallet),
    ).rejects.toThrow('Unsupported payment network');
  });

  it('should throw error if request has no network', async () => {
    const invalidRequestWithoutNetwork = { ...ethRequest, currencyInfo: {} };

    // @ts-expect-error: Request with empty currencyInfo
    await expect(deploySingleRequestProxy(invalidRequestWithoutNetwork, wallet)).rejects.toThrow(
      'Payment chain not found',
    );
  });

  it('should throw error if request has no network values', async () => {
    const invalidRequestWithoutNetworkValues = {
      ...ethRequest,
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT]: {
          ...ethRequest.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT],
          values: {},
        },
      },
    };

    await expect(
      deploySingleRequestProxy(invalidRequestWithoutNetworkValues, wallet),
    ).rejects.toThrow('Invalid payment network values');
  });

  it('should throw an error if the request has no extension', async () => {
    const invalidRequestWithoutExtensions = { ...ethRequest, extensions: {} };

    await expect(deploySingleRequestProxy(invalidRequestWithoutExtensions, wallet)).rejects.toThrow(
      'Unsupported payment network',
    );
  });

  it('should deploy EthereumSingleRequestProxy and emit event', async () => {
    const singleRequestProxyFactory = singleRequestProxyFactoryArtifact.connect('private', wallet);

    // Get the initial event count
    const initialEventCount = await provider.getBlockNumber();

    const proxyAddress = await deploySingleRequestProxy(ethRequest, wallet);

    expect(proxyAddress).toBeDefined();
    expect(typeof proxyAddress).toBe('string');
    expect(proxyAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);

    // Get the latest events
    const latestBlock = await provider.getBlockNumber();
    const events = await singleRequestProxyFactory.queryFilter(
      singleRequestProxyFactory.filters.EthereumSingleRequestProxyCreated(),
      initialEventCount,
      latestBlock,
    );

    // Check if the event was emitted with the correct parameters
    const event = events.find((e) => e.args?.proxyAddress === proxyAddress);
    expect(event).toBeDefined();
    expect(event?.args?.payee).toBe(paymentAddress);
    expect(event?.args?.paymentReference).toBeDefined();
  });

  it('should deploy ERC20SingleRequestProxy and emit event', async () => {
    const singleRequestProxyFactory = singleRequestProxyFactoryArtifact.connect('private', wallet);

    // Get the initial event count
    const initialEventCount = await provider.getBlockNumber();

    const proxyAddress = await deploySingleRequestProxy(erc20Request, wallet);

    expect(proxyAddress).toBeDefined();
    expect(typeof proxyAddress).toBe('string');
    expect(proxyAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);

    // Get the latest events
    const latestBlock = await provider.getBlockNumber();
    const events = await singleRequestProxyFactory.queryFilter(
      singleRequestProxyFactory.filters.ERC20SingleRequestProxyCreated(),
      initialEventCount,
      latestBlock,
    );

    // Check if the event was emitted with the correct parameters
    const event = events.find((e) => e.args?.proxyAddress === proxyAddress);
    expect(event).toBeDefined();
    expect(event?.args?.payee).toBe(paymentAddress);
    expect(event?.args?.paymentReference).toBeDefined();
  });

  it('should throw error when trying to pay with invalid single request proxy', async () => {
    const invalidProxy = '0x1234567890123456789012345678901234567890';

    await expect(payRequestWithSingleRequestProxy(invalidProxy, wallet, '100')).rejects.toThrow(
      'Invalid SingleRequestProxy contract',
    );
  });

  it('should throw error when amount is not a positive number', async () => {
    const proxyAddress = await deploySingleRequestProxy(ethRequest, wallet);

    await expect(payRequestWithSingleRequestProxy(proxyAddress, wallet, '0')).rejects.toThrow(
      'Amount must be a positive number',
    );
  });

  it('should pay with EthereumSingleRequestProxy', async () => {
    const proxyAddress = await deploySingleRequestProxy(ethRequest, wallet);

    const walletBalanceBefore = await provider.getBalance(wallet.address);

    await payRequestWithSingleRequestProxy(proxyAddress, wallet, '1000');

    const walletBalanceAfter = await provider.getBalance(wallet.address);

    expect(walletBalanceAfter.toBigInt()).toBeLessThan(walletBalanceBefore.toBigInt());
  });

  it('should pay with ERC20SingleRequestProxy', async () => {
    const amount = '200';

    const testERC20 = await new TestERC20__factory(wallet).deploy(1000);

    const updatedERC20Request = {
      ...erc20Request,
      currencyInfo: { ...erc20Request.currencyInfo, value: testERC20.address },
    };

    const proxyAddress = await deploySingleRequestProxy(updatedERC20Request, wallet);

    const initialProxyBalance = await testERC20.balanceOf(wallet.address);

    await payRequestWithSingleRequestProxy(proxyAddress, wallet, amount);

    const finalProxyBalance = await testERC20.balanceOf(wallet.address);

    expect(finalProxyBalance.toBigInt()).toBeLessThan(initialProxyBalance.toBigInt());
  });
});
