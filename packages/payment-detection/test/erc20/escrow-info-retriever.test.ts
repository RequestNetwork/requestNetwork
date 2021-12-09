/* eslint-disable no-invalid-this */
/* eslint-disable no-magic-numbers */
import EscrowERC20InfoRetriever from '../../src/erc20/escrow-info-retriever';
import { ethers } from 'ethers';
import { PaymentTypes } from '@requestnetwork/types';
import { EVENTS_NAMES } from '@requestnetwork/types/dist/payment-types';
//import { erc20EscrowToPayArtifact } from '@requestnetwork/smart-contracts';

// erc20EscrowToPay deployment info.
//const escrowDeploymentInformation = erc20EscrowToPayArtifact.getDeploymentInformation('private');
//const escrowToPayAbi = erc20EscrowToPayArtifact.getContractAbi();
// Escrow contract address.
const escrowContractAddress = '0xF08dF3eFDD854FEDE77Ed3b2E515090EEe765154';
// ERC20 token address.
//const erc20LocalhostContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';
// Payment reference to be used in tests.
const paymentReferenceMock = 'aaaa';

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/erc20/escrow-info-retriever', () => {
  describe('on mocked logs', () => {
    // init event logs.
    let initEmergencyLog: ethers.providers.Log;
    let freezeLog: ethers.providers.Log;
    let revertEmergencyLog: ethers.providers.Log;
    let infoRetriever: EscrowERC20InfoRetriever;

    const mockedGetLogs = (filter: ethers.EventFilter) => {
      if (
        !filter.topics?.includes([
          // InitiatedEmergencyClaim event.
          '0x37b4fae7fd90ce3674204f79d686d40c4069a66c402976717d4f30817c0c0939',
          // FrozenRequest event.
          //'0x5e14b9b7c3d9675ce5ecb24ee8181d371561709a08aa9c412acb36627386dba8',
          // RevertedEmergencyClaim
          //'0xcc401323a0bd24a2e6e1564e168c52332731fff1a2937d998ee25462588ba0fa',
        ])
      ) {
        return [];
      }
      return Promise.resolve([initEmergencyLog, revertEmergencyLog, freezeLog]);
    };

    const mockedProvider = {
      getLogs: mockedGetLogs,
      getBlock: (): Promise<Partial<ethers.providers.Block>> => {
        return Promise.resolve({
          timestamp: 69,
        });
      },
    };

    // const paymentAddress = '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB';

    beforeEach(() => {
      // mock log with InitiatedEmergencyClaim as topic[0].
      initEmergencyLog = {
        blockNumber: 38,
        blockHash: '0x5be4f7b06ebbe0df573da7bc70768247abdc4e03e70264e946226d7154e42742',
        transactionIndex: 0,
        address: '0xB9B7e0cb2EDF5Ea031C8B297A5A1Fa20379b6A0a',
        data:
          '0x3a322d4500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002aaaa000000000000000000000000000000000000000000000000000000000000',
        topics: [
          '0x37b4fae7fd90ce3674204f79d686d40c4069a66c402976717d4f30817c0c0939',
          '0x6330b989705733cc5c1f7285b8a5b892e08be86ed6fbe9d254713a4277bc5bd2',
        ],
        transactionHash: '0x4c88a33fb62e2999fc365141f99d5f278eb68e8f68165be07c74839921cdb564',
        logIndex: 1,
        removed: false,
      };
      // mock log with RequestFrozen as topic[0].
      freezeLog = {
        blockNumber: 38,
        blockHash: '0x5be4f7b06ebbe0df573da7bc70768247abdc4e03e70264e946226d7154e42742',
        transactionIndex: 0,
        address: '0xB9B7e0cb2EDF5Ea031C8B297A5A1Fa20379b6A0a',
        data:
          '0x82865e9d00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002aaaa000000000000000000000000000000000000000000000000000000000000',
        topics: [
          '0x5e14b9b7c3d9675ce5ecb24ee8181d371561709a08aa9c412acb36627386dba8',
          '0x6330b989705733cc5c1f7285b8a5b892e08be86ed6fbe9d254713a4277bc5bd2',
        ],
        transactionHash: '0x4c88a33fb62e2999fc365141f99d5f278eb68e8f68165be07c74839921cdb564',
        logIndex: 2,
        removed: false,
      };
      // mock log with RevertedEmergencyClaim as topic[0].
      revertEmergencyLog = {
        blockNumber: 38,
        blockHash: '0x5be4f7b06ebbe0df573da7bc70768247abdc4e03e70264e946226d7154e42742',
        transactionIndex: 0,
        address: '0xB9B7e0cb2EDF5Ea031C8B297A5A1Fa20379b6A0a',
        data:
          '0x0797560800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002aaaa000000000000000000000000000000000000000000000000000000000000',
        topics: [
          '0xcc401323a0bd24a2e6e1564e168c52332731fff1a2937d998ee25462588ba0fa',
          '0x6330b989705733cc5c1f7285b8a5b892e08be86ed6fbe9d254713a4277bc5bd2',
        ],
        transactionHash: '0x4c88a33fb62e2999fc365141f99d5f278eb68e8f68165be07c74839921cdb564',
        logIndex: 3,
        removed: false,
      };

      infoRetriever = new EscrowERC20InfoRetriever(
        paymentReferenceMock,
        escrowContractAddress,
        0,
        'private',
      );

      console.log('Step one done');
    });

    it('can get the events of an address out of mocked logs', async () => {
      const events = await infoRetriever.getContractEvents();
      const event = events[0];
      // if this assert fails it means this address received another transaction
      expect(events).toHaveLength(1);
      expect(event.name).toBe(PaymentTypes.EVENTS_NAMES.INITIATED_EMERGENCY_CLAIM);
    });
  });
});
//expect(events[0].name).toBe(PaymentTypes.EVENTS_NAMES.INITIATED_EMERGENCY_CLAIM);

