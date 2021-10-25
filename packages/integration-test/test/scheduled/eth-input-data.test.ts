import { EthPaymentNetwork } from '@requestnetwork/payment-detection';
import { RequestLogicTypes } from '@requestnetwork/types';

import { mockAdvancedLogic } from './mocks';
import { Types, Utils } from '@requestnetwork/request-client.js';
import {
  ethInputDataCreationHash,
  localEthInputDataPaymentNetworkParams,
  payeeIdentity,
  payerIdentity,
  privateErc20Address,
  requestNetwork,
} from './fixtures';

const ethInputContract = new EthPaymentNetwork({
  advancedLogic: mockAdvancedLogic,
});

describe('ETH Fee proxy detection test-suite', () => {
  it('can getBalance for a payment declared by the payee', async () => {
    const request = await requestNetwork.createRequest({
      paymentNetwork: localEthInputDataPaymentNetworkParams,
      requestInfo: ethInputDataCreationHash,
      signer: payeeIdentity,
    });

    let requestData = await request.declareReceivedPayment('50000000000000000', 'OK', payeeIdentity);
    const declarationTimestamp = Utils.getCurrentTimestampInSecond();
    requestData = await new Promise((resolve): unknown => requestData.on('confirmed', resolve));

    const balance = await ethInputContract.getBalance({
      ...requestData,
      currency: {
        network: 'private',
        type: RequestLogicTypes.CURRENCY.ETH,
        value: privateErc20Address,
      },
    });

    expect(balance.balance).toBe('50000000000000000');
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe('payment');
    expect(balance.events[0].amount).toBe('1');
    expect(Math.abs(declarationTimestamp - (balance.events[0].timestamp ?? 0))).toBeLessThan(5);
  });

  it('getBalance = 0 if the payer declared the payment', async () => {
    // Create a request
    const request = await requestNetwork.createRequest({
      paymentNetwork: localEthInputDataPaymentNetworkParams,
      requestInfo: ethInputDataCreationHash,
      signer: payeeIdentity,
    });

    // The payer declares a payment
    let requestData: Types.IRequestDataWithEvents = await request.declareSentPayment(
      '50000000000000000',
      'OK',
      payerIdentity,
    );
    requestData = await new Promise((resolve): unknown => requestData.on('confirmed', resolve));
    const balance = await ethInputContract.getBalance({
      ...requestData,
      currency: {
        network: 'private',
        type: RequestLogicTypes.CURRENCY.ETH,
        value: privateErc20Address,
      },
    });
    expect(balance.balance).toBe('0');
    expect(balance.events).toHaveLength(0);
  });
});
