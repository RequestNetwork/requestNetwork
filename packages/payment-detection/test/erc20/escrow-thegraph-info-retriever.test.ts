/* eslint-disable @typescript-eslint/no-unused-expressions */
import EscrowERC20GraphInfoRetriever from '../../src/erc20/escrow-thegraph-info-retriever';

describe('api/erc20/escrow-thegraph-info-retriever', () => {
  describe('on rinkeby', () => {
    const RINKEBY_ESCROW_CONTRACT = '0x8230e703b1c4467a4543422b2cc3284133b9ab5e';

    it('should get escrow event list in correct order via subgraph', async () => {
      const eventList = [
        {
          eventName: 'initEscrow',
          from: '0x9dce3840976e4254aa073d5edcf59aa4007f50ac',
          txHash: '0x93e59e2f43e2ea4e7c6f093f106e10577969122ad434821f960dd57a43e6bcde',
          block: 9669873,
          timestamp: 1637331138,
        },
        {
          eventName: 'initEscrow',
          from: '0xc24cd7f1085e0424d57531a466945b7530d510f0',
          txHash: '0x94d993f967c01ff64ab6fe96e456c1e29ef38d81eb1fc84b0272ddc52723ba01',
          block: 9769660,
          timestamp: 1638828593,
        },
        {
          eventName: 'revertedEmergencyClaim',
          from: '0xc24cd7f1085e0424d57531a466945b7530d510f0',
          txHash: '0xf36b97332e8d87da83dbf9caf0fb7ff0c52e9076a964f77155f62873cd19b027',
          block: 9769706,
          timestamp: 1638829283,
        },
      ];
      const paymentReference = 'aaaa';

      const graphRetriever = new EscrowERC20GraphInfoRetriever(
        paymentReference,
        RINKEBY_ESCROW_CONTRACT,
        'rinkeby',
      );
      const escrowEvents = await graphRetriever.getAllContractEvents();
      expect(escrowEvents).toHaveLength(5);
      expect(escrowEvents[0].parameters?.block).toEqual(eventList[0].block);
      expect(escrowEvents[0].name).toEqual(eventList[0].eventName);
      expect(escrowEvents[0].parameters?.from).toEqual(eventList[0].from);
      expect(escrowEvents[0].timestamp).toEqual(eventList[0].timestamp);
      expect(escrowEvents[0].parameters?.txHash).toEqual(eventList[0].txHash);

      expect(escrowEvents[1].parameters?.block).toEqual(eventList[1].block);
      expect(escrowEvents[1].name).toEqual(eventList[1].eventName);
      expect(escrowEvents[1].parameters?.from).toEqual(eventList[1].from);
      expect(escrowEvents[1].timestamp).toEqual(eventList[1].timestamp);
      expect(escrowEvents[1].parameters?.txHash).toEqual(eventList[1].txHash);

      expect(escrowEvents[2].parameters?.block).toEqual(eventList[2].block);
      expect(escrowEvents[2].name).toEqual(eventList[2].eventName);
      expect(escrowEvents[2].parameters?.from).toEqual(eventList[2].from);
      expect(escrowEvents[2].timestamp).toEqual(eventList[2].timestamp);
      expect(escrowEvents[2].parameters?.txHash).toEqual(eventList[2].txHash);
    });
  });
});
