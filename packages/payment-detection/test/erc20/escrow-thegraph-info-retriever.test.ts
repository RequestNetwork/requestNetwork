/* eslint-disable @typescript-eslint/no-unused-expressions */
import EscrowERC20GraphInfoRetriever from '../../src/erc20/escrow-thegraph-info-retriever';

describe('api/erc20/escrow-thegraph-info-retriever', () => {
  describe('on rinkeby', () => {
    const RINKEBY_ESCROW_CONTRACT = '0x8230e703b1c4467a4543422b2cc3284133b9ab5e';

    it('should get escrow event list in correct order via subgraph', async () => {
      const eventList = [
        {
          block: 9769683,
          eventType: 'initializeEmergencyClaim',
          from: '0xa00ffd6397f27f41b20b79d3efdb83b688158216',
          timestamp: 1638828938,
          txHash: '0xf437f7173439e21c415d788ebbad148a47ebb176d5ee3f4c069bdbbab2a01532',
        },
        {
          block: 9769706,
          eventType: 'revertEmergencyClaim',
          from: '0xc24cd7f1085e0424d57531a466945b7530d510f0',
          timestamp: 1638829283,
          txHash: '0xf36b97332e8d87da83dbf9caf0fb7ff0c52e9076a964f77155f62873cd19b027',
        },
        {
          block: 9784756,
          eventType: 'freezeEscrow',
          from: '0x0c051a1f4e209b00c8e7c00ad0ce79b3630a7401',
          timestamp: 1639055420,
          txHash: '0x4c88a33fb62e2999fc365141f99d5f278eb68e8f68165be07c74839921cdb564',
        },
      ];
      const paymentReference = 'aaaa';

      const graphRetriever = new EscrowERC20GraphInfoRetriever(
        paymentReference,
        RINKEBY_ESCROW_CONTRACT,
        'rinkeby',
      );
      const escrowEvents = await graphRetriever.getEscrowEvents();
      expect(escrowEvents).toHaveLength(3);
      expect(escrowEvents[0].block).toEqual(eventList[0].block);
      expect(escrowEvents[0].eventType).toEqual(eventList[0].eventType);
      expect(escrowEvents[0].from).toEqual(eventList[0].from);
      expect(escrowEvents[0].timestamp).toEqual(eventList[0].timestamp);
      expect(escrowEvents[0].txHash).toEqual(eventList[0].txHash);

      expect(escrowEvents[1].block).toEqual(eventList[1].block);
      expect(escrowEvents[1].eventType).toEqual(eventList[1].eventType);
      expect(escrowEvents[1].from).toEqual(eventList[1].from);
      expect(escrowEvents[1].timestamp).toEqual(eventList[1].timestamp);
      expect(escrowEvents[1].txHash).toEqual(eventList[1].txHash);

      expect(escrowEvents[2].block).toEqual(eventList[2].block);
      expect(escrowEvents[2].eventType).toEqual(eventList[2].eventType);
      expect(escrowEvents[2].from).toEqual(eventList[2].from);
      expect(escrowEvents[2].timestamp).toEqual(eventList[2].timestamp);
      expect(escrowEvents[2].txHash).toEqual(eventList[2].txHash);
    });
  });
});
