pragma solidity ^0.6.0;


import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/contracts/token/ERC20/ERC20.sol";
import "https://github.com/smartcontractkit/chainlink/evm-contracts/src/v0.6/interfaces/AggregatorInterface.sol";


/**
 * @title ERC20Proxy
 * @notice This contract performs an ERC20 token transfer and stores a reference
  */
contract ProxyChangeBTCEUR {
  // Event to declare a transfer with a reference
  event TransferWithReference(
    address tokenAddress,
    address to,
    uint256 amount,
    bytes indexed paymentReference
  );

  /**
  * @notice Performs a ERC20 token transfer with a reference
  * @param _to Transfer recipient
  * @param _amountEUR Value in EUR of the expected transfer
  * @param _paymentReference Reference of the payment related
  * 
  * Ropsten EUR USD https://ropsten.etherscan.io/address/0xe95feDE497d0c02a2DBc8e20C5E8bFFE9339F03a#readContract
  * Ropsten BTC USD https://ropsten.etherscan.io/address/0x882906a758207FeA9F21e0bb7d2f24E561bd0981#readContract
  */
  function transferDAIFromChangeUSDWithReference(
    address _to,
    uint256 _amountEUR,
    bytes calldata _paymentReference
  )
    external 
  {
    // Actually DAYY
    ERC20 btc = ERC20(0xBeBFb6B3EC82402591c802B63e2f20D56F99e7a3);
    // Price of 1 EUR in USD (10^8)
    AggregatorInterface priceFeedEUR = AggregatorInterface(0xe95feDE497d0c02a2DBc8e20C5E8bFFE9339F03a);
    // Price of 1 BTC in USD (10^8)
    AggregatorInterface priceFeedBTC = AggregatorInterface(0x882906a758207FeA9F21e0bb7d2f24E561bd0981);
    
    uint256 amount = uint256(priceFeedEUR.latestAnswer()) * _amountEUR;
    amount = amount / uint256(priceFeedBTC.latestAnswer());
    
    //erc20.transferFrom(msg.sender, _to, amount);
    //require(btc.allowance(address(this), msg.sender) > amount, "allowance needed for the token transfer");
    require(btc.transferFrom(msg.sender, _to, amount), "transferFrom() failed");
    emit TransferWithReference(
        address(btc),
        _to,
        amount,
        _paymentReference
    );
  }
}
