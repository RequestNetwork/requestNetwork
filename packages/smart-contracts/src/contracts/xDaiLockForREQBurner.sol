// SPDX-License-Identifier: MIT

/// xDaiLockForREQBurner burn contract
/// @dev xDAI based contract for locking xDAI that are doomed to be sent to a REQ burner contract
/// @author Request Network
/// @notice  the author has followed  following process of transferring the xDAI tokens : https://www.xdaichain.com/for-users/bridges/converting-xdai-via-bridge/transfer-sai-dai-without-the-ui-using-web3-or-mobile-wallet
/// @notice also while investigation the working of the bridge contract needs at least 10xDAI to be transferred
pragma solidity ^0.6.12;

/// @dev using the interface of the native token bridge
interface IHomeBridgeErcToNative {
    function relayTokens(address _receiver) external payable;
}

/// @dev a contract locking xDAI for a future bridge to Ethereum-based REQ burning contract.
contract lockForREQBurn {
    // Contract locking Dai to be converted into REQ
    address public constant ETHEREUM_BURNER_CONTRACT = 0x000; /* TODO when the Dai based burner contract is deployed*/
    address public constant BRIDGE_CONTRACT = 0x7301CFA0e1756B71869E93d4e4Dca5c7d0eb0AA6;

    constructor() public {}

    /// @dev Sends all xDai locked on the contract to the Ethereum-based through the bridge contract
    /// @notice the same EOA needs to execute a mirror transaction on Ethereum
    /// @notice 1. Execute drainLockedXDaiToBurner
    /// @notice 2. Use 0x6A92e97A568f5F58590E8b1f56484e6268CdDC51 on xDai to get the parameters
    /// @notice 3. Use the parameters on this Ethereum-based contract: : 0x4aa42145aa6ebf72e164c9bbc74fbd3788045016
    function drainLockedXDaiToBurner() external {
        IHomeBridgeErcToNative bridge = IHomeBridgeErcToNative(BRIDGE_CONTRACT);
        bridge.relayTokens{value: address(this).balance}(ETHEREUM_BURNER_CONTRACT);
    }

    receive() external payable {}
}
