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

  it('base isValidAddress should reject TRON addresses for ERC20 currency type', () => {
    class TestAddressBasedPaymentNetwork extends AddressBasedPaymentNetwork {
      public constructor() {
        super(
          CurrencyManager.getDefault(),
          ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED,
          'test',
          RequestLogicTypes.CURRENCY.ERC20,
        );
      }
      public testIsValidAddress(address: string) {
        return this.isValidAddress(address);
      }
    }
    const pn = new TestAddressBasedPaymentNetwork();
    // A valid TRON Base58 address should NOT be accepted by the base class
    // because the base class has no network context to know this is a TRON request
    expect(pn.testIsValidAddress('TJCnKsPa7y5okkXvQAidZBzqx3QyQ6sxMW')).toBe(false);
    // A valid Ethereum address should still be accepted
    expect(pn.testIsValidAddress('0x0000000000000000000000000000000000000000')).toBe(true);
  });

  it('static isTronAddress should correctly validate TRON addresses', () => {
    expect(AddressBasedPaymentNetwork.isTronAddress('TJCnKsPa7y5okkXvQAidZBzqx3QyQ6sxMW')).toBe(
      true,
    );
    expect(AddressBasedPaymentNetwork.isTronAddress('T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb')).toBe(
      true,
    );
    // Invalid: too short
    expect(AddressBasedPaymentNetwork.isTronAddress('TJCnKsPa7y5okkXvQAid')).toBe(false);
    // Invalid: doesn't start with T
    expect(
      AddressBasedPaymentNetwork.isTronAddress('0x0000000000000000000000000000000000000000'),
    ).toBe(false);
    // Invalid: empty
    expect(AddressBasedPaymentNetwork.isTronAddress('')).toBe(false);
  });
});
