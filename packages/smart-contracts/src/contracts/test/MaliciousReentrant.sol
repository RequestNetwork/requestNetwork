// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

interface IERC20CommerceEscrowWrapper {
  struct AuthParams {
    bytes8 paymentReference;
    address payer;
    address merchant;
    address operator;
    address token;
    uint256 amount;
    uint256 maxAmount;
    uint256 preApprovalExpiry;
    uint256 authorizationExpiry;
    uint256 refundExpiry;
    address tokenCollector;
    bytes collectorData;
  }

  struct ChargeParams {
    bytes8 paymentReference;
    address payer;
    address merchant;
    address operator;
    address token;
    uint256 amount;
    uint256 maxAmount;
    uint256 preApprovalExpiry;
    uint256 authorizationExpiry;
    uint256 refundExpiry;
    uint16 feeBps;
    address feeReceiver;
    address tokenCollector;
    bytes collectorData;
  }

  function authorizePayment(AuthParams calldata params) external;

  function capturePayment(
    bytes8 paymentReference,
    uint256 captureAmount,
    uint16 feeBps,
    address feeReceiver
  ) external;

  function voidPayment(bytes8 paymentReference) external;

  function chargePayment(ChargeParams calldata params) external;

  function reclaimPayment(bytes8 paymentReference) external;

  function refundPayment(
    bytes8 paymentReference,
    uint256 refundAmount,
    address tokenCollector,
    bytes calldata collectorData
  ) external;
}

/// @title MaliciousReentrant
/// @notice Malicious ERC20 token that attempts to reenter the ERC20CommerceEscrowWrapper
/// @dev Used for testing reentrancy protection
contract MaliciousReentrant is IERC20 {
  IERC20CommerceEscrowWrapper public target;
  address public underlyingToken;
  AttackType public attackType;
  bytes8 public attackPaymentRef;
  uint256 public attackAmount;
  uint16 public attackFeeBps;
  address public attackFeeReceiver;
  bool public attacking;
  IERC20CommerceEscrowWrapper.ChargeParams public attackChargeParams;
  IERC20CommerceEscrowWrapper.AuthParams public attackAuthParams;

  // ERC20 state
  mapping(address => uint256) private _balances;
  mapping(address => mapping(address => uint256)) private _allowances;
  uint256 private _totalSupply;

  enum AttackType {
    None,
    AuthorizeReentry,
    CaptureReentry,
    VoidReentry,
    ChargeReentry,
    ReclaimReentry,
    RefundReentry
  }

  event AttackAttempted(AttackType attackType, bool success);

  constructor(address _target, address _underlyingToken) {
    target = IERC20CommerceEscrowWrapper(_target);
    underlyingToken = _underlyingToken;
  }

  /// @notice Mint tokens to an address (for testing)
  function mint(address to, uint256 amount) external {
    _totalSupply += amount;
    _balances[to] += amount;
  }

  /// @notice Setup an attack to be executed during transfer/transferFrom
  function setupAttack(
    AttackType _attackType,
    bytes8 _paymentRef,
    uint256 _amount,
    uint16 _feeBps,
    address _feeReceiver
  ) external {
    attackType = _attackType;
    attackPaymentRef = _paymentRef;
    attackAmount = _amount;
    attackFeeBps = _feeBps;
    attackFeeReceiver = _feeReceiver;
  }

  /// @notice Setup a charge attack with full ChargeParams
  function setupChargeAttack(IERC20CommerceEscrowWrapper.ChargeParams calldata _chargeParams)
    external
  {
    attackType = AttackType.ChargeReentry;
    attackChargeParams = _chargeParams;
  }

  /// @notice Setup an authorize attack with full AuthParams
  function setupAuthorizeAttack(IERC20CommerceEscrowWrapper.AuthParams calldata _authParams)
    external
  {
    attackType = AttackType.AuthorizeReentry;
    attackAuthParams = _authParams;
  }

  /// @notice Execute the reentrancy attack
  function _executeAttack() internal {
    if (attacking) return; // Prevent infinite recursion
    attacking = true;

    bool success = false;

    if (attackType == AttackType.AuthorizeReentry) {
      try target.authorizePayment(attackAuthParams) {
        success = true;
      } catch {
        success = false;
      }
    } else if (attackType == AttackType.CaptureReentry) {
      try target.capturePayment(attackPaymentRef, attackAmount, attackFeeBps, attackFeeReceiver) {
        success = true;
      } catch {
        success = false;
      }
    } else if (attackType == AttackType.VoidReentry) {
      try target.voidPayment(attackPaymentRef) {
        success = true;
      } catch {
        success = false;
      }
    } else if (attackType == AttackType.ChargeReentry) {
      try target.chargePayment(attackChargeParams) {
        success = true;
      } catch {
        success = false;
      }
    } else if (attackType == AttackType.ReclaimReentry) {
      try target.reclaimPayment(attackPaymentRef) {
        success = true;
      } catch {
        success = false;
      }
    } else if (attackType == AttackType.RefundReentry) {
      try target.refundPayment(attackPaymentRef, attackAmount, address(0), '') {
        success = true;
      } catch {
        success = false;
      }
    }

    emit AttackAttempted(attackType, success);
    attacking = false;
  }

  // ERC20 functions that trigger reentrancy but also properly implement ERC20
  function transfer(address to, uint256 amount) external override returns (bool) {
    address from = msg.sender;
    require(_balances[from] >= amount, 'ERC20: insufficient balance');
    _executeAttack();
    _balances[from] -= amount;
    _balances[to] += amount;
    return true;
  }

  function transferFrom(
    address from,
    address to,
    uint256 amount
  ) external override returns (bool) {
    uint256 currentAllowance = _allowances[from][msg.sender];
    require(currentAllowance >= amount, 'ERC20: insufficient allowance');
    require(_balances[from] >= amount, 'ERC20: insufficient balance');
    _executeAttack();
    _allowances[from][msg.sender] = currentAllowance - amount;
    _balances[from] -= amount;
    _balances[to] += amount;
    return true;
  }

  function approve(address spender, uint256 amount) external override returns (bool) {
    address owner = msg.sender;
    // Execute attack before updating allowance (triggers reentrancy)
    _executeAttack();
    // Properly update allowance so SafeERC20 doesn't revert
    _allowances[owner][spender] = amount;
    return true;
  }

  // Proper ERC20 implementation
  function totalSupply() external view override returns (uint256) {
    return _totalSupply;
  }

  function balanceOf(address account) external view override returns (uint256) {
    return _balances[account];
  }

  function allowance(address owner, address spender) external view override returns (uint256) {
    return _allowances[owner][spender];
  }

  // Add other required functions with empty implementations
  function name() external pure returns (string memory) {
    return 'MaliciousToken';
  }

  function symbol() external pure returns (string memory) {
    return 'MAL';
  }

  function decimals() external pure returns (uint8) {
    return 18;
  }
}
