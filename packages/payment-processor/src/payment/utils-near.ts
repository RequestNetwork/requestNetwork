import { BigNumber, BigNumberish, ethers } from 'ethers';
import { Contract, Near, WalletConnection } from 'near-api-js';
import {
  NearConversionNativeTokenPaymentDetector,
  NearNativeTokenPaymentDetector,
} from '@requestnetwork/payment-detection';
import { NearChains } from '@requestnetwork/currency';

/**
 * Callback arguments for the Near web wallet.
 * @member callbackUrl called upon transaction approval
 * @member callbackMeta (according to Near docs: `meta` will be attached to the `callbackUrl` as a url search param)
 */
export interface INearTransactionCallback {
  callbackUrl?: string;
  meta?: string;
}

export const isValidNearAddress = async (nearNetwork: Near, address: string): Promise<boolean> => {
  try {
    await nearNetwork.connection.provider.query(`account/${address}`, '');
    return true;
  } catch (e) {
    return false;
  }
};

export const isNearNetwork = (network?: string): boolean => {
  try {
    network && NearChains.assertChainSupported(network);
    return true;
  } catch {
    return false;
  }
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
  callback: INearTransactionCallback | undefined = undefined,
): Promise<void> => {
  if (version !== '0.2.0') {
    if (version === '0.1.0') {
      throw new Error(
        'Native Token payments on Near with extension v0.1.0 are not supported anymore',
      );
    }
    throw new Error('Native Token payments on Near only support v0.2.0 extensions');
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
    await contract.transfer_with_reference({
      args: {
        to,
        payment_reference: paymentReference,
      },
      gas: GAS_LIMIT_NATIVE,
      amount: amount.toString(),
      ...callback,
    });
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
  callback: INearTransactionCallback | undefined = undefined,
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
    await contract.transfer_with_reference({
      args: {
        payment_reference: paymentReference,
        to,
        amount,
        currency,
        fee_address: feeAddress,
        fee_amount: feeAmount,
        max_rate_timespan: maxRateTimespan,
      },
      gas: GAS_LIMIT_CONVERSION_TO_NATIVE,
      amount: maxToSpend.toString(),
      ...callback,
    });
    return;
  } catch (e) {
    throw new Error(`Could not pay Near request. Got ${e.message}`);
  }
};
