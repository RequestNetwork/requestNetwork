import { PaymentNetworkFactory } from '@requestnetwork/payment-detection';
import { PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { PnReferenceBased } from '@requestnetwork/types/dist/extension-types';
import { AdvancedLogic } from '@requestnetwork/advanced-logic';
import { CurrencyManager } from '@requestnetwork/currency';

const advancedLogic = new AdvancedLogic();
const currency = {
  network: 'aurora-testnet',
  type: RequestLogicTypes.CURRENCY.ETH,
  value: 'NEAR',
};
const createCreationActionParams: PnReferenceBased.ICreationParameters = {
  paymentAddress: 'payment.testnet',
  salt: 'a1a2a3a4a5a6a7a8',
  paymentNetworkName: 'aurora-testnet',
};

describe('PaymentNetworkFactory and createExtensionsDataForCreation', () => {
  it('PaymentNetworkFactory can createPaymentNetwork (mainnet)', async () => {
    const paymentNetwork = PaymentNetworkFactory.createPaymentNetwork({
      advancedLogic,
      currency: { ...currency, network: 'aurora-testnet' },
      paymentNetworkCreationParameters: {
        id: PaymentTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN,
        parameters: createCreationActionParams,
      },
      currencyManager: CurrencyManager.getDefault(),
    });
    const action = await paymentNetwork.extension.createCreationAction(createCreationActionParams);
    expect(action.parameters.paymentAddress).toEqual('payment.testnet');
    expect(action.parameters.paymentNetworkName).toEqual('aurora-testnet');
  });
  it('throws without a payment network name', async () => {
    const paymentNetwork = PaymentNetworkFactory.createPaymentNetwork({
      advancedLogic,
      currency: { ...currency, network: 'aurora-testnet' },
      paymentNetworkCreationParameters: {
        id: PaymentTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN,
        parameters: { ...createCreationActionParams, paymentNetworkName: undefined },
      },
      currencyManager: CurrencyManager.getDefault(),
    });
    await expect(async () => {
      await paymentNetwork.extension.createCreationAction(createCreationActionParams);
    }).rejects.toThrowError(
      'The network name is mandatory for the creation of the extension pn-native-token.',
    );
  });
});
