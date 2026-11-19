// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {Ownable2Step} from '@openzeppelin/contracts/access/Ownable2Step.sol';
import {ReentrancyGuard} from '@openzeppelin/contracts/security/ReentrancyGuard.sol';

/// @notice Exact-input swap entrypoint shared by Uniswap V2 routers and their forks.
interface IUniswapV2RouterExactIn {
  function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external returns (uint256[] memory amounts);
}

/// @notice REQ on Ethereum mainnet exposes `burn(uint256)`, which reduces `totalSupply`.
interface IBurnableERC20 {
  function burn(uint256 value) external;
}

/// @notice Minimal wrapped-native-token interface (WETH, WXDAI, WMATIC...).
interface IWrappedNative {
  function deposit() external payable;
}

/**
 * @title RequestFeeBurner
 * @notice Fee recipient that can only ever turn the fees it receives into burned REQ.
 *
 * Set this contract as the `_feeAddress` of ERC20FeeProxy / EthereumFeeProxy payments.
 * Fees accumulate here and are periodically swapped into REQ and burned in the same transaction.
 *
 * Security model:
 * - There is NO withdraw, rescue, or sweep function. Collected fees can only leave this contract
 *   through a swap whose entire REQ output is burned.
 * - REQ token, swap router, wrapped native token and burn mode are immutable. Changing them
 *   requires deploying a new burner and pointing the fee address to it.
 * - Swaps are restricted to keepers (managed by the owner) because a permissionless swap with a
 *   caller-chosen minimum output could be sandwiched. Keepers must supply a non-zero minimum
 *   output, which this contract enforces independently of the router.
 * - The owner can only add or remove keepers. Ownership cannot be renounced, so keepers can
 *   always be rotated.
 * - Burning REQ already held by the contract is permissionless: anyone can trigger it.
 */
