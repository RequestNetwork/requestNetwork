import { constants, BigNumberish, BigNumber, ethers } from 'ethers';

import { ClientTypes } from '@requestnetwork/types';
// import { getPaymentNetworkExtension } from '@requestnetwork/payment-detection';
// import { EvmChains } from '@requestnetwork/currency';

//import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  //getProvider,
  getRequestPaymentValues,
  //getSigner,
  validateErc20FeeProxyRequest,
  //validateRequest,
} from './utils';
//import { IPreparedTransaction } from './prepared-transaction';

//Paytr custom import
import { abi as ABI_0_1_0 } from '@requestnetwork/smart-contracts/src/lib/artifacts/Paytr/0.1.0.json';

export function encodePayErc20FeeRequest(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): string {
  validateErc20FeeProxyRequest(request, amount, feeAmountOverride);

  const tokenAddress = request.currencyInfo.value;
  const { paymentReference, paymentAddress, feeAddress, feeAmount } =
    getRequestPaymentValues(request);
  const amountToPay = getAmountToPay(request, amount);
  const feeToPay = BigNumber.from(feeAmountOverride || feeAmount || 0);
  const paytrInterface = new ethers.utils.Interface(ABI_0_1_0);

  return paytrInterface.encodeFunctionData('payOutERC20Invoice', [
    tokenAddress,
    paymentAddress,
    amountToPay,
    `0x${paymentReference}`,
    feeToPay,
    feeAddress || constants.AddressZero,
  ]);
}
