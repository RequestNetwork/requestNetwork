// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './lib/SafeERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces/ERC20FeeProxy.sol';
import './interfaces/EthereumFeeProxy.sol';
import './ChainlinkConversionPath.sol';

/**
 * @title BatchNoConversionPayments
 * @notice  This contract makes multiple payments with references, in one transaction:
 *          - on: ERC20 Payment Proxy and Native (ETH) Payment Proxy of the Request Network protocol
 *          - to: multiple addresses
 *          - fees: ERC20 and Native (ETH) proxies fees are paid to the same address
 *                  An additional batch fee is paid to the same address
 *         If one transaction of the batch fail, every transactions are reverted.
 * @dev It is a clone of BatchPayment.sol, with three main modifications:
 *         - function "receive" has one other condition: payerAuthorized
 *         - fees are now divided by 10_000 instead of 1_000 in previous version
 *         - batch payment functions have new names and are now public, instead of external
 */
contract BatchNoConversionPayments is Ownable {
  using SafeERC20 for IERC20;

  IERC20FeeProxy public paymentErc20Proxy;
  IEthereumFeeProxy public paymentNativeProxy;
  ChainlinkConversionPath public chainlinkConversionPath;

  /** Used to calculate batch fees: batchFee = 30 represent 0.30% of fee */
  uint16 public batchFee;
  /** Used to calculate batch fees: divide batchFee by feeDenominator */
  uint16 internal feeDenominator = 10000;
  /** The amount of the batch fee cannot exceed a predefined amount in USD, e.g:
      batchFeeAmountUSDLimit = 150 * 1e8 represents $150 */
  uint64 public batchFeeAmountUSDLimit;

  /** transferBackRemainingNativeTokens is set to false only if the payer use batchPayments
  and call both batchNativePayments and batchNativeConversionPayments */
  bool internal transferBackRemainingNativeTokens = true;

  address public USDAddress;
  address public NativeAddress;
  address[][] public pathsNativeToUSD;

  /** Contains the address of a token, the sum of the amount and fees paid with it, and the batch fee amount */
  struct Token {
    address tokenAddress;
    uint256 amountAndFee;
    uint256 batchFeeAmount;
  }

  /**
   * @dev All the information of a request, except the feeAddress
   *   recipient: Recipient address of the payment
   *   requestAmount: Request amount, in fiat for conversion payment
   *   path: Only for conversion payment: the conversion path
   *   paymentReference: Unique reference of the payment
   *   feeAmount: The fee amount, denominated in the first currency of `path` for conversion payment
   *   maxToSpend: Only for conversion payment:
   *               Maximum amount the payer wants to spend, denominated in the last currency of `path`:
   *                it includes fee proxy but NOT the batch fees to pay
   *   maxRateTimespan: Only for conversion payment:
   *                    Max acceptable times span for conversion rates, ignored if zero
   */
  struct RequestDetail {
    address recipient;
    uint256 requestAmount;
    address[] path;
    bytes paymentReference;
    uint256 feeAmount;
    uint256 maxToSpend;
    uint256 maxRateTimespan;
  }

  /**
   * @param _paymentErc20Proxy The address to the ERC20 fee payment proxy to use.
   * @param _paymentNativeProxy The address to the Native fee payment proxy to use.
   * @param _chainlinkConversionPath The address of the conversion path contract.
   * @param _owner Owner of the contract.
   */
  constructor(
    address _paymentErc20Proxy,
    address _paymentNativeProxy,
    address _chainlinkConversionPath,
    address _owner
  ) {
    paymentErc20Proxy = IERC20FeeProxy(_paymentErc20Proxy);
    paymentNativeProxy = IEthereumFeeProxy(_paymentNativeProxy);
    chainlinkConversionPath = ChainlinkConversionPath(_chainlinkConversionPath);
    transferOwnership(_owner);
    batchFee = 0;
  }

  /**
   * This contract is non-payable.
   * @dev See the end of `paymentNativeProxy.transferWithReferenceAndFee` where the leftover is given back.
   */
  receive() external payable virtual {
    require(msg.value == 0, 'Non-payable');
  }

  /**
   * @notice Send a batch of Native token payments with fees and paymentReferences to multiple accounts.
   *         If one payment fails, the whole batch reverts.
   * @param requestDetails List of Native tokens requests to pay.
   * @param skipFeeUSDLimit Setting the value to true skips the USD fee limit, and reduces gas consumption.
   * @param feeAddress The fee recipient.
   * @dev It uses NativeFeeProxy (EthereumFeeProxy) to pay an invoice and fees with a payment reference.
   *      Make sure: msg.value >= sum(_amouts)+sum(_feeAmounts)+sumBatchFeeAmount
   */
  function batchNativePayments(
    RequestDetail[] calldata requestDetails,
    bool skipFeeUSDLimit,
    address payable feeAddress
  ) public payable returns (uint256) {
    return _batchNativePayments(requestDetails, skipFeeUSDLimit, 0, payable(feeAddress));
  }

  /**
   * @notice Send a batch of ERC20 payments with fees and paymentReferences to multiple accounts.
   * @param requestDetails List of ERC20 requests to pay, with only one ERC20 token.
   * @param pathsToUSD The list of paths into USD for every token, used to limit the batch fees.
   *                   Without paths, there is not a fee limitation, and it consumes less gas.
   * @param feeAddress The fee recipient.
   * @dev Uses ERC20FeeProxy to pay an invoice and fees, with a payment reference.
   *      Make sure this contract has enough allowance to spend the payer's token.
   *      Make sure the payer has enough tokens to pay the amount, the fee, and the batch fee.
   */
  function batchERC20Payments(
    RequestDetail[] calldata requestDetails,
    address[][] calldata pathsToUSD,
    address feeAddress
  ) public returns (uint256) {
    return _batchERC20Payments(requestDetails, pathsToUSD, 0, feeAddress);
  }

  /**
   * @notice Send a batch of ERC20 payments with fees and paymentReferences to multiple accounts, with multiple tokens.
   * @param requestDetails List of ERC20 requests to pay.
   * @param pathsToUSD The list of paths into USD for every token, used to limit the batch fees.
   *                   Without paths, there is not a fee limitation, and it consumes less gas.
   * @param feeAddress The fee recipient.
   * @dev It uses ERC20FeeProxy to pay an invoice and fees, with a payment reference.
   *      Make sure this contract has enough allowance to spend the payer's token.
   *      Make sure the payer has enough tokens to pay the amount, the fee, and the batch fee.
   */
  function batchMultiERC20Payments(
    RequestDetail[] calldata requestDetails,
    address[][] calldata pathsToUSD,
    address feeAddress
  ) public returns (uint256) {
    return _batchMultiERC20Payments(requestDetails, pathsToUSD, 0, feeAddress);
  }

  /**
   * @notice Send a batch of Native token payments with fees and paymentReferences to multiple accounts.
   *         If one payment fails, the whole batch reverts.
   * @param requestDetails List of Native tokens requests to pay.
   * @param skipFeeUSDLimit Setting the value to true skips the USD fee limit, and reduces gas consumption.
   * @param batchFeeAmountUSD The batch fee amount in USD already paid.
   * @param feeAddress The fee recipient.
   * @dev It uses NativeFeeProxy (EthereumFeeProxy) to pay an invoice and fees with a payment reference.
   *      Make sure: msg.value >= sum(_amouts)+sum(_feeAmounts)+sumBatchFeeAmount
   */
  function _batchNativePayments(
    RequestDetail[] calldata requestDetails,
    bool skipFeeUSDLimit,
    uint256 batchFeeAmountUSD,
    address payable feeAddress
  ) internal returns (uint256) {
    // amount is used to get the total amount and then used as batch fee amount
    uint256 amount = 0;

    // Batch contract pays the requests thourgh NativeFeeProxy (EthFeeProxy)
    for (uint256 i = 0; i < requestDetails.length; i++) {
      RequestDetail calldata rD = requestDetails[i];
      require(address(this).balance >= rD.requestAmount + rD.feeAmount, 'Not enough funds');
      amount += rD.requestAmount;

      paymentNativeProxy.transferWithReferenceAndFee{value: rD.requestAmount + rD.feeAmount}(
        payable(rD.recipient),
        rD.paymentReference,
        rD.feeAmount,
        payable(feeAddress)
      );
    }

    // amount is updated into batch fee amount
    amount = (amount * batchFee) / feeDenominator;
    if (skipFeeUSDLimit == false) {
      (amount, batchFeeAmountUSD) = calculateBatchFeeToPay(
        amount,
        pathsNativeToUSD[0][0],
        batchFeeAmountUSD,
        pathsNativeToUSD
      );
    }
    // Check that batch contract has enough funds to pay batch fee
    require(address(this).balance >= amount, 'Not enough funds for batch fee');
    // Batch pays batch fee
    feeAddress.transfer(amount);

    // Batch contract transfers the remaining Native tokens to the payer
    if (transferBackRemainingNativeTokens && address(this).balance > 0) {
      (bool sendBackSuccess, ) = payable(msg.sender).call{value: address(this).balance}('');
      require(sendBackSuccess, 'Could not send remaining funds to the payer');
    }
    return batchFeeAmountUSD;
  }

  /**
   * @notice Send a batch of ERC20 payments with fees and paymentReferences to multiple accounts.
   * @param requestDetails List of ERC20 requests to pay, with only one ERC20 token.
   * @param pathsToUSD The list of paths into USD for every token, used to limit the batch fees.
   *                   Without paths, there is not a fee limitation, and it consumes less gas.
   * @param batchFeeAmountUSD The batch fee amount in USD already paid.
   * @param feeAddress The fee recipient.
   * @dev Uses ERC20FeeProxy to pay an invoice and fees, with a payment reference.
   *      Make sure this contract has enough allowance to spend the payer's token.
   *      Make sure the payer has enough tokens to pay the amount, the fee, and the batch fee.
   */
  function _batchERC20Payments(
    RequestDetail[] calldata requestDetails,
    address[][] calldata pathsToUSD,
    uint256 batchFeeAmountUSD,
    address feeAddress
  ) internal returns (uint256) {
    uint256 amountAndFee = 0;
    uint256 batchFeeAmount = 0;
    for (uint256 i = 0; i < requestDetails.length; i++) {
      amountAndFee += requestDetails[i].requestAmount + requestDetails[i].feeAmount;
      batchFeeAmount += requestDetails[i].requestAmount;
    }
    batchFeeAmount = (batchFeeAmount * batchFee) / feeDenominator;

    // batchFeeToPay and batchFeeAmountUSD are updated if needed
    (batchFeeAmount, batchFeeAmountUSD) = calculateBatchFeeToPay(
      batchFeeAmount,
      requestDetails[0].path[0],
      batchFeeAmountUSD,
      pathsToUSD
    );

    IERC20 requestedToken = IERC20(requestDetails[0].path[0]);

    transferToContract(requestedToken, amountAndFee, batchFeeAmount, address(paymentErc20Proxy));

    // Payer pays batch fee amount
    require(
      safeTransferFrom(requestDetails[0].path[0], feeAddress, batchFeeAmount),
      'Batch fee transferFrom() failed'
    );

    // Batch contract pays the requests using Erc20FeeProxy
    for (uint256 i = 0; i < requestDetails.length; i++) {
      RequestDetail calldata rD = requestDetails[i];
      paymentErc20Proxy.transferFromWithReferenceAndFee(
        rD.path[0],
        rD.recipient,
        rD.requestAmount,
        rD.paymentReference,
        rD.feeAmount,
        feeAddress
      );
    }

    return batchFeeAmountUSD;
  }

  /**
   * @notice Send a batch of ERC20 payments with fees and paymentReferences to multiple accounts, with multiple tokens.
   * @param requestDetails List of ERC20 requests to pay.
   * @param pathsToUSD The list of paths into USD for every token, used to limit the batch fees.
   *                   Without paths, there is not a fee limitation, and it consumes less gas.
   * @param batchFeeAmountUSD The batch fee amount in USD already paid.
   * @param feeAddress The fee recipient.
   * @dev It uses ERC20FeeProxy to pay an invoice and fees, with a payment reference.
   *      Make sure this contract has enough allowance to spend the payer's token.
   *      Make sure the payer has enough tokens to pay the amount, the fee, and the batch fee.
   */
  function _batchMultiERC20Payments(
    RequestDetail[] calldata requestDetails,
    address[][] calldata pathsToUSD,
    uint256 batchFeeAmountUSD,
    address feeAddress
  ) internal returns (uint256) {
    Token[] memory uTokens = getUTokens(requestDetails);

    // The payer transfers tokens to the batch contract and pays batch fee
    for (uint256 i = 0; i < uTokens.length && uTokens[i].amountAndFee > 0; i++) {
      uTokens[i].batchFeeAmount = (uTokens[i].batchFeeAmount * batchFee) / feeDenominator;
      IERC20 requestedToken = IERC20(uTokens[i].tokenAddress);
      transferToContract(
        requestedToken,
        uTokens[i].amountAndFee,
        uTokens[i].batchFeeAmount,
        address(paymentErc20Proxy)
      );

      // Payer pays batch fee amount

      uint256 batchFeeToPay = uTokens[i].batchFeeAmount;

      (batchFeeToPay, batchFeeAmountUSD) = calculateBatchFeeToPay(
        batchFeeToPay,
        uTokens[i].tokenAddress,
        batchFeeAmountUSD,
        pathsToUSD
      );

      require(
        safeTransferFrom(uTokens[i].tokenAddress, feeAddress, batchFeeToPay),
        'Batch fee transferFrom() failed'
      );
    }

    // Batch contract pays the requests using Erc20FeeProxy
    for (uint256 i = 0; i < requestDetails.length; i++) {
      RequestDetail calldata rD = requestDetails[i];
      paymentErc20Proxy.transferFromWithReferenceAndFee(
        rD.path[0],
        rD.recipient,
        rD.requestAmount,
        rD.paymentReference,
        rD.feeAmount,
        feeAddress
      );
    }
    return batchFeeAmountUSD;
  }

  /*
   * Helper functions
   */

  /**
   * Top up the contract with enough `requestedToken` to pay `amountAndFee`.
   * The contract is NOT topped-up for `batchFeeAmount`.
   *
   * It also performs a few checks:
   * - checks that the batch contract has enough allowance from the payer
   * - checks that the payer has enough funds, including batch fees
   * - increases the allowance of the contract to use the payment proxy if needed
   *
   * @param requestedToken The token to pay
   * @param amountAndFee The amount and the fee for a token to pay
   * @param batchFeeAmount The batch fee amount for a token to pay
   * @param paymentProxyAddress The payment proxy address used to pay
   */
  function transferToContract(
    IERC20 requestedToken,
    uint256 amountAndFee,
    uint256 batchFeeAmount,
    address paymentProxyAddress
  ) internal {
    // Check proxy's allowance from user
    require(
      requestedToken.allowance(msg.sender, address(this)) >= amountAndFee,
      'Insufficient allowance for batch to pay'
    );
    // Check user's funds to pay amounts, it is an approximation for conversion payment
    require(
      requestedToken.balanceOf(msg.sender) >= amountAndFee + batchFeeAmount,
      'Not enough funds, including fees'
    );

    // Transfer the amount and fees (no batch fees) required for the token on the batch contract
    require(
      safeTransferFrom(address(requestedToken), address(this), amountAndFee),
      'payment transferFrom() failed'
    );

    // Batch contract approves Erc20ConversionProxy to spend the token
    if (requestedToken.allowance(address(this), paymentProxyAddress) < amountAndFee) {
      approvePaymentProxyToSpend(address(requestedToken), paymentProxyAddress);
    }
  }

  /**
   * It create a list of unique tokens used and the amounts associated.
   * It only considers tokens having: requestAmount + feeAmount > 0.
   * Regarding ERC20 no conversion payments:
   *   batchFeeAmount is the sum of requestAmount and feeAmount.
   *   Out of the function, batch fee rate is applied
   * @param requestDetails List of requests to pay.
   */
  function getUTokens(RequestDetail[] calldata requestDetails)
    internal
    pure
    returns (Token[] memory uTokens)
  {
    // A list of unique tokens, with the sum of maxToSpend by token
    uTokens = new Token[](requestDetails.length);
    for (uint256 i = 0; i < requestDetails.length; i++) {
      for (uint256 k = 0; k < requestDetails.length; k++) {
        RequestDetail calldata rD = requestDetails[i];
        // If the token is already in the existing uTokens list
        if (uTokens[k].tokenAddress == rD.path[rD.path.length - 1]) {
          if (rD.path.length > 1) {
            uTokens[k].amountAndFee += rD.maxToSpend;
          } else {
            // It is not a conversion payment
            uTokens[k].amountAndFee += rD.requestAmount + rD.feeAmount;
            uTokens[k].batchFeeAmount += rD.requestAmount;
          }
          break;
        }
        // If the token is not in the list (amountAndFee = 0)
        else if (
          uTokens[k].amountAndFee == 0 && (rD.maxToSpend > 0 || rD.requestAmount + rD.feeAmount > 0)
        ) {
          uTokens[k].tokenAddress = rD.path[rD.path.length - 1];

          if (rD.path.length > 1) {
            // amountAndFee is used to store _maxToSpend, useful to send enough tokens to this contract
            uTokens[k].amountAndFee = rD.maxToSpend;
          } else {
            // It is not a conversion payment
            uTokens[k].amountAndFee = rD.requestAmount + rD.feeAmount;
            uTokens[k].batchFeeAmount = rD.requestAmount;
          }
          break;
        }
      }
    }
  }

  /**
   * Calculate the batch fee amount to pay, using the USD fee limitation.
   * Without pathsToUSD or a wrong one, the fee limitation is not applied.
   * @param batchFeeToPay The amount of batch fee to pay
   * @param tokenAddress The address of the token
   * @param batchFeeAmountUSD The batch fee amount in USD already paid.
   * @param pathsToUSD The list of paths into USD for every token, used to limit the batch fees.
   *                   Without paths, there is not a fee limitation, and it consumes less gas.
   */
  function calculateBatchFeeToPay(
    uint256 batchFeeToPay,
    address tokenAddress,
    uint256 batchFeeAmountUSD,
    address[][] memory pathsToUSD
  ) internal view returns (uint256, uint256) {
    // Fees are not limited if there is no pathsToUSD
    // Excepted if batchFeeAmountUSD is already >= batchFeeAmountUSDLimit
    if (pathsToUSD.length == 0 && batchFeeAmountUSD < batchFeeAmountUSDLimit) {
      return (batchFeeToPay, batchFeeAmountUSD);
    }

    // Apply the fee limit and calculate if needed batchFeeToPay
    if (batchFeeAmountUSD < batchFeeAmountUSDLimit) {
      for (uint256 i = 0; i < pathsToUSD.length; i++) {
        // Check if the pathToUSD is right
        if (
          pathsToUSD[i][0] == tokenAddress && pathsToUSD[i][pathsToUSD[i].length - 1] == USDAddress
        ) {
          (uint256 conversionUSD, ) = chainlinkConversionPath.getConversion(
            batchFeeToPay,
            pathsToUSD[i]
          );
          // Calculate the batch fee to pay, taking care of the batchFeeAmountUSDLimit
          uint256 conversionToPayUSD = conversionUSD;
          if (batchFeeAmountUSD + conversionToPayUSD > batchFeeAmountUSDLimit) {
            conversionToPayUSD = batchFeeAmountUSDLimit - batchFeeAmountUSD;
            batchFeeToPay = (batchFeeToPay * conversionToPayUSD) / conversionUSD;
          }
          batchFeeAmountUSD += conversionToPayUSD;
          // Add only once the fees
          break;
        }
      }
    } else {
      batchFeeToPay = 0;
    }
    return (batchFeeToPay, batchFeeAmountUSD);
  }

  /**
   * @notice Authorizes the proxy to spend a new request currency (ERC20).
   * @param _erc20Address Address of an ERC20 used as the request currency.
   * @param _paymentErc20Proxy Address of the proxy.
   */
  function approvePaymentProxyToSpend(address _erc20Address, address _paymentErc20Proxy) internal {
    IERC20 erc20 = IERC20(_erc20Address);
    uint256 max = 2**256 - 1;
    erc20.safeApprove(address(_paymentErc20Proxy), max);
  }

  /**
   * @notice Call transferFrom ERC20 function and validates the return data of a ERC20 contract call.
   * @dev This is necessary because of non-standard ERC20 tokens that don't have a return value.
   * @return result The return value of the ERC20 call, returning true for non-standard tokens
   */
  function safeTransferFrom(
    address _tokenAddress,
    address _to,
    uint256 _amount
  ) internal returns (bool result) {
    /* solium-disable security/no-inline-assembly */
    // check if the address is a contract
    assembly {
      if iszero(extcodesize(_tokenAddress)) {
        revert(0, 0)
      }
    }

    // solium-disable-next-line security/no-low-level-calls
    (bool success, ) = _tokenAddress.call(
      abi.encodeWithSignature('transferFrom(address,address,uint256)', msg.sender, _to, _amount)
    );

    assembly {
      switch returndatasize()
      case 0 {
        // Not a standard erc20
        result := 1
      }
      case 32 {
        // Standard erc20
        returndatacopy(0, 0, 32)
        result := mload(0)
      }
      default {
        // Anything else, should revert for safety
        revert(0, 0)
      }
    }

    require(success, 'transferFrom() has been reverted');

    /* solium-enable security/no-inline-assembly */
    return result;
  }

  /*
   * Admin functions to edit the proxies address and fees
   */

  /**
   * @notice Fees added when using Erc20/Native batch functions
   * @param _batchFee Between 0 and 200, i.e: batchFee = 30 represent 0.30% of fee
   */
  function setBatchFee(uint16 _batchFee) external onlyOwner {
    // safety to avoid wrong setting
    require(_batchFee <= 200, 'The batch fee value is too high: > 2%');
    batchFee = _batchFee;
  }

  /**
   * @param _paymentErc20Proxy The address to the Erc20 fee payment proxy to use.
   */
  function setPaymentErc20Proxy(address _paymentErc20Proxy) external onlyOwner {
    paymentErc20Proxy = IERC20FeeProxy(_paymentErc20Proxy);
  }

  /**
   * @param _paymentNativeProxy The address to the Native fee payment proxy to use.
   */
  function setPaymentNativeProxy(address _paymentNativeProxy) external onlyOwner {
    paymentNativeProxy = IEthereumFeeProxy(_paymentNativeProxy);
  }

  /**
   * @notice Update the conversion path contract used to fetch conversions.
   * @param _chainlinkConversionPath The address of the conversion path contract.
   */
  function setChainlinkConversionPath(address _chainlinkConversionPath) external onlyOwner {
    chainlinkConversionPath = ChainlinkConversionPath(_chainlinkConversionPath);
  }

  /**
   * This function define variables allowing to limit the fees:
   * NativeAddress, USDAddress, and pathsNativeToUSD.
   * @param _NativeAddress The address representing the Native currency.
   * @param _USDAddress The address representing the USD currency.
   */
  function setNativeAndUSDAddress(address _NativeAddress, address _USDAddress) external onlyOwner {
    NativeAddress = _NativeAddress;
    USDAddress = _USDAddress;
    pathsNativeToUSD = [[NativeAddress, USDAddress]];
  }

  /**
   * @param _batchFeeAmountUSDLimit The limitation of the batch fee amount in USD, e.g:
   *                                batchFeeAmountUSDLimit = 150 * 1e8 represents $150
   */
  function setBatchFeeAmountUSDLimit(uint64 _batchFeeAmountUSDLimit) external onlyOwner {
    batchFeeAmountUSDLimit = _batchFeeAmountUSDLimit;
  }
}
