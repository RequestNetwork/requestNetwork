import { PaymentNetworkFactory } from '@requestnetwork/payment-detection';
import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { PnReferenceBased } from '@requestnetwork/types/dist/extension-types';
import { AdvancedLogic } from '@requestnetwork/advanced-logic';
import { CurrencyManager } from '@requestnetwork/currency';
import { omit } from 'lodash';

const advancedLogic = new AdvancedLogic(CurrencyManager.getDefault());

const createCreationActionParams: PnReferenceBased.ICreationParameters = {
  paymentAddress: 'payment.testnet',
  salt: 'a1a2a3a4a5a6a7a8',
  paymentNetworkName: 'aurora-testnet',
};

describe('PaymentNetworkFactory and createExtensionsDataForCreation', () => {
  const paymentNetworkFactory = new PaymentNetworkFactory(
    advancedLogic,
    CurrencyManager.getDefault(),
  );
  it('PaymentNetworkFactory can createPaymentNetwork (mainnet)', async () => {
    const paymentNetwork = paymentNetworkFactory.createPaymentNetwork(
      ExtensionTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN,
      RequestLogicTypes.CURRENCY.ETH,
      'aurora-testnet',
    );
    const action = await paymentNetwork.createExtensionsDataForCreation(createCreationActionParams);
    expect(action.parameters.paymentAddress).toEqual('payment.testnet');
    expect(action.parameters.paymentNetworkName).toEqual('aurora-testnet');
  });
  it('throws without a payment network name', async () => {
    const paymentNetwork = paymentNetworkFactory.createPaymentNetwork(
      ExtensionTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN,
      RequestLogicTypes.CURRENCY.ETH,
      'aurora-testnet',
    );
    await expect(async () => {
      await paymentNetwork.createExtensionsDataForCreation(
        omit(createCreationActionParams, 'paymentNetworkName'),
      );
    }).rejects.toThrowError(
      'The network name is mandatory for the creation of the extension pn-native-token.',
    );
  });
});
