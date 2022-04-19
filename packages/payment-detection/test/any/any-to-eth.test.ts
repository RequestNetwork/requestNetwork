import { GraphQLClient } from 'graphql-request';
import { AdvancedLogic } from '@requestnetwork/advanced-logic';
import { CurrencyManager } from '@requestnetwork/currency';
import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';
import { mocked } from 'ts-jest/utils';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { AnyToEthFeeProxyPaymentDetector } from '../../src/any';

jest.mock('graphql-request');
const graphql = mocked(GraphQLClient.prototype);
const getLogs = jest.spyOn(StaticJsonRpcProvider.prototype, 'getLogs');

describe('Any to ETH payment detection', () => {
  const mockRequest: RequestLogicTypes.IRequest = {
    creator: { type: IdentityTypes.TYPE.ETHEREUM_ADDRESS, value: '0x2' },
    currency: {
      type: RequestLogicTypes.CURRENCY.ISO4217,
      value: 'EUR',
    },
    events: [],
    expectedAmount: '1000',
    extensions: {
      [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY]: {
        events: [],
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
        type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
        values: {
          feeAddress: '0x35d0e078755Cd84D3E0656cAaB417Dee1d7939c7',
          feeAmount: '5',
          network: 'rinkeby',
          paymentAddress: '0x0E8d9cb9e11278AD6E2bA1Ca90385C7295dC6532',
          salt: '4bdba8e1fd9d8b93',
        },
        version: '0.2.0',
      },
    },
    extensionsData: [],
    requestId: '012b8b6d4224549af7527c79559ddfbaa832b3f08303c429cdfc4ed78b7bdd5cc9',
    state: RequestLogicTypes.STATE.CREATED,
    timestamp: 0,
    version: '2.0.3',
  };

  const expectedBalance = {
    amount: '5000',
    name: 'payment',
    parameters: {
      amountInCrypto: '21175731582343340',
      block: 10088347,
      feeAddress: '0x35d0e078755Cd84D3E0656cAaB417Dee1d7939c7',
      feeAmount: '5',
      feeAmountInCrypto: '21175731582343',
      maxRateTimespan: '0',
      to: '0x0E8d9cb9e11278AD6E2bA1Ca90385C7295dC6532',
      tokenAddress: undefined,
      txHash: '0x7733a0fad7d7bdd0222ff1b63902aa26f1904e0fe14e03e95de73195e22a8ae6',
    },
    timestamp: 1643647285,
  };

  it('RPC Payment detection', async () => {
    getLogs
      .mockResolvedValueOnce([
        {
          blockNumber: 10088347,
          blockHash: '0x308b2c50a88461f0ce03a101d175261eb1587877d93b2b6e4630427b7333cee3',
          transactionIndex: 57,
          removed: false,
          address: '0x7Ebf48a26253810629C191b56C3212Fd0D211c26',
          data: '0x000000000000000000000000000000000000000000000000000000012a05f20000000000000000000000000017b4158805772ced11225e77339f90beb5aae96800000000000000000000000000000000000000000000000000000000004c4b400000000000000000000000000000000000000000000000000000000000000000',
          topics: [
            '0x96d0d1d75923f40b50f6fe74613b2c23239149607848fbca3941fee7ac041cdc',
            '0x01b253ade0cb0ae6ce8d28c4d74a6161059059d7cd7d073a040018b1a11390ac',
          ],
          transactionHash: '0x7733a0fad7d7bdd0222ff1b63902aa26f1904e0fe14e03e95de73195e22a8ae6',
          logIndex: 79,
        },
      ])
      .mockResolvedValueOnce([
        {
          blockNumber: 10088347,
          blockHash: '0x308b2c50a88461f0ce03a101d175261eb1587877d93b2b6e4630427b7333cee3',
          transactionIndex: 57,
          removed: false,
          address: '0x7Ebf48a26253810629C191b56C3212Fd0D211c26',
          data: '0x0000000000000000000000000e8d9cb9e11278ad6e2ba1ca90385c7295dc6532000000000000000000000000000000000000000000000000004b3b3736d318ac000000000000000000000000000000000000000000000000000013425bf5758700000000000000000000000035d0e078755cd84d3e0656caab417dee1d7939c7',
          topics: [
            '0xa1c241e337c4610a9d0f881111e977e9dc8690c85fe2108897bb1483c66e6a96',
            '0x01b253ade0cb0ae6ce8d28c4d74a6161059059d7cd7d073a040018b1a11390ac',
          ],
          transactionHash: '0x7733a0fad7d7bdd0222ff1b63902aa26f1904e0fe14e03e95de73195e22a8ae6',
          logIndex: 78,
        },
      ]);

    const currencyManager = CurrencyManager.getDefault();
    const detector = new AnyToEthFeeProxyPaymentDetector({
      advancedLogic: new AdvancedLogic(currencyManager),
      currencyManager,
      useTheGraph: () => false,
    });
    const balance = await detector.getBalance(mockRequest);
    expect(balance.error).not.toBeDefined();
    expect(balance.balance).toBe('5000');
    expect(balance.events).toMatchObject([expectedBalance]);
  });

  it('TheGraph Payment detection', async () => {
    graphql.request.mockResolvedValue({
      payments: [
        {
          amount: '5000000000',
          amountInCrypto: '21175731582343340',
          block: 10088347,
          currency: '0x17b4158805772ced11225e77339f90beb5aae968',
          feeAddress: '0x35d0e078755cd84d3e0656caab417dee1d7939c7',
          feeAmount: '5000000',
          feeAmountInCrypto: '21175731582343',
          from: '0x0e8d9cb9e11278ad6e2ba1ca90385c7295dc6532',
          maxRateTimespan: 0,
          timestamp: 1643647285,
          tokenAddress: null,
          txHash: '0x7733a0fad7d7bdd0222ff1b63902aa26f1904e0fe14e03e95de73195e22a8ae6',
        },
      ],
    });

    const currencyManager = CurrencyManager.getDefault();
    const detector = new AnyToEthFeeProxyPaymentDetector({
      advancedLogic: new AdvancedLogic(currencyManager),
      currencyManager,
      useTheGraph: () => true,
    });
    const balance = await detector.getBalance(mockRequest);
    expect(balance.error).not.toBeDefined();
    expect(balance.balance).toBe('5000');
    expect(balance.events).toMatchObject([expectedBalance]);
  });
});
