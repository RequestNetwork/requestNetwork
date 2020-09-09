// tslint:disable: no-invalid-this
// tslint:disable: no-magic-numbers
import { PaymentTypes } from '@requestnetwork/types';
import ERC20InfoRetriever from '../../src/erc20/address-based-info-retriever';

const erc20LocalhostContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';

/* tslint:disable:no-unused-expression */
describe('api/erc20/address-based-info-retriever', () => {
  describe('on localhost', () => {
    const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
    const payerAddress = '0x627306090abaB3A6e1400e9345bC60c78a8BEf57';
    const emptyAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';

    it('can get the localhost balance of an address', async () => {
      const infoRetriever = new ERC20InfoRetriever(
        erc20LocalhostContractAddress,
        paymentAddress,
        PaymentTypes.EVENTS_NAMES.PAYMENT,
        'private',
      );
      const events = await infoRetriever.getTransferEvents();

      // if this assert fails it means this address received another transaction
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe(PaymentTypes.EVENTS_NAMES.PAYMENT);
      expect(events[0].amount).toBe('10');
      expect(typeof events[0].timestamp).toBe('number');
      expect(events[0].parameters!.from).toBe(payerAddress);
      expect(events[0].parameters!.to).toBe(paymentAddress);
      expect(typeof events[0].parameters!.block).toBe('number');
      expect(typeof events[0].parameters!.txHash).toBe('string');
    }, 10000);

    it('gets an empty list of events for an address without ERC20 on localhost', async () => {
      const infoRetriever = new ERC20InfoRetriever(
        erc20LocalhostContractAddress,
        emptyAddress,
        PaymentTypes.EVENTS_NAMES.PAYMENT,
        'private',
      );

      const events = await infoRetriever.getTransferEvents();
      expect(Object.keys(events)).toHaveLength(0);
    });
  });
});
