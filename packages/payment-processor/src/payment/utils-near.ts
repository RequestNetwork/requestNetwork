import { BigNumber, BigNumberish, ethers } from 'ethers';
import { Contract, Near, WalletConnection } from 'near-api-js';
import {
  NearConversionNativeTokenPaymentDetector,
  NearNativeTokenPaymentDetector,
} from '@requestnetwork/payment-detection';
import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';
import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';

/**
 * Callback arguments for the Near web wallet.
 * @member callbackUrl called upon transaction approval
 * @member meta (according to Near docs: `meta` will be attached to the `callbackUrl` as a url search param)
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

export const isNearAccountSolvent = (
  amount: BigNumberish,
  nearWalletConnection: WalletConnection,
  token?: RequestLogicTypes.ICurrency,
): Promise<boolean> => {
  if (!token || token.type === RequestLogicTypes.CURRENCY.ETH) {
    return nearWalletConnection
      .account()
      .state()
      .then((state) => {
        const balance = BigNumber.from(state?.amount ?? '0');
        return balance.gte(amount);
      });
  }
  if (token.type === RequestLogicTypes.CURRENCY.ERC20) {
    const fungibleContract = new Contract(nearWalletConnection.account(), token.value, {
      changeMethods: [],
      viewMethods: ['ft_balance_of'],
    }) as any;
    return fungibleContract
      .ft_balance_of({
        account_id: nearWalletConnection.account().accountId,
      })
      .then((balance: string) => BigNumber.from(balance).gte(amount));
  }
  throw new Error(`isNearAccountSolvent not implemented for ${token.type}`);
};

const GAS_LIMIT_IN_TGAS = 50;
const GAS_LIMIT = ethers.utils.parseUnits(GAS_LIMIT_IN_TGAS.toString(), 12);
const GAS_LIMIT_NATIVE = GAS_LIMIT.toString();
const GAS_LIMIT_CONVERSION_TO_NATIVE = GAS_LIMIT.mul(2).toString(); // 200 TGas
const GAS_LIMIT_FUNGIBLE_PROXY = GAS_LIMIT.mul(4).toString(); // 400 TGas

export const processNearPayment = async (
  walletConnection: WalletConnection,
  network: CurrencyTypes.NearChainName,
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
  network: CurrencyTypes.NearChainName,
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

export const processNearFungiblePayment = async (
  walletConnection: WalletConnection,
  network: CurrencyTypes.NearChainName,
  amount: BigNumberish,
  to: string,
  paymentReference: string,
  currencyAddress: string,
  feeAddress: string,
  feeAmount: BigNumberish,
  callback: INearTransactionCallback | undefined = undefined,
): Promise<void> => {
  const fungibleContract = new Contract(walletConnection.account(), currencyAddress, {
    changeMethods: ['ft_transfer_call'],
    viewMethods: [],
  }) as any;

  const proxyAddress = erc20FeeProxyArtifact.getAddress(network, 'near');
  await fungibleContract.ft_transfer_call({
    args: {
      receiver_id: proxyAddress,
      amount: BigNumber.from(amount).add(feeAmount).toString(),
      msg: JSON.stringify({
        fee_address: feeAddress,
        fee_amount: feeAmount,
        payment_reference: paymentReference,
        to,
      }),
    },
    gas: GAS_LIMIT_FUNGIBLE_PROXY,
    amount: '1'.toString(), // 1 yoctoNEAR deposit is mandatory for ft_transfer_call
    ...callback,
  });
};

type StorageBalance = {
  total: string;
  available: string;
};

// min. 0.00125 Ⓝ
const MIN_STORAGE_FOR_FUNGIBLE = '1250000000000000000000';

/**
 * Stores the minimum deposit amount on the `paymentAddress` account for `tokenAddress`.
 * This does not check the existing deposit, if any, and should be called if `isReceiverReady` is false.
 * @param walletConnection
 * @param tokenAddress
 * @param paymentAddress
 */
export const storageDeposit = async (
  walletConnection: WalletConnection,
  tokenAddress: string,
  paymentAddress: string,
): Promise<void> => {
  const fungibleContract = new Contract(walletConnection.account(), tokenAddress, {
    changeMethods: ['storage_deposit'],
    viewMethods: [],
  }) as any;
  await fungibleContract.storage_deposit({
    args: { account_id: paymentAddress },
    value: MIN_STORAGE_FOR_FUNGIBLE,
  });
};

/**
 * This checks that the `paymentAddress` has enough storage on the `tokenAddress` to receive tokens.
 *
 * It returns false if trying to send tokens to the `paymentAddress` would result in:
 *
 * - 'Smart contract panicked: The account account.identifier.near is not registered'
 *
 */
export const isReceiverReady = async (
  walletConnection: WalletConnection,
  tokenAddress: string,
  paymentAddress: string,
): Promise<boolean> => {
  const fungibleContract = new Contract(walletConnection.account(), tokenAddress, {
    changeMethods: [],
    viewMethods: ['storage_balance_of'],
  }) as any;
  const storage = (await fungibleContract.storage_balance_of({
    account_id: paymentAddress,
  })) as StorageBalance | null;
  return !!storage && BigNumber.from(storage?.total).gte(MIN_STORAGE_FOR_FUNGIBLE);
};
