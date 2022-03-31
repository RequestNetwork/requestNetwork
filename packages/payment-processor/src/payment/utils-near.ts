import { BigNumber, BigNumberish, ethers } from 'ethers';
import { Contract } from 'near-api-js';
import { Near, WalletConnection } from 'near-api-js';
import {
  NearNativeTokenPaymentDetector,
  NearConversionNativeTokenPaymentDetector,
} from '@requestnetwork/payment-detection';

export const isValidNearAddress = async (nearNetwork: Near, address: string): Promise<boolean> => {
  try {
    await nearNetwork.connection.provider.query(`account/${address}`, '');
    return true;
  } catch (e) {
    return false;
  }
};

export const isNearNetwork = (network?: string): boolean => {
  if (network === 'aurora-testnet' || network === 'aurora') {
    console.warn(`Using ${network} as an alias for Near will be deprecated`);
    return true;
  }
  return !!network && (network === 'near-testnet' || network === 'near');
};

export const isNearAccountSolvent = (
  amount: BigNumberish,
  nearWalletConnection: WalletConnection,
): Promise<boolean> => {
  return nearWalletConnection
    .account()
    .state()
    .then((state) => {
      const balance = BigNumber.from(state?.amount ?? '0');
      return balance.gte(amount);
    });
};

const GAS_LIMIT_IN_TGAS = 50;
const GAS_LIMIT = ethers.utils.parseUnits(GAS_LIMIT_IN_TGAS.toString(), 12);
const GAS_LIMIT_NATIVE = GAS_LIMIT.toString();
const GAS_LIMIT_CONVERSION_TO_NATIVE = GAS_LIMIT.mul(2).toString();

export const processNearPayment = async (
  walletConnection: WalletConnection,
  network: string,
  amount: BigNumberish,
  to: string,
  paymentReference: string,
  version = '0.2.0',
): Promise<void> => {
  if (version !== '0.2.0') {
    if (version === '0.1.0') {
      throw new Error(
        'Native Token payments on Near with extension v0.1.0 are not supported anymore',
      );
    }
    throw new Error('Native Token payments on Near only support extensions starting at 0.2.0');
  }
  if (!(await isValidNearAddress(walletConnection._near, to))) {
    throw new Error(`Invalid NEAR payment address: ${to}`);
  }

  try {
    const contract = new Contract(
      walletConnection.account(),
      NearNativeTokenPaymentDetector.getContractName(network, version),
      {
        changeMethods: ['transfer_with_reference'],
        viewMethods: [],
      },
    ) as any;
    await contract.transfer_with_reference(
      {
        to,
        payment_reference: paymentReference,
      },
      GAS_LIMIT_NATIVE,
      amount.toString(),
    );
    return;
  } catch (e) {
    throw new Error(`Could not pay Near request. Got ${e.message}`);
  }
};

/**
 * Processes a payment in Near native token, with conversion.
 *
 * @param amount is defined with 2 decimals, denominated in `currency`
 * @param currency is a currency ticker (e.g. "ETH" or "USD")
 * @param maxRateTimespan accepts any kind rate's age if '0'
 */
export const processNearPaymentWithConversion = async (
  walletConnection: WalletConnection,
  network: string,
  amount: BigNumberish,
  to: string,
  paymentReference: string,
  currency: string,
  feeAddress: string,
  feeAmount: BigNumberish,
  maxToSpend: BigNumberish,
  maxRateTimespan = '0',
  version = '0.1.0',
): Promise<void> => {
  if (version !== '0.1.0') {
    throw new Error('Native Token with conversion payments on Near only support v0.1.0 extensions');
  }

  if (!(await isValidNearAddress(walletConnection._near, to))) {
    throw new Error(`Invalid NEAR payment address: ${to}`);
  }

  if (!(await isValidNearAddress(walletConnection._near, feeAddress))) {
    throw new Error(`Invalid NEAR fee address: ${feeAddress}`);
  }
  try {
    const contract = new Contract(
      walletConnection.account(),
      NearConversionNativeTokenPaymentDetector.getContractName(network, version),
      {
        changeMethods: ['transfer_with_reference'],
        viewMethods: [],
      },
    ) as any;
    await contract.transfer_with_reference(
      {
        payment_reference: paymentReference,
        to,
        amount,
        currency,
        fee_address: feeAddress,
        fee_amount: feeAmount,
        max_rate_timespan: maxRateTimespan,
      },
      GAS_LIMIT_CONVERSION_TO_NATIVE,
      maxToSpend.toString(),
    );
    return;
  } catch (e) {
    throw new Error(`Could not pay Near request. Got ${e.message}`);
  }
};
