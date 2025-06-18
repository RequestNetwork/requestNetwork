// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/cryptography/EIP712.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import './interfaces/ERC20FeeProxy.sol';
import './lib/SafeERC20.sol';

/**
 * @title ERC20RecurringPaymentProxy
 * @notice Executes recurring ERC20 payments.
 */
contract ERC20RecurringPaymentProxy is EIP712, AccessControl, Pausable, ReentrancyGuard {
  using SafeERC20 for IERC20;
  using ECDSA for bytes32;

  error ERC20RecurringPaymentProxy__BadSignature();
  error ERC20RecurringPaymentProxy__SignatureExpired();
  error ERC20RecurringPaymentProxy__IndexTooLarge();
  error ERC20RecurringPaymentProxy__ExecutionOutOfOrder();
  error ERC20RecurringPaymentProxy__IndexOutOfBounds();
  error ERC20RecurringPaymentProxy__NotDueYet();
  error ERC20RecurringPaymentProxy__AlreadyPaid();
  error ERC20RecurringPaymentProxy__ZeroAddress();

  bytes32 public constant EXECUTOR_ROLE = keccak256('EXECUTOR_ROLE');

  /* keccak256 of the typed-data struct with gasFee field */
  bytes32 private constant _PERMIT_TYPEHASH =
    keccak256(
      'SchedulePermit(address subscriber,address token,address recipient,'
      'address feeAddress,uint128 amount,uint128 feeAmount,uint128 gasFee,'
      'uint32 periodSeconds,uint32 firstExec,uint8 totalExecutions,'
      'uint256 nonce,uint256 deadline)'
    );

  /* replay defence */
  mapping(bytes32 => uint256) public executedBitmap;
  mapping(bytes32 => uint8) public lastExecutionIndex;

  IERC20FeeProxy public erc20FeeProxy;

  struct SchedulePermit {
    address subscriber;
    address token;
    address recipient;
    address feeAddress;
    uint128 amount;
    uint128 feeAmount;
    uint128 gasFee;
    uint32 periodSeconds;
    uint32 firstExec;
    uint8 totalExecutions;
    uint256 nonce;
    uint256 deadline;
  }

  constructor(
    address adminSafe,
    address executorEOA,
    address erc20FeeProxyAddress
  ) EIP712('ERC20RecurringPaymentProxy', '1') {
    _grantRole(DEFAULT_ADMIN_ROLE, adminSafe);
    _grantRole(EXECUTOR_ROLE, executorEOA);
    erc20FeeProxy = IERC20FeeProxy(erc20FeeProxyAddress);
  }

  function _hashSchedule(SchedulePermit calldata p) private view returns (bytes32) {
    SchedulePermit memory m = p;

    bytes32 structHash = keccak256(abi.encode(_PERMIT_TYPEHASH, m));

    return _hashTypedDataV4(structHash);
  }

  function _proxyTransfer(SchedulePermit calldata p, bytes calldata paymentReference) private {
    erc20FeeProxy.transferFromWithReferenceAndFee(
      p.token,
      p.recipient,
      p.amount,
      paymentReference,
      p.feeAmount,
      p.feeAddress
    );
  }

  function execute(
    SchedulePermit calldata p,
    bytes calldata signature,
    uint8 index,
    bytes calldata paymentReference
  ) external whenNotPaused onlyRole(EXECUTOR_ROLE) nonReentrant {
    bytes32 digest = _hashSchedule(p);

    if (digest.recover(signature) != p.subscriber)
      revert ERC20RecurringPaymentProxy__BadSignature();
    if (block.timestamp > p.deadline) revert ERC20RecurringPaymentProxy__SignatureExpired();

    if (index >= 256) revert ERC20RecurringPaymentProxy__IndexTooLarge();
    if (index != lastExecutionIndex[digest] + 1)
      revert ERC20RecurringPaymentProxy__ExecutionOutOfOrder();
    lastExecutionIndex[digest] = index;

    if (index > p.totalExecutions) revert ERC20RecurringPaymentProxy__IndexOutOfBounds();

    uint256 execTime = uint256(p.firstExec) + uint256(index - 1) * p.periodSeconds;
    if (block.timestamp < execTime) revert ERC20RecurringPaymentProxy__NotDueYet();

    uint256 mask = 1 << index;
    uint256 word = executedBitmap[digest];
    if (word & mask != 0) revert ERC20RecurringPaymentProxy__AlreadyPaid();
    executedBitmap[digest] = word | mask;

    uint256 total = p.amount + p.feeAmount + p.gasFee;

    IERC20 token = IERC20(p.token);
    token.safeTransferFrom(p.subscriber, address(this), total);

    /* USDT-safe zero-approve then set allowance */
    token.safeApprove(address(erc20FeeProxy), 0);
    token.safeApprove(address(erc20FeeProxy), p.amount + p.feeAmount);

    _proxyTransfer(p, paymentReference);

    if (p.gasFee != 0) {
      token.safeTransfer(msg.sender, p.gasFee);
    }
  }

  function setExecutor(address oldExec, address newExec) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _revokeRole(EXECUTOR_ROLE, oldExec);
    _grantRole(EXECUTOR_ROLE, newExec);
  }

  function setFeeProxy(address newProxy) external onlyRole(DEFAULT_ADMIN_ROLE) {
    if (newProxy == address(0)) revert ERC20RecurringPaymentProxy__ZeroAddress();
    erc20FeeProxy = IERC20FeeProxy(newProxy);
  }

  function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
    _pause();
  }

  function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
    _unpause();
  }
}
