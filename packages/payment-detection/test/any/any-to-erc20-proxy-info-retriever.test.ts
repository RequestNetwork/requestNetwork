/* eslint-disable no-invalid-this */
/* eslint-disable no-magic-numbers */
import { PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import AnyToErc20ProxyInfoRetriever from '../../src/any/any-to-erc20-proxy-info-retriever';
import { ethers } from 'ethers';

const erc20LocalhostContractAddress = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';
const conversionProxyContractAddress = '0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4';
const erc20FeeProxyContractAddress = '0x75c35C980C0d37ef46DF04d31A140b65503c0eEd';
const paymentReferenceMock = '01111111111111111111111111111111111111111111111111';
const acceptedTokens = [erc20LocalhostContractAddress];
const USDCurrency = { type: RequestLogicTypes.CURRENCY.ISO4217, value: 'USD' };

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/any/conversion-proxy-info-retriever', () => {
  describe('on mocked logs', () => {
    let proxyPaymentLog: ethers.providers.Log;
    let proxyConversionLog: ethers.providers.Log;
    let infoRetriever: AnyToErc20ProxyInfoRetriever;

    const mockedGetLogs = (filter: ethers.EventFilter) => {
      if (
        !filter.topics?.includes(
          '0x96d0d1d75923f40b50f6fe74613b2c23239149607848fbca3941fee7ac041cdc',
        )
      ) {
        return Promise.resolve([proxyPaymentLog]);
      }
      return Promise.resolve([proxyConversionLog]);
    };

    const mockedProvider = {
      getLogs: mockedGetLogs,
      getBlock: (): Promise<Partial<ethers.providers.Block>> => {
        return Promise.resolve({
          timestamp: 69,
        });
      },
    };

    const paymentAddress = '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB';

    beforeEach(() => {
      proxyPaymentLog = {
        blockNumber: 38,
        blockHash: '0x5be4f7b06ebbe0df573da7bc70768247abdc4e03e70264e946226d7154e42742',
        transactionIndex: 0,
        address: '0xB9B7e0cb2EDF5Ea031C8B297A5A1Fa20379b6A0a',
        data:
          '0x00000000000000000000000038cf23c52bb4b13f051aec09580a2de845a7fa35000000000000000000000000c12f17da12cd01a9cdbb216949ba0b41a6ffc4eb0000000000000000000000000000000000000000000000008a8b0a9b5a67faf30000000000000000000000000000000000000000000000001bb56885787b32300000000000000000000000000d1d4e623d10f9fba5db95830f7d3839406c6af2',
        topics: [
          '0x9f16cbcc523c67a60c450e5ffe4f3b7b6dbe772e7abcadb2686ce029a9a0a2b6',
          '0x7282bbc994da16ee5cc075d9f59d29873b4d9a40663642c19e3c87f7bb4310d6',
        ],
        transactionHash: '0x08fa12d6647053fc1ff21179ec1b16d3825144cb3840957f98830b8e416516f1',
        logIndex: 4,
        removed: false,
      };

      proxyConversionLog = {
        blockNumber: 38,
        blockHash: '0x5be4f7b06ebbe0df573da7bc70768247abdc4e03e70264e946226d7154e42742',
        transactionIndex: 0,
        address: '0xB9B7e0cb2EDF5Ea031C8B297A5A1Fa20379b6A0a',
        data:
          '0x000000000000000000000000000000000000000000000000000000003b9aca00000000000000000000000000775eb53d00dd0acd3ec1696472105d579b9b386b000000000000000000000000000000000000000000000000000000000bebc2000000000000000000000000000000000000000000000000000000000000000000',
        topics: [
          '0x96d0d1d75923f40b50f6fe74613b2c23239149607848fbca3941fee7ac041cdc',
          '0x7282bbc994da16ee5cc075d9f59d29873b4d9a40663642c19e3c87f7bb4310d6',
        ],
        transactionHash: '0x08fa12d6647053fc1ff21179ec1b16d3825144cb3840957f98830b8e416516f1',
        logIndex: 5,
        removed: false,
      };
      infoRetriever = new AnyToErc20ProxyInfoRetriever(
        USDCurrency,
        paymentReferenceMock,
        conversionProxyContractAddress,
        0,
        erc20FeeProxyContractAddress,
        0,
        paymentAddress,
        PaymentTypes.EVENTS_NAMES.PAYMENT,
        'private',
        acceptedTokens,
        1000000,
      );
    });

    it('can get the balance of an address out of mocked logs', async () => {
      infoRetriever.provider = mockedProvider as any;

      const events = await infoRetriever.getTransferEvents();
      const parameters: PaymentTypes.IERC20FeePaymentEventParameters = events[0].parameters!;

      // if this assert fails it means this address received another transaction
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe(PaymentTypes.EVENTS_NAMES.PAYMENT);
      expect(events[0].amount).toBe('1000');
      expect(typeof events[0].timestamp).toBe('number');
      expect(parameters.to).toBe(paymentAddress);
      expect(typeof parameters.block).toBe('number');
      expect(typeof parameters.txHash).toBe('string');

      expect(parameters.feeAmount).toBe('200');
      expect(parameters.feeAmountInCrypto).toBe('1996616932269961776');
      expect(parameters.feeAddress).toBe('0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2');

      expect(parameters.amountInCrypto).toBe('9983084661349808883');
      expect(parameters.tokenAddress).toBe(erc20LocalhostContractAddress);
    });

    it('skips the payment with a payment token that is not accepted', async () => {
      // token 0xff...fff instead of the accepted one
      proxyPaymentLog.data =
        '0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff000000000000000000000000c12f17da12cd01a9cdbb216949ba0b41a6ffc4eb0000000000000000000000000000000000000000000000008a8b0a9b5a67faf30000000000000000000000000000000000000000000000001bb56885787b32300000000000000000000000000d1d4e623d10f9fba5db95830f7d3839406c6af2';
      // inject mock provider.getLogs()
      infoRetriever.provider = mockedProvider as any;

      const events = await infoRetriever.getTransferEvents();
      expect(events).toHaveLength(0);
    });

    it('skips the payment with a rate too old', async () => {
      const infoRetriever = new AnyToErc20ProxyInfoRetriever(
        USDCurrency,
        paymentReferenceMock,
        conversionProxyContractAddress,
        0,
        erc20FeeProxyContractAddress,
        0,
        paymentAddress,
        PaymentTypes.EVENTS_NAMES.PAYMENT,
        'private',
        acceptedTokens,
        // Here we only accept payments with a 1sec old conversion rate
        1,
      );

      // Here we fake an event emmitted by a payment made with a maximum timeframe of 10s
      proxyConversionLog.data =
        '0x000000000000000000000000000000000000000000000000000000003b9aca00000000000000000000000000775eb53d00dd0acd3ec1696472105d579b9b386b000000000000000000000000000000000000000000000000000000000bebc200000000000000000000000000000000000000000000000000000000000000000a';

      infoRetriever.provider = mockedProvider as any;

      const events = await infoRetriever.getTransferEvents();
      expect(events).toHaveLength(0);
    });

    it('skips the payment with a wrong conversion currency', async () => {
      // currency 0xff...fff instead of the request one
      proxyConversionLog.data =
        '0x000000000000000000000000000000000000000000000000000000003b9aca00000000000000000000000000ffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000bebc2000000000000000000000000000000000000000000000000000000000000000000';
      // inject mock provider.getLogs()
      infoRetriever.provider = mockedProvider as any;

      const events = await infoRetriever.getTransferEvents();
      expect(events).toHaveLength(0);
    });

    it('gets an empty list of events for an address without ERC20 on localhost', async () => {
      // inject mock provider.getLogs()
      infoRetriever.provider.getLogs = (): any => {
        return [];
      };

      const events = await infoRetriever.getTransferEvents();
      expect(Object.keys(events)).toHaveLength(0);
    });
  });
});
