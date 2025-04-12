import { CurrencyManager, UnsupportedCurrencyError } from '@requestnetwork/currency';
import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import AddressBasedPaymentNetwork from '../../../src/extensions/payment-network/address-based';

describe('extensions/payment-network/address-based', () => {
  it('address validation should throw when using unsupported currency type', () => {
    class TestAddressBasedPaymentNetwork extends AddressBasedPaymentNetwork {
      public constructor(
        extensionId: ExtensionTypes.PAYMENT_NETWORK_ID,
        currentVersion: string,
        supportedCurrencyType: RequestLogicTypes.CURRENCY,
      ) {
        super(CurrencyManager.getDefault(), extensionId, currentVersion, supportedCurrencyType);
      }
      public testIsValidAddress() {
        this.isValidAddress('test');
      }
    }
    expect(() => {
      const testAddressBasedPaymentNetwork = new TestAddressBasedPaymentNetwork(
        ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED,
        'test',
        RequestLogicTypes.CURRENCY.ISO4217,
      );
      testAddressBasedPaymentNetwork.testIsValidAddress();
    }).toThrowError(
      'Default implementation of isValidAddressForNetwork() does not support currency type ISO4217. Please override this method if needed.',
    );
  });
  it('address validation should throw when using unsupported currency', () => {
    class TestAddressBasedPaymentNetwork extends AddressBasedPaymentNetwork {
      public constructor(
        extensionId: ExtensionTypes.PAYMENT_NETWORK_ID,
        currentVersion: string,
        supportedCurrencyType: RequestLogicTypes.CURRENCY,
      ) {
        super(CurrencyManager.getDefault(), extensionId, currentVersion, supportedCurrencyType);
      }
      public testIsValidAddress() {
        this.isValidAddressForSymbolAndNetwork('test', 'test', 'mainnet');
      }
    }
    expect(() => {
      const testAddressBasedPaymentNetwork = new TestAddressBasedPaymentNetwork(
        ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED,
        'test',
        RequestLogicTypes.CURRENCY.ERC20,
      );
      testAddressBasedPaymentNetwork.testIsValidAddress();
    }).toThrowError(new UnsupportedCurrencyError({ value: 'test', network: 'mainnet' }));
  });
});
