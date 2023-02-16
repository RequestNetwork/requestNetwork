/* eslint-disable @typescript-eslint/no-unused-expressions */
import { TheGraphInfoRetriever, TheGraphClient } from '../../src/thegraph';
import PaymentReferenceCalculator from '../../src/payment-reference-calculator';
import { utils } from 'ethers';
import { PaymentTypes } from '@requestnetwork/types';
import { CurrencyManager } from '@requestnetwork/currency';

const paymentsMockData = {
  ['0x6c93723bc5f82e6fbb2ea994bf0fb572fa19f7a2a3146065e21752b95668efe5' as string]: [
    {
      contractAddress: '0xc6e23a20c0a1933acc8e30247b5d1e2215796c1f',
      to: '0x5000ee9fb9c96a2a09d8efb695ac21d6c429ff11',
      from: '0x186e7fe6c34ea0eca7f9c2fd29651fc0443e3f29',
      amount: '30000000000000',
      feeAmount: '0',
      block: 9606098,
      txHash: '0x3e2d6cc2534b1d340ba2954f34e6cc819d6da64ff76863ea89c6d34b15d13c97',
      feeAddress: '0x5000ee9fb9c96a2a09d8efb695ac21d6c429ff11',
      gasPrice: '',
      gasUsed: '',
      timestamp: 1,
    },
    {
      contractAddress: '0xca3353a15fcb5c83a1ff64bff055781ac5c4d2f4',
      to: '0x5000ee9fb9c96a2a09d8efb695ac21d6c429ff11',
      from: '0x186e7fe6c34ea0eca7f9c2fd29651fc0443e3f29',
      amount: '7000',
      feeAmount: '0',
      reference: '0x6c93723bc5f82e6fbb2ea994bf0fb572fa19f7a2a3146065e21752b95668efe5',
      block: 9610470,
      txHash: '0x2f7b4752aa259166c038cd9073056c5979760cf0eea55d093fca2095c229313b',
      feeAddress: '0x5000ee9fb9c96a2a09d8efb695ac21d6c429ff11',
      gasPrice: '',
      gasUsed: '',
      timestamp: 1,
    },
  ],
};

describe('api/erc20/thegraph-info-retriever', () => {
  describe('on rinkeby', () => {
    const RINKEBY_ETH_FEE_PROXY_CONTRACT = '0xc6e23a20c0a1933acc8e30247b5d1e2215796c1f';
    const RINKEBY_ETH_CONVERSION_PROXY_CONTRACT = '0xca3353a15fcb5c83a1ff64bff055781ac5c4d2f4';
    let clientMock: jest.Mocked<TheGraphClient>;
    let graphRetriever: TheGraphInfoRetriever;
    beforeEach(() => {
      clientMock = {
        GetPaymentsAndEscrowState: jest.fn().mockImplementation(({ reference }) => ({
          payments: paymentsMockData[reference] || [],
          escrowEvents: [],
        })),
        GetPaymentsAndEscrowStateForReceivables: jest.fn().mockImplementation(({ reference }) => ({
          payments: paymentsMockData[reference] || [],
          escrowEvents: [],
        })),
        GetLastSyncedBlock: jest.fn(),
        GetSyncedBlock: jest.fn(),
      };
      graphRetriever = new TheGraphInfoRetriever(clientMock, CurrencyManager.getDefault());
    });

    it('should get payment event from ethFeeProxy via subgraph', async () => {
      const paymentData = {
        reference: '0x6c93723bc5f82e6fbb2ea994bf0fb572fa19f7a2a3146065e21752b95668efe5',
        txHash: '0x3e2d6cc2534b1d340ba2954f34e6cc819d6da64ff76863ea89c6d34b15d13c97',
        from: '0x186e7fe6c34ea0eca7f9c2fd29651fc0443e3f29',
        to: '0x5000ee9fb9c96a2a09d8efb695ac21d6c429ff11',
        network: 'rinkeby',
        salt: '0ee84db293a752c6',
        amount: '30000000000000',
        requestId: '0188791633ff0ec72a7dbdefb886d2db6cccfa98287320839c2f173c7a4e3ce7e1',
        block: 9606098,
        feeAddress: '0x5000EE9FB9c96A2A09D8efB695aC21D6C429fF11',
        feeAmount: '0',
      };
      const paymentReference = PaymentReferenceCalculator.calculate(
        paymentData.requestId,
        paymentData.salt,
        paymentData.to,
      );
      const onChainReference = utils.keccak256(`0x${paymentReference}`);
      expect(onChainReference).toEqual(paymentData.reference);

      const graphRetriever = new TheGraphInfoRetriever(clientMock, CurrencyManager.getDefault());
      const allNetworkEvents = await graphRetriever.getTransferEvents({
        paymentReference,
        contractAddress: RINKEBY_ETH_FEE_PROXY_CONTRACT,
        toAddress: paymentData.to,
        eventName: PaymentTypes.EVENTS_NAMES.PAYMENT,
        paymentChain: paymentData.network,
      });
      const transferEvents = allNetworkEvents.paymentEvents;
      expect(transferEvents).toHaveLength(1);
      expect(transferEvents[0].amount).toEqual('30000000000000');
      expect(transferEvents[0].name).toEqual('payment');
      expect(transferEvents[0].parameters?.to).toEqual(utils.getAddress(paymentData.to));
      expect(transferEvents[0].parameters?.txHash).toEqual(paymentData.txHash);
      expect(transferEvents[0].parameters?.block).toEqual(paymentData.block);
      expect(transferEvents[0].parameters?.feeAddress).toEqual(paymentData.feeAddress);
      expect(transferEvents[0].parameters?.feeAmount).toEqual(paymentData.feeAmount);
    });

    it('should get payment event from ethFeeConversionProxy via subgraph', async () => {
      const paymentData = {
        reference: '0x6c93723bc5f82e6fbb2ea994bf0fb572fa19f7a2a3146065e21752b95668efe5',
        txHash: '0x2f7b4752aa259166c038cd9073056c5979760cf0eea55d093fca2095c229313b',
        from: '0x186e7fe6c34ea0eca7f9c2fd29651fc0443e3f29',
        to: '0x5000ee9fb9c96a2a09d8efb695ac21d6c429ff11',
        network: 'rinkeby',
        salt: '0ee84db293a752c6',
        amount: '7000',
        block: 9610470,
        requestId: '0188791633ff0ec72a7dbdefb886d2db6cccfa98287320839c2f173c7a4e3ce7e1',
      };

      const shortReference = PaymentReferenceCalculator.calculate(
        paymentData.requestId,
        paymentData.salt,
        paymentData.to,
      );
      const onChainReference = utils.keccak256(`0x${shortReference}`);
      expect(onChainReference).toEqual(paymentData.reference);

      const allNetworkEvents = await graphRetriever.getTransferEvents({
        paymentReference: shortReference,
        contractAddress: RINKEBY_ETH_CONVERSION_PROXY_CONTRACT,
        toAddress: paymentData.to,
        eventName: PaymentTypes.EVENTS_NAMES.PAYMENT,
        paymentChain: paymentData.network,
      });
      const transferEvents = allNetworkEvents.paymentEvents;
      expect(transferEvents).toHaveLength(1);
      expect(transferEvents[0].amount).toEqual(paymentData.amount);
      expect(transferEvents[0].parameters?.to).toEqual(utils.getAddress(paymentData.to));
      expect(transferEvents[0].parameters?.txHash).toEqual(paymentData.txHash);
      expect(transferEvents[0].parameters?.block).toEqual(paymentData.block);
    });
  });
});