contract RequestFeeBurner is Ownable2Step, ReentrancyGuard {
  using SafeERC20 for IERC20;

  /// @notice Destination used when the REQ token on this chain has no `burn` function.
  address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

  /// @notice REQ token burned by this contract.
  IERC20 public immutable reqToken;

  /// @notice Uniswap V2-compatible router used to swap fees into REQ.
  IUniswapV2RouterExactIn public immutable swapRouter;

  /// @notice Wrapped native token used to swap native fees. Zero disables native fees.
  address public immutable wrappedNativeToken;

  /// @notice True to call `reqToken.burn`, false to send REQ to `DEAD_ADDRESS`.
  bool public immutable useBurnFunction;

  /// @notice Accounts allowed to swap fees into REQ.
  mapping(address => bool) public isKeeper;

  /// @notice Total REQ burned by this contract.
  uint256 public totalReqBurned;

  event KeeperUpdated(address indexed keeper, bool enabled);
  event FeesSwappedForReq(address indexed tokenIn, uint256 amountIn, uint256 reqReceived);
  event ReqBurned(uint256 amount, uint256 totalReqBurned);
  event NativeWrapped(uint256 amount);

  error ZeroAddress();
  error NotKeeper(address caller);
  error InvalidPath();
  error ZeroAmount();
  error ZeroMinimumOutput();
  error DeadlineExpired();
  error InsufficientFeeBalance(uint256 requested, uint256 available);
  error InsufficientReqReceived(uint256 received, uint256 minimum);
  error NothingToBurn();
  error NativeFeesDisabled();
  error RenounceOwnershipDisabled();

  modifier onlyKeeper() {
    if (!isKeeper[msg.sender]) revert NotKeeper(msg.sender);
    _;
  }

  /**
   * @param _reqToken REQ token on this chain.
   * @param _swapRouter Uniswap V2-compatible router.
   * @param _wrappedNativeToken Wrapped native token, or address(0) to refuse native fees.
   * @param _useBurnFunction True when `_reqToken` supports `burn(uint256)`.
   * @param _initialOwner Owner managing keepers (passed explicitly to support CREATE2 deployments).
   */
  constructor(
    address _reqToken,
    address _swapRouter,
    address _wrappedNativeToken,
    bool _useBurnFunction,
    address _initialOwner
  ) {
    if (_reqToken == address(0) || _swapRouter == address(0) || _initialOwner == address(0)) {
      revert ZeroAddress();
    }
    reqToken = IERC20(_reqToken);
    swapRouter = IUniswapV2RouterExactIn(_swapRouter);
    wrappedNativeToken = _wrappedNativeToken;
    useBurnFunction = _useBurnFunction;
    _transferOwnership(_initialOwner);
  }

  /// @notice Accepts native fees (EthereumFeeProxy forwards them with a 2300 gas stipend).
  receive() external payable {
    if (wrappedNativeToken == address(0)) revert NativeFeesDisabled();
  }

  /**
   * @notice Adds or removes a keeper.
   * @param _keeper Keeper address.
   * @param _enabled True to grant, false to revoke.
   */
  function setKeeper(address _keeper, bool _enabled) external onlyOwner {
    if (_keeper == address(0)) revert ZeroAddress();
    isKeeper[_keeper] = _enabled;
    emit KeeperUpdated(_keeper, _enabled);
  }

  /// @notice Disabled so that keepers can always be managed.
  function renounceOwnership() public view override onlyOwner {
    revert RenounceOwnershipDisabled();
  }

  /**
   * @notice Wraps all native fees held by this contract so they can be swapped. Permissionless.
   */
  function wrapNative() external nonReentrant {
    if (wrappedNativeToken == address(0)) revert NativeFeesDisabled();
    uint256 amount = address(this).balance;
    if (amount == 0) revert ZeroAmount();
    IWrappedNative(wrappedNativeToken).deposit{value: amount}();
    emit NativeWrapped(amount);
  }

  /**
   * @notice Swaps collected fees into REQ, then burns all REQ held by this contract.
   * @dev Submit through a private mempool to avoid sandwiching; `_minReqOut` is the real guard.
   * @param _path Swap path. First element is the fee token, last element must be REQ.
   * @param _amountIn Amount of fee token to swap.
   * @param _minReqOut Minimum REQ to receive. Must be non-zero.
   * @param _deadline Timestamp after which the swap reverts.
   * @return reqReceived REQ received from the swap.
   */
  function swapAndBurn(
    address[] calldata _path,
    uint256 _amountIn,
    uint256 _minReqOut,
    uint256 _deadline
  ) external onlyKeeper nonReentrant returns (uint256 reqReceived) {
    uint256 pathLength = _path.length;
    if (
      pathLength < 2 ||
      _path[pathLength - 1] != address(reqToken) ||
      _path[0] == address(reqToken)
    ) {
      revert InvalidPath();
    }
    if (_amountIn == 0) revert ZeroAmount();
    if (_minReqOut == 0) revert ZeroMinimumOutput();
    // solhint-disable-next-line not-rely-on-time
    if (_deadline < block.timestamp) revert DeadlineExpired();

    IERC20 tokenIn = IERC20(_path[0]);
    uint256 available = tokenIn.balanceOf(address(this));
    if (_amountIn > available) revert InsufficientFeeBalance(_amountIn, available);

    uint256 reqBefore = reqToken.balanceOf(address(this));

    // Exact allowance for this swap only, reset afterwards (forceApprove handles USDT-style tokens).
    tokenIn.forceApprove(address(swapRouter), _amountIn);
    swapRouter.swapExactTokensForTokens(_amountIn, _minReqOut, _path, address(this), _deadline);
    tokenIn.forceApprove(address(swapRouter), 0);

    // Do not trust the router's return value: measure what actually arrived.
    reqReceived = reqToken.balanceOf(address(this)) - reqBefore;
    if (reqReceived < _minReqOut) revert InsufficientReqReceived(reqReceived, _minReqOut);

    emit FeesSwappedForReq(address(tokenIn), _amountIn, reqReceived);

    _burnAllReq();
  }

  /**
   * @notice Burns all REQ held by this contract (e.g. fees paid directly in REQ). Permissionless.
   */
  function burnHeldReq() external nonReentrant {
    _burnAllReq();
  }

  function _burnAllReq() private {
    uint256 amount = reqToken.balanceOf(address(this));
    if (amount == 0) revert NothingToBurn();

    totalReqBurned += amount;

    if (useBurnFunction) {
      IBurnableERC20(address(reqToken)).burn(amount);
    } else {
      reqToken.safeTransfer(DEAD_ADDRESS, amount);
    }

    emit ReqBurned(amount, totalReqBurned);
  }
}