/*
      // inject mock provider.getLogs()
      infoRetriever.provider.getLogs = (filter: ethers.EventFilter): any => {
        if (
          !filter.topics?.includes(
            // InitiatedEmergencyClaim
            '0x37b4fae7fd90ce3674204f79d686d40c4069a66c402976717d4f30817c0c0939',
          )
        ) {
          return [];
        }
        return [
          {
            address: escrowContractAddress,
            blockHash: '0xe8693d0fb897eac7c350696834f4cf36be3b7d86f746d6764d9903a06dc5fe44',
            blockNumber: 115,
            data: '0x0797560800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002aaaa000000000000000000000000000000000000000000000000000000000000',
            logIndex: 2,
            topics: [
              '0x37b4fae7fd90ce3674204f79d686d40c4069a66c402976717d4f30817c0c0939',
              '0x6330b989705733cc5c1f7285b8a5b892e08be86ed6fbe9d254713a4277bc5bd2',
            ],
            transactionHash: '0x66e20126e917ede3543c79357c71ddeda2af68e27d684fd5aa6a813bb6946ce4',
            transactionIndex: 0,
          },
        ];
      };
      */

/*
    it('can get the localhost fees of an address', async () => {
      const infoRetriever = new ProxyERC20InfoRetriever(
        'b7182613b46c5e92',
        feeProxyContractAddress,
        0,
        erc20LocalhostContractAddress,
        '0x627306090abab3a6e1400e9345bc60c78a8bef57',
        PaymentTypes.EVENTS_NAMES.PAYMENT,
        'private',
      );

      // inject mock provider.getLogs()
      infoRetriever.provider.getLogs = (filter: ethers.EventFilter): any => {
        if (
          !filter.topics?.includes(
            '0x9f16cbcc523c67a60c450e5ffe4f3b7b6dbe772e7abcadb2686ce029a9a0a2b6',
          )
        ) {
          return [];
        }
        return [
          {
            blockNumber: 28,
            blockHash: '0x40496f2205f0c8d819c2cab683a5a7e0b20b49d3d891c8943780138670f184c7',
            transactionIndex: 0,
            address: feeProxyContractAddress,
            data:
              '0x0000000000000000000000009fbda871d559710256a2502a2517b794b482db40000000000000000000000000627306090abab3a6e1400e9345bc60c78a8bef57000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef',
            topics: [
              '0x9f16cbcc523c67a60c450e5ffe4f3b7b6dbe772e7abcadb2686ce029a9a0a2b6',
              '0xa1801d1208f939d16ff239f43c66983c01b1f107994ff695f6a195be4137c796',
            ],
            transactionHash: '0xa4ccc5094096fb6b2e744cb602ade7f37d0c78d8847e58471d6de786fc9c5283',
            logIndex: 4,
          },
        ];
      };

      // inject mock provider.getBlock()
      infoRetriever.provider.getBlock = (): any => {
        return {
          timestamp: 10,
        };
      };

      const events = await infoRetriever.getTransferEvents();

      // if this assert fails it means this address received another transaction
      expect(events).toHaveLength(1);

      const event = events[0];
      expect(event.name).toBe(PaymentTypes.EVENTS_NAMES.PAYMENT);
      expect(event.amount).toBe('10');
      expect(typeof event.timestamp).toBe('number');

      const parameters: PaymentTypes.IERC20FeePaymentEventParameters = event.parameters!;

      expect(parameters.to).toBe('0x627306090abab3a6e1400e9345bc60c78a8bef57');
      expect(typeof parameters.block).toBe('number');
      expect(typeof parameters.txHash).toBe('string');
      expect(parameters.feeAddress).toBe('0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef');
      expect(parameters.feeAmount).toBe('1');
    });

    it('gets an empty list of events for an address without ERC20 on localhost', async () => {
      const infoRetriever = new ProxyERC20InfoRetriever(
        paymentReferenceMock,
        proxyContractAddress,
        0,
        erc20LocalhostContractAddress,
        escrowContractAddress,
        PaymentTypes.EVENTS_NAMES.PAYMENT,
        'private',
      );

      // inject mock provider.getLogs()
      infoRetriever.provider.getLogs = (): any => {
        return [];
      };

      const events = await infoRetriever.getTransferEvents();
      expect(Object.keys(events)).toHaveLength(0);
    });
    */
