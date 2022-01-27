import { UnsupportedCurrencyError } from '@requestnetwork/currency';
import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import AddressBasedPaymentNetwork from '../../../src/extensions/payment-network/address-based';

describe('extensions/payment-network/address-based', () => {
  it('address validation should throw when using unsupported currency type', () => {
    class TestAddressBasedPaymentNetwork extends AddressBasedPaymentNetwork {
      public testIsValidAddress() {
        this.isValidAddress('test', 'test');
      }
    }
    expect(() => {
      const testAddressBasedPaymentNetwork = new TestAddressBasedPaymentNetwork(
        ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED,
        'test',
        [],
        RequestLogicTypes.CURRENCY.ISO4217,
      );
      testAddressBasedPaymentNetwork.testIsValidAddress();
    }).toThrowError(
      'Default implementation of isValidAddressForNetwork() does not support currency type ISO4217. Please override this method if needed.',
    );
  });
  it('address validation should throw when using unsupported currency', () => {
    class TestAddressBasedPaymentNetwork extends AddressBasedPaymentNetwork {
      public testIsValidAddress() {
        this.isValidAddressForSymbolAndNetwork('test', 'test', 'test');
      }
    }
    expect(() => {
      const testAddressBasedPaymentNetwork = new TestAddressBasedPaymentNetwork(
        ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED,
        'test',
        [],
        RequestLogicTypes.CURRENCY.ERC20,
      );
      testAddressBasedPaymentNetwork.testIsValidAddress();
    }).toThrowError(new UnsupportedCurrencyError({ value: 'test', network: 'test' }));
  });
});
