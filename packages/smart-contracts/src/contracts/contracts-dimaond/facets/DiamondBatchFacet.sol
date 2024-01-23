// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibSafeERC20} from '../libraries/LibSafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract DiamondBatchFacet {
  using LibSafeERC20 for IERC20;

  enum PaymentType {
    NATIVE,
    TOKEN
  }

  struct BatchPayment {
    address proxy;
    PaymentType paymentType;
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
   * @param totals The approvals to make per payment proxy and currency
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
      if (payments[i].paymentType == PaymentType.NATIVE) {
        (success, ) = payable(address(payments[i].proxy)).call{value: address(this).balance}(
          payments[i].paymentData
        );
      } else {
        (success, ) = address(payments[i].proxy).call{value: 0}(payments[i].paymentData);
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
