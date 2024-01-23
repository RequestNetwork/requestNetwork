// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibDiamond} from '../libraries/LibDiamond.sol';
import {LibSafeERC20} from '../libraries/LibSafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import 'hardhat/console.sol';

contract DiamondBatchFacet {
  using LibSafeERC20 for IERC20;

  enum Operation {
    CALL,
    DELEGATECALL
  }

  struct BatchPayment {
    address proxy;
    Operation operation;
    bytes paymentData;
  }

  struct Total {
    address proxy;
    address paymentCurrency;
    uint256 amount;
  }

  /**
   * @notice Method to pay several payments at once
   * @param payments list of the payments
   *
   * NOTE:
   * Payments in native currency must be processed with the operation CALL.
   * Otherwise the whole msg.value is send back to the user after the first ETH payment,
   * and subsequent payments can't be processed. Since we can't CALL directly a facet, we target the Diamond Proxy itself.
   *
   * Payments in ERC20 must be processed with the opration DELEGATECALL.
   * Otherwise, the transferFrom will fail. We target the facet directly to save gas.
   */
  function batchPay(BatchPayment[] calldata payments, Total[] calldata totals) external payable {
    for (uint256 i = 0; i < totals.length; i++) {
      IERC20(totals[i].paymentCurrency).safeTransferFrom(
        msg.sender,
        address(this),
        totals[i].amount
      );
      IERC20(totals[i].paymentCurrency).safeApprove(totals[i].proxy, totals[i].amount);
    }

    for (uint256 i = 0; i < payments.length; i++) {
      bool success;
      if (payments[i].operation == Operation.CALL) {
        console.log(i);
        (success, ) = payable(address(payments[i].proxy)).call{value: address(this).balance}(
          payments[i].paymentData
        );
        console.log(success);
      } else {
        console.log(i);
        // Execute the payment
        (success, ) = address(payments[i].proxy).call{value: 0}(payments[i].paymentData);
        console.log(success);
      }
      require(success, 'One of the payment failed');
    }

    // After all payment are processed, send back the remaining ETH
    if (address(this).balance > 0) {
      (bool sendBackSuccess, ) = payable(msg.sender).call{value: address(this).balance}('');
      require(sendBackSuccess, 'Could not send back the remaining ETH to the user');
    }

    // After all payment are processed, send back the remaining Tokens
    for (uint256 i = 0; i < totals.length; i++) {
      if (IERC20(totals[i].paymentCurrency).balanceOf(address(this)) > 0) {
        IERC20(totals[i].paymentCurrency).safeTransferFrom(
          address(this),
          msg.sender,
          totals[i].amount
        );
      }
    }
  }
}
