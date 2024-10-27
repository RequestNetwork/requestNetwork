// @ts-nocheck
import { providers, Wallet } from 'ethers';
import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { deploySingleRequestProxy } from '../../src/payment/single-request-proxy';
import { singleRequestProxyFactoryArtifact } from '@requestnetwork/smart-contracts';

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const feeAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

const validRequest: ClientTypes.IRequestData = {
  balance: {
    balance: '0',
    events: [],
  },
  contentData: {},
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: wallet.address,
  },
  currency: 'ETH-private',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ETH,
    value: RequestLogicTypes.CURRENCY.ETH,
  },
  events: [],
  expectedAmount: '100',
  extensions: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress,
        feeAmount: '2',
        paymentAddress,
        salt: 'salt',
      },
      version: '0.1.0',
    },
  },
  extensionsData: [],
  meta: {
    transactionManagerMeta: {},
  },
  pending: null,
  requestId: 'abcd',
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: 0,
  version: '2.0.3',
};

describe('deploySingleRequestProxy', () => {
  it('should deploy EthereumSingleRequestProxy and emit event', async () => {
    const singleRequestProxyFactory = singleRequestProxyFactoryArtifact.connect('private', wallet);

    // Get the initial event count
    const initialEventCount = await provider.getBlockNumber();

    const proxyAddress = await deploySingleRequestProxy(validRequest, wallet);

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

  it('should throw an error if the request has no extension', async () => {
    const invalidRequest = { ...validRequest, extensions: {} };

    await expect(deploySingleRequestProxy(invalidRequest, wallet)).rejects.toThrow(
      'Unsupported payment network',
    );
  });
});
