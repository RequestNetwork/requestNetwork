pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


/**
 * @title ERC20Proxy
 * @notice This contract performs an ERC20 token transfer and stores a reference
  */
contract ERC20Proxy {
  // Event to declare a transfer with a reference
  event TransferWithReference(
    address tokenAddress,
    address to,
    uint256 amount,
    bytes indexed paymentReference
  );

  // Fallback function returns funds to the sender
  function()
    external
    payable
  {
    revert("not payable fallback");
  }

  /**
  * @notice Performs a ERC20 token transfer with a reference
  * @param _tokenAddress Address of the ERC20 token smart contract
  * @param _to Transfer recipient
  * @param _amount Amount to transfer
  * @param _paymentReference Reference of the payment related
  */
  function transferFromWithReference(
    address _tokenAddress,
    address _to,
    uint256 _amount,
    bytes calldata _paymentReference
  )
    external 
  {
    ERC20 erc20 = ERC20(_tokenAddress);
    require(erc20.transferFrom(msg.sender, _to, _amount), "transferFrom() failed");
    emit TransferWithReference(
      _tokenAddress,
      _to,
      _amount,
      _paymentReference
    );
  }
}
