// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {ERC20Burnable} from '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

interface IRequestFeeBurnerReentry {
  function burnHeldReq() external;

  function wrapNative() external;

  function swapAndBurn(
    address[] calldata path,
    uint256 amountIn,
    uint256 minReqOut,
    uint256 deadline
  ) external returns (uint256);
}

/// @notice REQ-like token with `burn(uint256)` that reduces total supply.
contract MockBurnableReq is ERC20Burnable {
  constructor(uint256 initialSupply) ERC20('Request', 'REQ') {
    _mint(msg.sender, initialSupply);
  }
}

/// @notice REQ-like token without a burn function (e.g. a bridged REQ).
contract MockNonBurnableReq is ERC20 {
  constructor(uint256 initialSupply) ERC20('Bridged Request', 'REQ') {
    _mint(msg.sender, initialSupply);
  }
}

/// @notice USDT-like token: no return values and approve requires a zero allowance first.
contract MockUsdtStrictApprove {
  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;
  uint256 public totalSupply;

  constructor(uint256 initialSupply) {
    balanceOf[msg.sender] = initialSupply;
    totalSupply = initialSupply;
  }

  function decimals() external pure returns (uint8) {
    return 6;
  }

  function transfer(address to, uint256 amount) external {
    _transfer(msg.sender, to, amount);
  }

  function approve(address spender, uint256 amount) external {
    require(amount == 0 || allowance[msg.sender][spender] == 0, 'USDT: approve non-zero');
    allowance[msg.sender][spender] = amount;
  }

  function transferFrom(
    address from,
    address to,
    uint256 amount
  ) external {
    uint256 current = allowance[from][msg.sender];
    require(current >= amount, 'USDT: allowance');
    allowance[from][msg.sender] = current - amount;
    _transfer(from, to, amount);
  }

  function _transfer(
    address from,
    address to,
    uint256 amount
  ) private {
    require(balanceOf[from] >= amount, 'USDT: balance');
    balanceOf[from] -= amount;
    balanceOf[to] += amount;
  }
}

/// @notice Minimal WETH.
contract MockWrappedNative is ERC20 {
  constructor() ERC20('Wrapped Ether', 'WETH') {}

  function deposit() external payable {
    _mint(msg.sender, msg.value);
  }
}

/**
 * @notice Uniswap V2-style router with a fixed rate. Pulls `amountIn` of path[0] and sends
 *         `amountIn * rateNumerator / rateDenominator` of path[last] from its own liquidity.
 * @dev `shortchange` makes it send half of what it reports, to test output verification.
 */
contract MockSwapRouterExactIn {
  uint256 public rateNumerator = 1;
  uint256 public rateDenominator = 1;
  bool public shortchange;

  function setRate(uint256 numerator, uint256 denominator) external {
    rateNumerator = numerator;
    rateDenominator = denominator;
  }

  function setShortchange(bool value) external {
    shortchange = value;
  }

  function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external returns (uint256[] memory amounts) {
    require(deadline >= block.timestamp, 'UniswapV2Router: EXPIRED');
    uint256 amountOut = (amountIn * rateNumerator) / rateDenominator;
    require(amountOut >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');

    _pull(path[0], msg.sender, amountIn);
    IERC20(path[path.length - 1]).transfer(to, shortchange ? amountOut / 2 : amountOut);

    amounts = new uint256[](path.length);
    amounts[0] = amountIn;
    amounts[path.length - 1] = amountOut;
  }

  function _pull(
    address token,
    address from,
    uint256 amount
  ) private {
    // Low-level call to support tokens without return values.
    (bool ok, bytes memory data) = token.call(
      abi.encodeWithSignature('transferFrom(address,address,uint256)', from, address(this), amount)
    );
    require(ok && (data.length == 0 || abi.decode(data, (bool))), 'Router: pull failed');
  }
}

/// @notice Router that tries to re-enter the burner during a swap.
contract MockReentrantRouter {
  enum Target {
    BurnHeldReq,
    WrapNative,
    SwapAndBurn
  }

  Target public target;

  function setTarget(Target _target) external {
    target = _target;
  }

  function swapExactTokensForTokens(
    uint256,
    uint256,
    address[] calldata path,
    address,
    uint256
  ) external returns (uint256[] memory amounts) {
    IRequestFeeBurnerReentry burner = IRequestFeeBurnerReentry(msg.sender);
    if (target == Target.BurnHeldReq) {
      burner.burnHeldReq();
    } else if (target == Target.WrapNative) {
      burner.wrapNative();
    } else {
      burner.swapAndBurn(path, 1, 1, block.timestamp);
    }
    amounts = new uint256[](path.length);
  }
}

/// @notice Router that keeps the allowance unused and leaves it behind, to test allowance reset.
contract MockAllowanceCheckingRouter {
  IERC20 public lastToken;

  function swapExactTokensForTokens(
    uint256 amountIn,
    uint256,
    address[] calldata path,
    address to,
    uint256
  ) external returns (uint256[] memory amounts) {
    lastToken = IERC20(path[0]);
    // Pull only half, so a dangling allowance would remain without a reset.
    lastToken.transferFrom(msg.sender, address(this), amountIn / 2);
    IERC20(path[path.length - 1]).transfer(to, amountIn);
    amounts = new uint256[](path.length);
  }
}
