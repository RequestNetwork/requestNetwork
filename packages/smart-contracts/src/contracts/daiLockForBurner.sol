// SPDX-License-Identifier: MIT
///@title daiLockForBurner  transfers the  given amount of xdai send by the wallet / feeCollector  to the burner using the bridge contract  to send to the burner on ETH mainnet
///@notice it doesnt have the possiblity to withdraw, and once transaction is done , it cant be reverted  .
pragma solidity ^0.5.0;


///@dev it defines the  function  of the bridge contract  used to have proxy transfer  destined to given _receiver address.
interface IHomeBridgeErcToNative {
    function relayTokens(address _receiver) external payable;
}
contract lockForREQBurn {

    address public constant ETHEREUM_BURNER_CONTRACT = 0x6D66c298a977B68c9f40FF13e0d7A64C598E5d5A; 
    address public constant BRIDGE_CONTRACT = 0x7301CFA0e1756B71869E93d4e4Dca5c7d0eb0AA6; 
    /// @dev its the owner of the wallet 
    address payable internal owner;
    
    constructor() public {
        owner = payable(msg.sender);
    }
    /// @dev calling function from the Bridge contract , to transfer all the amount present in the contract to the given address 
    function drainLockedToBurner() external {
        IHomeBridgeErcToNative bridge = IHomeBridgeErcToNative(BRIDGE_CONTRACT);
        bridge.relayTokens{value: address(this).balance}(ETHEREUM_BURNER_CONTRACT);
    }
   
    
    receive() external payable {
    }
}