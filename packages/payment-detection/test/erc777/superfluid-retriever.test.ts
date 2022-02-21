import { SuperFluidInfoRetriever } from '../../src/erc777/superfluid-retriever';
import PaymentReferenceCalculator from '../../src/payment-reference-calculator';
import { utils } from 'ethers';
import { PaymentTypes } from '@requestnetwork/types';

describe('api/erc777/superfluid-info-retriever-1request', () => {
  describe('on rinkeby', () => {
    it('should get payment events from SuperFluid via subgraph with 1 request', async () => {
      const paymentData = {
        reference: '0xf81e1f6b6ff7cd15ab5538b403c8fdf3fed1f254ce6abcddf18941354039c752',
        txHash: '0xe472ca1b52751b058fbdaeaffebd98c0cc43b45aa31794b3eb06834ede19f7be',
        from: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
        to: '0x52e5bcfa46393894afcfe6cd98a6761fa692c594',
        network: 'rinkeby',
        salt: '0ee84db293a752c6',
        amount: '92592592592592000',
        requestId: '0188791633ff0ec72a7dbdefb886d2db6cccfa98287320839c2f173c7a4e3ce7e1',
        block: '9945543',
        token: '0x745861aed1eee363b4aaa5f1994be40b1e05ff90',
      };
      const paymentReference = PaymentReferenceCalculator.calculate(
        paymentData.requestId,
        paymentData.salt,
        paymentData.to,
      );
      const onChainReference = utils.keccak256(`0x${paymentReference}`);
      expect(onChainReference).toEqual(paymentData.reference);

      const graphRetriever = new SuperFluidInfoRetriever(
        paymentReference,
        paymentData.token,
        paymentData.to,
        PaymentTypes.EVENTS_NAMES.PAYMENT,
        paymentData.network,
      );
      const transferEvents = await graphRetriever.getTransferEvents();
      expect(transferEvents).toHaveLength(5);
      expect(transferEvents[0].amount).toEqual(paymentData.amount);
      expect(transferEvents[0].name).toEqual('payment');
      expect(transferEvents[0].parameters?.to).toEqual(paymentData.to);
      expect(transferEvents[1].amount).toEqual('34722222222222000');
      expect(transferEvents[2].amount).toEqual('40509259259259000');
      expect(transferEvents[0].parameters?.txHash).toEqual(paymentData.txHash);
      expect(transferEvents[0].parameters?.block).toEqual(paymentData.block);
    });
  });
});

describe('api/erc777/superfluid-info-retriever-2requests', () => {
  describe('on rinkeby', () => {
    it('should get payment event from SuperFluid via subgraph with 2 requests', async () => {
      const paymentData = {
        reference: '0x23b12cbc2c59e39389f3c7cd652c4594a3a7595d7e9af265d07878345a6fe488',
        from: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
        to: '0x52e5bcfa46393894afcfe6cd98a6761fa692c594',
        network: 'rinkeby',
        salt: '0ee84db293a752c6',
        amount: '320833333333331260',
        requestId: '0288792633ff0ec72a7dbdefb886d2db6cccfa98287320839c2f273c7a4e3ce7e2',
        token: '0x745861aed1eee363b4aaa5f1994be40b1e05ff90',
      };
      const paymentReference = PaymentReferenceCalculator.calculate(
        paymentData.requestId,
        paymentData.salt,
        paymentData.to,
      );
      const onChainReference = utils.keccak256(`0x${paymentReference}`);
      expect(onChainReference).toEqual(paymentData.reference);
      const graphRetriever = new SuperFluidInfoRetriever(
        paymentReference,
        paymentData.token,
        paymentData.to,
        PaymentTypes.EVENTS_NAMES.PAYMENT,
        paymentData.network,
      );
      const transferEvents = await graphRetriever.getTransferEvents();
      expect(transferEvents).toHaveLength(1);
      expect(transferEvents[0].amount).toEqual(paymentData.amount);
      expect(transferEvents[0].name).toEqual('payment');
      expect(transferEvents[0].parameters?.to).toEqual(paymentData.to);
    });
  });
});

describe('api/erc777/superfluid-info-retriever-ongoing', () => {
  describe('on rinkeby', () => {
    it('should get payment event from SuperFluid via subgraph with ongoing request', async () => {
      const paymentData = {
        reference: '0x272b93b983e5435bdba30902066ca3a0839cdb05bd526d648f6b0db79adbd2b5',
        from: '0x165a26628ac843e97f657e648b004226fbb7f7c5',
        to: '0xe7e6431f08db273d915b49888f0c67ef61802e05',
        network: 'rinkeby',
        salt: '0ee84db293a752c6',
        amount: '1',
        requestId: '0688792633ff0ec72a7dbdefb886d2db6cccfa98287320839c2f273c7a4e3ce7e2',
        token: '0x0f1d7c55a2b133e000ea10eec03c774e0d6796e8',
        timestamp: 1643041225,
      };
      const paymentReference = PaymentReferenceCalculator.calculate(
        paymentData.requestId,
        paymentData.salt,
        paymentData.to,
      );
      const onChainReference = utils.keccak256(`0x${paymentReference}`);
      expect(onChainReference).toEqual(paymentData.reference);
      const graphRetriever = new SuperFluidInfoRetriever(
        paymentReference,
        paymentData.token,
        paymentData.to,
        PaymentTypes.EVENTS_NAMES.PAYMENT,
        paymentData.network,
      );
      jest.spyOn(Date, 'now').mockImplementation(() => 1643126596704);
      const transferEvents = await graphRetriever.getTransferEvents();
      const timestamp = Math.floor(Date.now() / 1000) - paymentData.timestamp;
      expect(transferEvents).toHaveLength(1);
      expect(transferEvents[0].amount).toEqual(timestamp.toString());
      expect(transferEvents[0].name).toEqual('payment');
      expect(transferEvents[0].parameters?.to).toEqual(paymentData.to);
    });
  });
});
