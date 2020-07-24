pragma solidity ^0.6.0;


import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/contracts/token/ERC20/ERC20.sol";
import "https://github.com/smartcontractkit/chainlink/evm-contracts/src/v0.6/interfaces/AggregatorInterface.sol";


/**
 * @title ERC20Proxy
 * @notice This contract performs an ERC20 token transfer and stores a reference
  */
contract ProxyChangeDAIEUR {
  // Event to declare a transfer with a reference
  event TransferWithReference(
    address tokenAddress,
    address to,
    uint256 amount,
    bytes indexed paymentReference
  );

    /**
     * Returns the latest price, on Ropsten
     * 
     */
    function getLatestPrice() public view returns (int256) {
        AggregatorInterface priceFeed = AggregatorInterface(0x8468b2bDCE073A157E560AA4D9CcF6dB1DB98507);
        return priceFeed.latestAnswer();
    }

  /**
  * @notice Performs a ERC20 token transfer with a reference
  * @param _to Transfer recipient
  * @param _amountEUR Value in EUR of the expected transfer
  * @param _paymentReference Reference of the payment related
  * 
  * Ropsten EUR USD https://ropsten.etherscan.io/address/0xe95feDE497d0c02a2DBc8e20C5E8bFFE9339F03a
  * Ropsten DAI USD https://ropsten.etherscan.io/address/0xec3cf275cAa57dD8aA5c52e9d5b70809Cb01D421
  */
  function transferDAIFromChangeEURWithReference(
    address _to,
    uint256 _amountEUR,
    bytes calldata _paymentReference
  )
    external 
  {
    // Actually DAYY
    ERC20 dai = ERC20(0xBeBFb6B3EC82402591c802B63e2f20D56F99e7a3);
    // Price of 1 EUR in USD (10^8)
    AggregatorInterface priceFeedEUR = AggregatorInterface(0xe95feDE497d0c02a2DBc8e20C5E8bFFE9339F03a);
    // Price of 1 DAI in USD (10^8)
    AggregatorInterface priceFeedDAI = AggregatorInterface(0xec3cf275cAa57dD8aA5c52e9d5b70809Cb01D421);
    
    uint256 amount = uint256(priceFeedEUR.latestAnswer()) * _amountEUR / uint256(priceFeedDAI.latestAnswer());
    
    //erc20.transferFrom(msg.sender, _to, amount);
    require(dai.allowance(msg.sender, address(this)) > amount, "allowance needed for the token transfer");
    require(dai.transferFrom(msg.sender, _to, amount), "transferFrom() failed");
    emit TransferWithReference(
        address(dai),
      _to,
      amount,
      _paymentReference
    );
  }
}
