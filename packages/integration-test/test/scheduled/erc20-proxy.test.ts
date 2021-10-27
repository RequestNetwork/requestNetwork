import { Erc20PaymentNetwork } from '@requestnetwork/payment-detection';
import { PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';

import { mockAdvancedLogic } from './mocks';
import { Types, Utils } from '@requestnetwork/request-client.js';
import {
  erc20requestCreationHash,
  localErc20PaymentNetworkParams,
  payeeIdentity,
  payerIdentity,
  privateErc20Address,
  requestNetwork,
} from './fixtures';

const erc20ProxyAddressedBased = new Erc20PaymentNetwork.ProxyContract({
  advancedLogic: mockAdvancedLogic,
});

describe('ERC20 Proxy detection test-suite', () => {
  it('can getBalance for a payment declared by the payee', async () => {
    const request = await requestNetwork.createRequest({
      paymentNetwork: {
        ...localErc20PaymentNetworkParams,
        id: PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
      },
      requestInfo: erc20requestCreationHash,
      signer: payeeIdentity,
    });

    let requestData = await request.declareReceivedPayment('1', 'OK', payeeIdentity);
    const declarationTimestamp = Utils.getCurrentTimestampInSecond();
    requestData = await new Promise((resolve): unknown => requestData.on('confirmed', resolve));

    const balance = await erc20ProxyAddressedBased.getBalance({
      ...requestData,
      currency: {
        network: 'private',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: privateErc20Address,
      },
    });

    expect(balance.balance).toBe('1');
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe('payment');
    expect(balance.events[0].amount).toBe('1');
    expect(Math.abs(declarationTimestamp - (balance.events[0].timestamp ?? 0))).toBeLessThan(5);
  });

  it('getBalance = 0 if the payer declared the payment', async () => {
    // Create a request
    const request = await requestNetwork.createRequest({
      paymentNetwork: {
        ...localErc20PaymentNetworkParams,
        id: PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
      },
      requestInfo: erc20requestCreationHash,
      signer: payeeIdentity,
    });

    // The payer declares a payment
    let requestData: Types.IRequestDataWithEvents = await request.declareSentPayment(
      '1',
      'OK',
      payerIdentity,
    );
    requestData = await new Promise((resolve): unknown => requestData.on('confirmed', resolve));
    const balance = await erc20ProxyAddressedBased.getBalance({
      ...requestData,
      currency: {
        network: 'private',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: privateErc20Address,
      },
    });
    expect(balance.balance).toBe('0');
    expect(balance.events).toHaveLength(0);
  });
})
