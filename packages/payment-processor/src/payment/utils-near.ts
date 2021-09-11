import { BigNumber, BigNumberish, ethers } from 'ethers';
import { Contract } from 'near-api-js';
import { Near, WalletConnection } from 'near-api-js';
import { Near as NearPaymentDetection } from '@requestnetwork/payment-detection';

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

const GAS_LIMIT_IN_TGAS = 30;
const GAS_LIMIT = ethers.utils.parseUnits(GAS_LIMIT_IN_TGAS.toString(), 12);

/**
 * Used for mocking only.
 */
export const processNearPayment = async (
  walletConnection: WalletConnection,
  network: string,
  amount: BigNumberish,
  to: string,
  payment_reference: string,
): Promise<void> => {
  try {
    const contract = new Contract(
      walletConnection.account(),
      NearPaymentDetection.getContractName(network),
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
