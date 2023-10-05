/* eslint-disable no-invalid-this */
/* eslint-disable no-magic-numbers */
import { EscrowERC20InfoRetriever } from '../../src/erc20/escrow-info-retriever';
import { ethers } from 'ethers';
import { PaymentTypes } from '@requestnetwork/types';

const escrowContractAddress = '0xF08dF3eFDD854FEDE77Ed3b2E515090EEe765154';
const paymentReferenceMock = 'aaaa';

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/erc20/escrow-info-retriever', () => {
  describe('on mocked logs', () => {
    // Initiate mockedlogs.
    const initEmergencyLog = {
      blockNumber: 38,
      blockHash: '0x5be4f7b06ebbe0df573da7bc70768247abdc4e03e70264e946226d7154e42742',
      transactionIndex: 0,
      address: '0xB9B7e0cb2EDF5Ea031C8B297A5A1Fa20379b6A0a',
      data: '0x3a322d4500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002aaaa000000000000000000000000000000000000000000000000000000000000',
      topics: [
        '0x37b4fae7fd90ce3674204f79d686d40c4069a66c402976717d4f30817c0c0939',
        '0x6330b989705733cc5c1f7285b8a5b892e08be86ed6fbe9d254713a4277bc5bd2',
      ],
      transactionHash: '0x4c88a33fb62e2999fc365141f99d5f278eb68e8f68165be07c74839921cdb564',
      logIndex: 1,
      removed: false,
    };
    const freezeLog = {
      blockNumber: 38,
      blockHash: '0x5be4f7b06ebbe0df573da7bc70768247abdc4e03e70264e946226d7154e42742',
      transactionIndex: 0,
      address: '0xB9B7e0cb2EDF5Ea031C8B297A5A1Fa20379b6A0a',
      data: '0x82865e9d00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002aaaa000000000000000000000000000000000000000000000000000000000000',
      topics: [
        '0x5e14b9b7c3d9675ce5ecb24ee8181d371561709a08aa9c412acb36627386dba8',
        '0x6330b989705733cc5c1f7285b8a5b892e08be86ed6fbe9d254713a4277bc5bd2',
      ],
      transactionHash: '0x4c88a33fb62e2999fc365141f99d5f278eb68e8f68165be07c74839921cdb564',
      logIndex: 2,
      removed: false,
    };
    const revertEmergencyLog = {
      blockNumber: 38,
      blockHash: '0x5be4f7b06ebbe0df573da7bc70768247abdc4e03e70264e946226d7154e42742',
      transactionIndex: 0,
      address: '0xB9B7e0cb2EDF5Ea031C8B297A5A1Fa20379b6A0a',
      data: '0x0797560800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002aaaa000000000000000000000000000000000000000000000000000000000000',
      topics: [
        '0xcc401323a0bd24a2e6e1564e168c52332731fff1a2937d998ee25462588ba0fa',
        '0x6330b989705733cc5c1f7285b8a5b892e08be86ed6fbe9d254713a4277bc5bd2',
      ],
      transactionHash: '0x4c88a33fb62e2999fc365141f99d5f278eb68e8f68165be07c74839921cdb564',
      logIndex: 3,
      removed: false,
    };

    let infoRetriever: EscrowERC20InfoRetriever;
    let getBlockSpy: jest.SpyInstance;
    let getLogsSpy: jest.SpyInstance;

    beforeEach(() => {
      infoRetriever = new EscrowERC20InfoRetriever(
        paymentReferenceMock,
        escrowContractAddress,
        0,
        '0x4c88a33fb62e2999fc365141f99d5f278eb68e8f68165be07c74839921cdb564',
        '0xB9B7e0cb2EDF5Ea031C8B297A5A1Fa20379b6A0a',
        'private',
      );

      getBlockSpy = jest.spyOn(infoRetriever.provider, 'getBlock').mockResolvedValue({
        timestamp: 69,
      } as any);
      getLogsSpy = jest
        .spyOn(infoRetriever.provider, 'getLogs')
        .mockImplementation((filter: ethers.providers.Filter) => {
          const initEmergencyClaimTopic =
            '0x37b4fae7fd90ce3674204f79d686d40c4069a66c402976717d4f30817c0c0939';
          const frozenRequestTopic =
            '0x5e14b9b7c3d9675ce5ecb24ee8181d371561709a08aa9c412acb36627386dba8';
          const revertedEmergencyTopic =
            '0xcc401323a0bd24a2e6e1564e168c52332731fff1a2937d998ee25462588ba0fa';
          if (filter.topics?.includes(initEmergencyClaimTopic)) {
            return Promise.resolve([initEmergencyLog]);
          }
          if (filter.topics?.includes(frozenRequestTopic)) {
            return Promise.resolve([freezeLog]);
          }
          if (filter.topics?.includes(revertedEmergencyTopic)) {
            return Promise.resolve([revertEmergencyLog]);
          }
          return Promise.resolve([]);
        });
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('can get the FREEZE_ESCROW event of an address out of mocked logs', async () => {
      const events = await infoRetriever.getContractEventsForEventName(
        PaymentTypes.ESCROW_EVENTS_NAMES.FREEZE_ESCROW,
      );
      expect(events).toHaveLength(1);
      expect(events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: PaymentTypes.ESCROW_EVENTS_NAMES.FREEZE_ESCROW }),
        ]),
      );
      expect(getBlockSpy).toHaveBeenCalledTimes(1);
      expect(getLogsSpy).toHaveBeenCalledTimes(1);
    });
    it('can get the INITIATE_EMERGENCY_CLAIM event of an address out of mocked logs', async () => {
      const events = await infoRetriever.getAllContractEvents();
      expect(events).toHaveLength(3);
      expect(events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: PaymentTypes.ESCROW_EVENTS_NAMES.INITIATE_EMERGENCY_CLAIM,
          }),
        ]),
      );
      expect(getBlockSpy).toHaveBeenCalledTimes(3);
      expect(getLogsSpy).toHaveBeenCalledTimes(3);
    });
    it('can get the REVERT_EMERGENCY_CLAIM event of an address out of mocked logs', async () => {
      const events = await infoRetriever.getAllContractEvents();
      expect(events).toHaveLength(3);
      expect(events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: PaymentTypes.ESCROW_EVENTS_NAMES.REVERT_EMERGENCY_CLAIM,
          }),
        ]),
      );
      expect(getBlockSpy).toHaveBeenCalledTimes(3);
      expect(getLogsSpy).toHaveBeenCalledTimes(3);
    });
  });
  describe('test on rinkeby', () => {
    let infoRetriever: EscrowERC20InfoRetriever;
    beforeAll(() => {
      infoRetriever = new EscrowERC20InfoRetriever(
        paymentReferenceMock,
        '0x8230e703B1c4467A4543422b2cC3284133B9AB5e',
        0,
        '',
        '',
        'rinkeby',
      );
    });
    // FIXME migrate to goerli or mock RPC call
    it.skip('should get escrow chain data', async () => {
      const escrowChainData = await infoRetriever.getEscrowRequestMapping();
      expect(escrowChainData.tokenAddress).toEqual('0x745861AeD1EEe363b4AaA5F1994Be40b1e05Ff90');
      expect(escrowChainData.payee).toEqual('0xB9B7e0cb2EDF5Ea031C8B297A5A1Fa20379b6A0a');
      expect(escrowChainData.payer).toEqual('0x0c051a1f4E209b00c8E7C00AD0ce79B3630a7401');
      expect(escrowChainData.amount.toString()).toEqual('123000000000000000000');
      expect(escrowChainData.unlockDate.toString()).toEqual('1670505020');
      expect(escrowChainData.emergencyClaimDate.toString()).toEqual('0');
      expect(escrowChainData.emergencyState).toEqual(false);
      expect(escrowChainData.isFrozen).toEqual(true);
    });
  });
});
