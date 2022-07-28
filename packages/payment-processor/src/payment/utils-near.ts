import { BigNumber, BigNumberish, ethers } from 'ethers';
import { Contract } from 'near-api-js';
import { Near, WalletConnection } from 'near-api-js';
import { NearNativeTokenPaymentDetector } from '@requestnetwork/payment-detection';

export const isValidNearAddress = async (nearNetwork: Near, address: string): Promise<boolean> => {
  try {
    await nearNetwork.connection.provider.query(`account/${address}`, '');
    return true;
  } catch (e) {
    return false;
  }
};

export const isNearNetwork = (network?: string): boolean => {
  return !!network && (network === 'aurora-testnet' || network === 'aurora');
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

/**
 * Export used for mocking only.
 */
export const processNearPayment = async (
  walletConnection: WalletConnection,
  network: string,
  amount: BigNumberish,
  to: string,
  payment_reference: string,
  version = '0.2.0',
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
    await contract.transfer_with_reference(
      {
        to,
        payment_reference,
      },
      GAS_LIMIT.toString(),
      amount.toString(),
    );
    return;
  } catch (e) {
    throw new Error(`Could not pay Near request. Got ${e.message}`);
  }
};
