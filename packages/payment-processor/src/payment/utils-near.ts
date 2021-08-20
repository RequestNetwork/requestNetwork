import { BigNumber, BigNumberish, ethers } from 'ethers';
import { Contract } from 'near-api-js';
import { Near, WalletConnection } from 'near-api-js';
import { Near as NearPaymentDetection } from '@requestnetwork/payment-detection';

export async function isValidNearAddress(nearNetwork: Near, address: string) {
  try {
    await nearNetwork.connection.provider.query(`account/${address}`, '');
    return true;
  } catch (e) {
    console.warn(e.stack);
    return false;
  }
}

export const isNearNetwork = (network?: string): boolean => {
  return !!network && (network === 'aurora-testnet' || network === 'aurora');
};

export const isNearAccountSolvent = (
  amount: BigNumberish,
  nearWalletConnection: WalletConnection,
) => {
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
export async function processNearPayment(
  walletConnection: WalletConnection,
  network: string,
  amount: BigNumberish,
  to: string,
  payment_reference: string,
) {
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
        amount,
        payment_reference,
      },
      GAS_LIMIT,
      amount,
    );
    return;
  } catch (e) {
    throw new Error(`Could not pay Near request. Got ${e.message}`);
  }
}
