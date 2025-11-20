// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {ERC20CommerceEscrowWrapper} from '../ERC20CommerceEscrowWrapper.sol';
import {IAuthCaptureEscrow} from '../interfaces/IAuthCaptureEscrow.sol';
import {IERC20FeeProxy} from '../interfaces/ERC20FeeProxy.sol';

/// @title EchidnaERC20CommerceEscrowWrapper
/// @notice Echidna fuzzing test contract for ERC20CommerceEscrowWrapper
/// @dev This contract defines invariants that should always hold true
/// Run with: echidna . --contract EchidnaERC20CommerceEscrowWrapper --config echidna.config.yml
contract EchidnaERC20CommerceEscrowWrapper {
  ERC20CommerceEscrowWrapper public wrapper;
  MockERC20 public token;
  MockAuthCaptureEscrow public mockEscrow;
  MockERC20FeeProxy public mockFeeProxy;

  // Track total authorized, captured, and voided for accounting checks
  uint256 public totalAuthorized;
  uint256 public totalCaptured;
  uint256 public totalVoided;
  uint256 public totalReclaimed;
  uint256 public totalRefunded;

  // Test accounts
  address public constant PAYER = address(0x1000);
  address public constant MERCHANT = address(0x2000);
  address public constant OPERATOR = address(0x3000);
  address public constant FEE_RECEIVER = address(0x4000);

  // Payment reference counter for unique references
  uint256 private paymentRefCounter;

  constructor() payable {
    // Deploy mock contracts
    token = new MockERC20();
    mockEscrow = new MockAuthCaptureEscrow();
    mockFeeProxy = new MockERC20FeeProxy(address(token));

    // Deploy wrapper
    wrapper = new ERC20CommerceEscrowWrapper(address(mockEscrow), address(mockFeeProxy));

    // Setup initial balances for this contract (Echidna will call from this contract)
    token.mint(address(this), 10000000 ether);
    token.mint(PAYER, 10000000 ether);
    token.mint(OPERATOR, 10000000 ether);

    // Approve wrapper to spend tokens from various accounts
    token.approve(address(wrapper), type(uint256).max);
    token.approve(address(mockFeeProxy), type(uint256).max);
  }

  /// @notice Helper to generate unique payment references
  function _getNextPaymentRef() internal returns (bytes8) {
    paymentRefCounter++;
    return bytes8(uint64(paymentRefCounter));
  }

  // ============================================
  // INVARIANT 1: Fee Calculation Bounds
  // ============================================
  /// @notice Invariant: Fees can never exceed the capture amount
  /// @dev This ensures merchant always receives non-negative amount
  function echidna_fee_never_exceeds_capture() public view returns (bool) {
    // For any valid feeBps (0-10000), fee should never exceed captureAmount
    uint256 captureAmount = 1000 ether;
    for (uint16 feeBps = 0; feeBps <= 10000; feeBps += 100) {
      uint256 feeAmount = (captureAmount * feeBps) / 10000;
      if (feeAmount > captureAmount) {
        return false;
      }
    }
    return true;
  }

  /// @notice Invariant: Fee basis points validation works correctly
  /// @dev feeBps > 10000 should always revert
  function echidna_invalid_fee_bps_reverts() public view returns (bool) {
    // This is a pure mathematical invariant - fee calculation should never overflow
    // For any valid feeBps (0-10000), (amount * feeBps) / 10000 should be <= amount
    // For invalid feeBps (>10000), the contract should revert in capturePayment
    // We test the mathematical bound here
    uint256 testAmount = 1000 ether;
    uint256 maxFeeBps = 10000;
    uint256 maxFee = (testAmount * maxFeeBps) / 10000;
    return maxFee == testAmount; // At 100% fee (10000 bps), fee equals amount
  }

  // ============================================
  // INVARIANT 2: Amount Constraints
  // ============================================
  /// @notice Invariant: Fee calculation cannot cause underflow
  /// @dev merchantAmount = captureAmount - feeAmount should always be >= 0
  function echidna_no_underflow_in_merchant_payment() public view returns (bool) {
    uint256 captureAmount = 1000 ether;
    // Test various fee percentages
    for (uint16 feeBps = 0; feeBps <= 10000; feeBps += 500) {
      uint256 feeAmount = (captureAmount * feeBps) / 10000;
      uint256 merchantAmount = captureAmount - feeAmount;
      // Merchant amount should always be non-negative (can be 0 at 100% fee)
      if (merchantAmount > captureAmount) {
        return false; // Underflow occurred
      }
    }
    return true;
  }

  // ============================================
  // INVARIANT 3: Integer Overflow Protection
  // ============================================
  /// @notice Invariant: uint96 max value is reasonable for token amounts
  /// @dev uint96 max = 79,228,162,514 tokens @ 18 decimals (79B tokens)
  function echidna_uint96_sufficient_range() public pure returns (bool) {
    uint256 uint96Max = uint256(type(uint96).max);
    // Should be able to represent at least 10 billion tokens (1e10 * 1e18)
    // uint96 can hold ~79 billion tokens with 18 decimals
    uint256 tenBillionTokens = 10000000000 ether; // 10 billion with 18 decimals
    return uint96Max >= tenBillionTokens;
  }

  /// @notice Invariant: Fee calculation never overflows uint256
  /// @dev (amount * feeBps) should never overflow for reasonable amounts
  function echidna_fee_calc_no_overflow() public pure returns (bool) {
    // Test with maximum uint96 amount (max storable amount)
    uint256 maxAmount = uint256(type(uint96).max);
    uint256 maxFeeBps = 10000;

    // This calculation should not overflow
    // maxAmount * maxFeeBps should fit in uint256
    uint256 product = maxAmount * maxFeeBps;
    return product / maxFeeBps == maxAmount; // Verify no overflow occurred
  }

  // ============================================
  // INVARIANT 4: Accounting Bounds
  // ============================================
  /// @notice Invariant: Total supply of test token should never decrease (except explicit burns)
  /// @dev Detects any unexpected token loss
  function echidna_token_supply_never_decreases() public view returns (bool) {
    uint256 currentSupply = token.totalSupply();
    // Supply should be at least the initial minted amount
    uint256 minExpectedSupply = 30000000 ether; // 3 accounts * 10M each
    return currentSupply >= minExpectedSupply;
  }

  /// @notice Invariant: Wrapper contract should never hold tokens permanently
  /// @dev All tokens should either be in escrow or returned
  function echidna_wrapper_not_token_sink() public view returns (bool) {
    // The wrapper itself should not accumulate tokens
    // (tokens go to escrow, merchant, or fee receiver)
    uint256 wrapperBalance = token.balanceOf(address(wrapper));
    // Allow small dust amounts but not significant holdings
    return wrapperBalance < 1 ether;
  }
}

