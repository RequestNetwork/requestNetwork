/**
 * v Deployed here: https://rinkeby.etherscan.io/address/0x35177580d2f12c94cb274ec762121f4f7dfd451e
 * (i) This version was deployed with an additional change refund in requested currency, being always 0 it is removed.
*/

pragma solidity ^0.5.12;

//import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IUniswapV2Router02 {
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

interface IFeePaymentNetwork {
  // Event to declare a transfer with a reference
  event TransferWithReferenceAndFee(
    address tokenAddress,
    address to,
    uint256 amount,
    bytes indexed paymentReference,
    uint256 feeAmount,
    address feeAddress
  );

  function transferFromWithReferenceAndFee(
    address _tokenAddress,
    address _to,
    uint256 _amount,
    bytes calldata _paymentReference,
    uint256 _feeAmount,
    address _feeAddress
    ) external;
}

/**
 * -- ADMIN --
 * 
 * 1/ Deploy:
 *    _uniswapRouterAddress: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
 *    _paymentProxyAddress: 0xda46309973bffddd5a10ce12c44d2ee266f45a44
 * 
 * 1/ This contract should allow the CTBK to be spent by the payment proxy
 * approvePaymentProxyToSpend(0x995d6a8c21f24be1dd04e105dd0d83758343e258)
 * 
 * 2/ This contract should allow the FAU to be spent by the Uniswap router
 * approveRouterToSpend(0xfab46e002bbf0b4509813474841e0716e6730136)
 * 
 * -- PAYER --
 * 
 * 1/ User should approve FAU to be spent by this contract
 * Go here https://rinkeby.etherscan.io/token/0xfab46e002bbf0b4509813474841e0716e6730136#writeContract / approve 100 FAU
 *    fau.approve(0x35177580d2f12c94cb274ec762121f4f7dfd451e, 100000000000000000000)
 * 
 * - Now start the actual payment -
 * 
 * EXEC swapTransferWithReference
 * _to: 0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3
 * _amount: 10000000000000000000 (10 FAU)
 * _amountInMax: 10300300000000000000 (10.3003 CTBK = 3% slippage of the total amount)
 * _path: [0x995d6a8c21f24be1dd04e105dd0d83758343e258, 0xfab46e002bbf0b4509813474841e0716e6730136]
 * _paymentReference: 0x202009030000
 * _feeAmount: 10000000000000000 (0.01 FAU = 0.1%)
 * _feeAddress: 0x61076Da38517be36d433E3fF8D6875B87880Ba56
 * _deadline: 1600136572 (15th of Sep)

/**
 * @title SwapToPay
 * @notice This contract swaps ERC20 tokens before paying a request thanks to a payment proxy
  */
contract SwapToPay {

  IUniswapV2Router02 public uniswapRouter;
  IFeePaymentNetwork public paymentProxy;
  address public admin;
  

  constructor(address _uniswapRouterAddress, address _paymentProxyAddress) public {
    uniswapRouter = IUniswapV2Router02(_uniswapRouterAddress);
    paymentProxy = IFeePaymentNetwork(_paymentProxyAddress);
    admin = msg.sender;
  }

  function approvePaymentProxyToSpend(address erc20Address) public {
    ERC20 erc20 = ERC20(erc20Address);
    uint256 max = 2**256 - 1;
    erc20.approve(address(paymentProxy), max);
  }
  
  function approveRouterToSpend(address erc20Address) public {
    ERC20 erc20 = ERC20(erc20Address);
    uint256 max = 2**256 - 1;
    erc20.approve(address(uniswapRouter), max);
  }
  
  /**
  * @notice Performs a token swap between a payment currency and a request currency, and then
  *         calls a payment proxy to pay the request, including fees.
  * @param _to Transfer recipient = request issuer
  * @param _amount Amount to transfer in request currency
  * @param _amountInMax Maximum amount allowed to spend for currency swap, in payment currency.
            This amount should take into account the fees.
    @param _path, path of ERC20 tokens to swap from requestedToken to spentToken. The first 
            address of the path should be the payment currency. The last element should be the
            request currency.
  * @param _paymentReference Reference of the payment related
  * @param _feeAmount Amount of the fee in request currency
  * @param _feeAddress Where to pay the fee
  * @param _deadline Deadline for the swap to be valid
  *
  * TODO test the behaviour when the deadline is passed
  */
  function swapTransferWithReference(
    address _to,
    uint256 _amount,      // requestedToken
    uint256 _amountInMax, // spentToken
    address[] calldata _path, // from requestedToken to spentToken
    bytes calldata _paymentReference,
    uint256 _feeAmount,   // requestedToken
    address _feeAddress,
    uint256 _deadline
  )
    external
  {
    ERC20 spentToken = ERC20(_path[0]);
    ERC20 requestedToken = ERC20(_path[_path.length-1]);
    
    uint256 requestedTotalAmount = _amount + _feeAmount;

    spentToken.transferFrom(msg.sender, address(this), _amountInMax);

    // Allow the router to spend all this contract's spentToken
    if (spentToken.allowance(address(this),address(uniswapRouter)) < _amountInMax) {
        approveRouterToSpend(address(spentToken));
    }
    
    // TODO? Add require
    uniswapRouter.swapTokensForExactTokens(
        requestedTotalAmount,
        _amountInMax,
        _path,
        address(this),
        _deadline
    );
    
    // Allow the payment network to spend all this contract's requestedToken
    //const pnAddress = 0xFb6819d605E1Fa377a932016274cC84c9A07322f;
    if (requestedToken.allowance(address(this),address(paymentProxy)) < requestedTotalAmount) {
        approvePaymentProxyToSpend(address(requestedToken));
    }
    
    // Pay the request and fees
    paymentProxy.transferFromWithReferenceAndFee(
        address(requestedToken),
        _to,
        _amount,
        _paymentReference,
        _feeAmount,
        _feeAddress
    );
    
    // Give the change back TODO check the other token
    spentToken.transfer(msg.sender, spentToken.balanceOf(address(this)));
  }
  

  /*
  * Admin functions to edit the admin, router address or proxy address
  */
  modifier onlyAdmin() {
      require(
          msg.sender == admin,
          "Only admin can do this action"
        );
        _;
  }
  
  function setPaymentProxy(address _paymentProxyAddress) public onlyAdmin {
    paymentProxy = IFeePaymentNetwork(_paymentProxyAddress);
  }
  
  function setRouter(address _newUniswapRouterAddress) public onlyAdmin {
    uniswapRouter = IUniswapV2Router02(_newUniswapRouterAddress);
  }
  
  function setAdmin(address _newAdmin) public onlyAdmin {
      admin = _newAdmin;
  }
}