pragma solidity ^0.5.0;
//import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol";
import "./Ownable.sol";
import "./SafeERC20.sol" ;
import "./IUniswapV2Router02.sol";
import "./IERC20FeeProxy.sol";






/// @title uniswap routing to convert DAI > ETH > REQ route . 
contract UniswapRouting is Ownable{
using SafeERC20 for IERC20;  

address public constant UNISWAP_ROUTER_ADDRESS = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D ;

//  for the execution of the swap , the given router object needs to be paid via payment proxy.



  IUniswapV2Router02 public swapRouter;
  IERC20FeeProxy public paymentProxy;
 
    constructor(address  _swapRouterAddress , address _paymentProxyAddress)  public  {
           
           swapRouter = IUniswapV2Router02(_swapRouterAddress);
           paymentProxy = IERC20FeeProxy(_paymentProxyAddress);
        
    }


  modifier ensure(uint deadline) {
    require(deadline >= block.timestamp, "UniswapV2Router: EXPIRED");
    _;
  }
  
  function safeTransferFrom(
    IERC20  _token,
    address _from,
    address _to,
    uint256 _amount
  ) internal returns (bool result)
  {
    // solium-disable-next-line security/no-low-level-calls
    (bool success, bytes memory data) = address(_token).call(abi.encodeWithSignature(
      "transferFrom(address,address,uint256)",
      _from,
      _to,
      _amount
    ));

    return success && (data.length == 0 || abi.decode(data, (bool)));
  }

  
  
  
  
  
  
     function approveRouterToSpend(address _erc20Address , address _sender ) public {
    SafeERC20 erc20 = IERC20(_erc20Address);
    
    uint256 max = 2**256 - 1;
    
    erc20.safeApprove(address(swapRouter),address(_sender), max);
  }


  // Will fail if amountInMax < 2 * amountOut
  function swapTokensForExactTokens(
    uint amountOut,
    uint amountInMax,
    address[] calldata path,
    address to,
    uint deadline
  ) external ensure(deadline) returns (uint[] memory amounts) 
  {
    amounts = new uint[](2);
    amounts[0] = amountOut;
    amounts[1] = amountOut * 2;
    require(amounts[1] <= amountInMax, "UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");
    IERC20 paid = IERC20(path[0]);
    IERC20 swapped = IERC20(path[1]);
    require(swapped.balanceOf(address(this)) > amounts[0], "Test cannot proceed, lack of tokens in swap contract");
    paid.safeTransferFrom(msg.sender, address(this), amounts[1]);
    swapped.transfer(to, amounts[0]);
  }
   
   // @dev for transferring the event for swapped address.
    event TransferWithFee(
    address tokenAddress,
    address to,
    uint256 amount,
    uint256 feeAmount,
    address feeAddress
  );

 
    function transferForFee(
    address _tokenAddress,
    address _to,
    address _from,
    uint256 _amount,
    uint256 _feeAmount,
    address _feeAddress
    ) external
    {
    require(safeTransferFrom(_tokenAddress,_from,  _to, _amount), "payment transferFrom() failed");
    if (_feeAmount > 0 && _feeAddress != address(0)) {
      require(safeTransferFrom(_tokenAddress,_from ,  _feeAddress, _feeAmount), "fee transferFrom() failed");
    }
    emit TransferWithFee(
      _tokenAddress,
      _to,
      _amount,
      _feeAmount,
      _feeAddress
    );
  }
   
   
   function approvePaymentProxyToSpend(address _erc20Address) public {
    IERC20 erc20 = IERC20(_erc20Address);
    uint256 max = 2**256 - 1;
    erc20.safeApprove(address(paymentProxy), max);
  }
   
   //@title for  executing the  swap between the token before  burning the tokens 
   function swapTokens(
       address _to,
    uint256 _amount,      // requestedToken
    uint256 _amountInMax, // spentToken
    address[] calldata _path, // from requestedToken to spentToken
    uint256 _feeAmount,   // requestedToken
    address _feeAddress,
    uint256 _deadline
    ) external
    returns ( address _tokensescrow)
   
   { IERC20 spentToken = IERC20(_path[0]);
    IERC20 requestedToken = IERC20(_path[_path.length-1]);

    uint256 requestedTotalAmount = _amount + _feeAmount;

    require(spentToken.allowance(msg.sender, address(this)) > _amountInMax, "Insufficient allowance for payment .");
    require(spentToken.safeTransferFrom(msg.sender, address(this), _amountInMax), "Could not transfer payment token from swapper-payer");

    
    // Allow the router to spend all this contract's spentToken
    if (spentToken.allowance(address(this),address(swapRouter)) < _amountInMax) {
      approveRouterToSpend(requestedToken,address(spentToken));
    }
    
swapRouter.swapTokensForExactTokens(
      requestedTotalAmount,
      _amountInMax,
      _path,
      address(this),
      _deadline
    );

    // Allow the payment network to spend all this contract's requestedToken
    if (requestedToken.allowance(address(this),address(paymentProxy)) < requestedTotalAmount) {
      approvePaymentProxyToSpend(address(requestedToken));
    }


   
    // now  for sending back the status of the payment and  fee via an event .
    
    
    paymentProxy.transferForFee(
        address(requestedToken),
        _to,
        _amount,
        _feeAmount,
        _feeAddress
        );

 // if there is some amount left , pay back to the contract admin :
    if (spentToken.balanceOf(address(this)) > 0) {
      spentToken.safeTransfer(msg.sender, spentToken.balanceOf(address(this)));
    }
    if (requestedToken.balanceOf(address(this)) > 0) {
      requestedToken.safeTransfer(msg.sender, requestedToken.balanceOf(address(this)));
    }




       return (requestedToken);

       
   }
    




       
   
    // in case of diffrent version of  router , adapting to the new one . 
     function setPaymentProxy(address _paymentProxyAddress) public onlyOwner {
    paymentProxy = IERC20FeeProxy(_paymentProxyAddress);
  }

  function setRouter(address _newSwapRouterAddress) public onlyOwner {
    swapRouter = IUniswapV2Router02(_newSwapRouterAddress);
  }
   
   
   
    
}