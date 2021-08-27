import NativeTokenPaymentNetwork from '../../../src/extensions/payment-network/native-tokens';
import NearNativePaymentNetwork from '../../../src/extensions/payment-network/near-native';
import NearTestnetNativePaymentNetwork from '../../../src/extensions/payment-network/near-testnet-native';

describe('extensions/payment-network/native-tokens', () => {
  const nearPaymentNetworkTests = [
    {
      name: 'Near',
      paymentNetwork: new NearNativePaymentNetwork() as NativeTokenPaymentNetwork,
      suffix: 'near',
    },
    {
      name: 'Near testnet',
      paymentNetwork: new NearTestnetNativePaymentNetwork() as NativeTokenPaymentNetwork,
      suffix: 'testnet',
    },
  ];
  // const nearTestntPaymentNetwork = new NearNativePaymentNetwork();
  nearPaymentNetworkTests.forEach((testCase) => {
    describe(testCase.name, () => {
      it('cannot createCreationAction with invalid payment address', () => {
        expect(() => {
          testCase.paymentNetwork.createCreationAction({
            paymentAddress: 'not a near address',
            refundAddress: `refund.${testCase.suffix}`,
            salt: 'ea3bc7caf64110ca',
          });
        }).toThrowError('paymentAddress is not a valid address');
      });
      it('can createCreationAction with valid payment address', () => {
        // 'must throw'
        expect(() => {
          testCase.paymentNetwork.createCreationAction({
            paymentAddress: `pay.${testCase.suffix}`,
            refundAddress: `refund.${testCase.suffix}`,
            salt: 'ea3bc7caf64110ca',
          });
        }).toBeTruthy();
      });
    });
  });
});
