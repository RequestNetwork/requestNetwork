// SPDX-License-Identifier: MIT
/// lockForREQ burn contract 
///@dev xDAI based  contract for transfering xDAI tokens held by the EOA to transfer to mainnet based ETH-REQ contract 
///@author Yoann Marion , Request Network 
///@notice  the author has followed  following process of transferring the xDAI tokens : https://www.xdaichain.com/for-users/bridges/converting-xdai-via-bridge/transfer-sai-dai-without-the-ui-using-web3-or-mobile-wallet
/// @notice also while investigation the working of the bridge contract needs at least 10xDAI to be transferred
pragma solidity ^0.6.12;

///@dev using the interface of the  helper function that allows the initiation  of getting the validation of transfer for xDAI-DAI conversion
interface IHomeBridgeErcToNative {
    function relayTokens(address _receiver) external payable;
}


///@dev it consist of functions that send transaction to nativeMainnet contract  as well as verify transactions on bridge ,without having reliance on blockscout . 
contract lockForREQBurn {
    address public constant ETHEREUM_BURNER_CONTRACT = 0x6D66c298a977B68c9f40FF13e0d7A64C598E5d5A; 
    address public  BRIDGE_CONTRACT = 0x7301CFA0e1756B71869E93d4e4Dca5c7d0eb0AA6; 
   // insuring that the deployer has the rights to transfer the DAI's and can receive the transaction.
    address payable internal owner;
    constructor() public {
        owner = payable(msg.sender);
    }

    ///@dev uses  the helper contract function to have an proxyCall to the bridge , which afterwards delegates all the balance in xDAI to the bridge contract on the ethereum side 
    ///@notice still there needs to be  an wallet that will have to do manual process of paying the transaction request gas fees on the ethereum side 
    function drainLockedToBurner() external {
        IHomeBridgeErcToNative bridge = IHomeBridgeErcToNative(BRIDGE_CONTRACT);
        bridge.relayTokens{value: address(this).balance}(ETHEREUM_BURNER_CONTRACT);
    }
    
    ///@dev it returns the dai Funds locked by this contract for transfer , back to the owner , working as safety valve. 
    
    function wayOut() external {
        owner.transfer(address(this).balance);
    }
    ///@dev for getting the balance being held by the contract , so as to monitor the transaction directly onchain.

    function balance() view external returns(uint) {
        return address(this).balance;
    }
    receive() external payable {
    }
    /// @notice an optional function , can be useful in the case when xDAI current bridge might be changed
    ///@dev points to the helper contract of the xDAI bridge for transfer
    function setBridgeContract(address _newBridgeAddress) external {
        
        BRIDGE_CONTRACT = _newBridgeAddress;
        
    } 



}