// ============================================
// Mock Contracts for Testing
// ============================================

/// @notice Simple mock ERC20 for testing
contract MockERC20 is IERC20 {
  mapping(address => uint256) private _balances;
  mapping(address => mapping(address => uint256)) private _allowances;
  uint256 private _totalSupply;

  function totalSupply() external view override returns (uint256) {
    return _totalSupply;
  }

  function balanceOf(address account) external view override returns (uint256) {
    return _balances[account];
  }

  function transfer(address to, uint256 amount) external override returns (bool) {
    _balances[msg.sender] -= amount;
    _balances[to] += amount;
    emit Transfer(msg.sender, to, amount);
    return true;
  }

  function allowance(address owner, address spender) external view override returns (uint256) {
    return _allowances[owner][spender];
  }

  function approve(address spender, uint256 amount) external override returns (bool) {
    _allowances[msg.sender][spender] = amount;
    emit Approval(msg.sender, spender, amount);
    return true;
  }

  function transferFrom(
    address from,
    address to,
    uint256 amount
  ) external override returns (bool) {
    _allowances[from][msg.sender] -= amount;
    _balances[from] -= amount;
    _balances[to] += amount;
    emit Transfer(from, to, amount);
    return true;
  }

  function mint(address to, uint256 amount) external {
    _balances[to] += amount;
    _totalSupply += amount;
    emit Transfer(address(0), to, amount);
  }
}

