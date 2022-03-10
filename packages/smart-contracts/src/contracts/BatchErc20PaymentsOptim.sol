// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "./interfaces/ERC20FeeProxy.sol";
import "./ERC20FeeProxy.sol";

contract BatchErc20PaymentsOptim is ERC20FeeProxy {
    
    /// @notice Send a batch of erc20 payments with fees, to multiple accounts.
    /// @param _token The token to transact with. 
    /// @param _recipients Takes a list of accounts as input.
    /// @param _amounts Takes a list of amounts, corresponding to recipients[] as input.
    /// @dev Remember to give approval for this contract to spend user tokens.
    function batchOrphanERC20Payments(
        IERC20 _token, 
        address[] calldata _recipients, 
        uint256[] calldata _amounts
    ) external {
        for (uint256 i = 0; i < _recipients.length; i++)
            _token.transferFrom(msg.sender, _recipients[i], _amounts[i]);
    }
    
    /// @notice Send a batch of erc20 payments w/fees with paymentReferences to multiple accounts.
    /// @param _tokenAddress Token to transact with.
    /// @param _recipients List of recipients accounts as input.
    /// @param _amounts List of amounts, corresponding to recipients[] as input.
    /// @param _paymentReferences List of paymentRefs, corr. to the recipients[] and amounts[].
    /// @param _feeAmounts The amount of the payment fee.
    /// @param _feeAddress The fee recipient.
    /// @dev Uses ERC20FeeProxy.sol to pay an invoice and fees, with a payment reference.
    function batchERC20PaymentsWithReferenceAndFee(
        address _tokenAddress, 
        address[] calldata _recipients, 
        uint256[] calldata _amounts,
        bytes[] calldata _paymentReferences,
        uint256[] calldata _feeAmounts,
        address _feeAddress 
    ) external {
        for (uint256 i = 0; i < _recipients.length; i++) {
           transferFromWithReferenceAndFee(
                _tokenAddress,
                _recipients[i], 
                _amounts[i],
                _paymentReferences[i],
                _feeAmounts[i],
                _feeAddress
            );
        }
    }

    /// @notice Send a batch of erc20 payments MULTI TOKEN w/fees with paymentReferences to multiple accounts.
    /// @param _tokenAddresses List of tokens to transact with.
    /// @param _recipients List of recipients accounts as input.
    /// @param _amounts List of amounts, corresponding to recipients[] as input.
    /// @param _paymentReferences List of paymentRefs, corr. to the recipients[] and amounts[].
    /// @param _feeAmounts The amount of the payment fee.
    /// @param _feeAddress The fee recipient.
    /// @dev Uses ERC20FeeProxy.sol to pay an invoice and fees, with a payment reference.
    function batchERC20PaymentsMultiTokensWithReferenceAndFee(
        address[] calldata _tokenAddresses, 
        address[] calldata _recipients, 
        uint256[] calldata _amounts,
        bytes[] calldata _paymentReferences,
        uint256[] calldata _feeAmounts,
        address _feeAddress 
    ) external {
        for (uint256 i = 0; i < _recipients.length; i++) {
           transferFromWithReferenceAndFee(
                _tokenAddresses[i],
                _recipients[i], 
                _amounts[i],
                _paymentReferences[i],
                _feeAmounts[i],
                _feeAddress
            );
        }
    }
}