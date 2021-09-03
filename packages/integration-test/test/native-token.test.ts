import { PaymentNetworkFactory } from '@requestnetwork/payment-detection';
import { PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { PnReferenceBased } from '@requestnetwork/types/dist/extension-types';
import { AdvancedLogic } from '@requestnetwork/advanced-logic';

const advancedLogic = new AdvancedLogic();
const currency = {
  network: 'aurora-testnet',
  type: RequestLogicTypes.CURRENCY.ETH,
  value: 'NEAR',
};
// const request: any = {
//   requestId: '0124dc29327931e5d7631c2d866ee62d79a3b38e2b9976e4e218ebd1ece83c9d5d',
//   currency,
//   extensions: {
//     [ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN as string]: {
//       id: ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN,
//       type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
//       values: {
//         paymentAddress: 'benji.testnet',
//         salt: 'a1a2a3a4a5a6a7a8',
//       },
//       version: '0.1.0',
//     },
//   },
// };
const createCreationActionParams: PnReferenceBased.ICreationParameters = {
  paymentAddress: 'benji.testnet',
  salt: 'a1a2a3a4a5a6a7a8',
  paymentNetworkName: 'aurora-testnet',
};

describe('PaymentNetworkFactory and createExtensionsDataForCreation', () => {
  it('PaymentNetworkFactory can createPaymentNetwork (mainnet)', async () => {
    const paymentNetwork = PaymentNetworkFactory.createPaymentNetwork({
      advancedLogic,
      currency: { ...currency, network: 'aurora' },
      paymentNetworkCreationParameters: {
        id: PaymentTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN,
        parameters: createCreationActionParams,
      },
    });
    const action = await paymentNetwork.createExtensionsDataForCreation(createCreationActionParams);
    expect(action.parameters.paymentAddress).toEqual('benji.testnet');
    expect(action.parameters.paymentNetworkName).toEqual('aurora-testnet');
  });
  it('throws without a payment network name', async () => {
    const paymentNetwork = PaymentNetworkFactory.createPaymentNetwork({
      advancedLogic,
      currency: { ...currency, network: 'aurora' },
      paymentNetworkCreationParameters: {
        id: PaymentTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN,
        parameters: { ...createCreationActionParams, paymentNetworkName: undefined },
      },
    });
    await expect(async () => {
      await paymentNetwork.createExtensionsDataForCreation(createCreationActionParams);
    }).rejects.toThrowError(
      'The network name is mandatory for the creation of the extension pn-native-token.',
    );
  });
});