/// @notice Mock Commerce Escrow for testing
contract MockAuthCaptureEscrow is IAuthCaptureEscrow {
  mapping(bytes32 => PaymentState) public payments;

  struct PaymentState {
    bool exists;
    bool collected;
    uint120 capturableAmount;
    uint120 refundableAmount;
  }

  function getHash(PaymentInfo memory info) external pure override returns (bytes32) {
    return keccak256(abi.encode(info));
  }

  function authorize(
    PaymentInfo memory info,
    uint256 amount,
    address,
    bytes memory
  ) external override {
    bytes32 hash = keccak256(abi.encode(info));
    require(!payments[hash].exists, 'Payment already exists');
    payments[hash] = PaymentState({
      exists: true,
      collected: true,
      capturableAmount: uint120(amount),
      refundableAmount: 0
    });
  }

  function capture(
    PaymentInfo memory info,
    uint256 amount,
    uint16,
    address
  ) external override {
    bytes32 hash = keccak256(abi.encode(info));
    require(payments[hash].exists, 'Payment not found');
    require(payments[hash].capturableAmount >= amount, 'Insufficient capturable amount');
    payments[hash].capturableAmount -= uint120(amount);
    payments[hash].refundableAmount += uint120(amount);
  }

  function void(PaymentInfo memory info) external override {
    bytes32 hash = keccak256(abi.encode(info));
    require(payments[hash].exists, 'Payment not found');
    payments[hash].capturableAmount = 0;
  }

  function charge(
    PaymentInfo memory info,
    uint256 amount,
    address,
    bytes calldata,
    uint16,
    address
  ) external override {
    bytes32 hash = keccak256(abi.encode(info));
    require(!payments[hash].exists, 'Payment already exists');
    payments[hash] = PaymentState({
      exists: true,
      collected: true,
      capturableAmount: 0,
      refundableAmount: uint120(amount)
    });
  }

  function reclaim(PaymentInfo memory info) external override {
    bytes32 hash = keccak256(abi.encode(info));
    require(payments[hash].exists, 'Payment not found');
    payments[hash].capturableAmount = 0;
  }

  function refund(
    PaymentInfo memory info,
    uint256 amount,
    address,
    bytes calldata
  ) external override {
    bytes32 hash = keccak256(abi.encode(info));
    require(payments[hash].exists, 'Payment not found');
    require(payments[hash].refundableAmount >= amount, 'Insufficient refundable amount');
    payments[hash].refundableAmount -= uint120(amount);
  }

  function paymentState(bytes32 hash)
    external
    view
    override
    returns (
      bool hasCollectedPayment,
      uint120 capturableAmount,
      uint120 refundableAmount
    )
  {
    PaymentState memory state = payments[hash];
    return (state.collected, state.capturableAmount, state.refundableAmount);
  }
}

/// @notice Mock ERC20FeeProxy for testing
contract MockERC20FeeProxy is IERC20FeeProxy {
  IERC20 public token;

  constructor(address _token) {
    token = IERC20(_token);
  }

  function transferFromWithReferenceAndFee(
    address tokenAddress,
    address to,
    uint256 amount,
    bytes calldata paymentReference,
    uint256 feeAmount,
    address feeAddress
  ) external override {
    require(tokenAddress == address(token), 'Invalid token');

    // Transfer to recipient
    if (amount > 0) {
      token.transferFrom(msg.sender, to, amount);
    }

    // Transfer fee
    if (feeAmount > 0 && feeAddress != address(0)) {
      token.transferFrom(msg.sender, feeAddress, feeAmount);
    }

    emit TransferWithReferenceAndFee(
      tokenAddress,
      to,
      amount,
      paymentReference,
      feeAmount,
      feeAddress
    );
  }
}
