// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';

/**
 * @title ERC20TransferableReceivable
 * @author Request Network
 * @dev ERC721 contract for creating and managing unique NFTs representing receivables
 *      that can be paid with any ERC20 token
 */
contract ERC20TransferableReceivable is ERC721, ERC721Enumerable, ERC721URIStorage {
  using Counters for Counters.Counter;

  /**
   * @dev Counter for uniquely identifying payments
   */
  Counters.Counter private _paymentId;

  /**
   * @dev Counter for uniquely identifying receivables
   */
  Counters.Counter private _receivableTokenId;

  /**
   * @dev Struct for storing information about a receivable
   */
  struct ReceivableInfo {
    address tokenAddress;
    uint256 amount;
    uint256 balance;
  }

  /**
   * @notice Mapping for looking up a receivable given a paymentReference and minter address
   */
  mapping(bytes32 => uint256) public receivableTokenIdMapping;

  /**
   * @notice Mapping for looking up information about a receivable given a receivableTokenId
   */
  mapping(uint256 => ReceivableInfo) public receivableInfoMapping;

  /**
   * @notice Address of the payment proxy contract that handles the transfer of ERC20 tokens
   */
  address public paymentProxy;

  /**
   * @notice Event to declare payments to a receivableTokenId
   * @param sender The address of the sender
   * @param recipient The address of the recipient of the payment
   * @param amount The amount of the payment
   * @param paymentProxy The address of the payment proxy contract
   * @param receivableTokenId The ID of the receivable being paid
   * @param tokenAddress The address of the ERC20 token used to pay the receivable
   * @param paymentId The ID of the payment
   * @param paymentReference The reference for the payment
   */
  event TransferableReceivablePayment(
    address sender,
    address recipient,
    uint256 amount,
    address paymentProxy,
    uint256 receivableTokenId,
    address tokenAddress,
    uint256 paymentId,
    bytes indexed paymentReference
  );

  /**
   * @notice Event to declare ERC20 token transfers
   * @param tokenAddress The address of the ERC20 token being transferred
   * @param to The address of the recipient of the transfer
   * @param amount The amount of the transfer
   * @param paymentReference The reference for the transfer
   * @param feeAmount The amount of the transfer fee
   * @param feeAddress The address of the fee recipient
   * @dev This event is emitted from a delegatecall to an ERC20FeeProxy contract
   */
  event TransferWithReferenceAndFee(
    address tokenAddress,
    address to,
    uint256 amount,
    bytes indexed paymentReference,
    uint256 feeAmount,
    address feeAddress
  );

  /**
   * @param name The name of the ERC721 token
   * @param symbol The symbol of the ERC721 token
   * @param _paymentProxyAddress The address of the payment proxy contract
   */
  constructor(
    string memory name,
    string memory symbol,
    address _paymentProxyAddress
  ) ERC721(name, symbol) {
    paymentProxy = _paymentProxyAddress;
  }

  /**
   * @notice Pay the owner of the specified receivable with the provided amount of ERC20 tokens.
   * @param receivableTokenId The ID of the receivable token to pay.
   * @param amount The amount of ERC20 tokens to pay the owner.
   * @param paymentReference The reference for the payment.
   * @param feeAmount The amount of ERC20 tokens to be paid as a fee.
   * @param feeAddress The address to which the fee should be paid.
   * @dev This function uses delegatecall to call on a contract which emits
          a TransferWithReferenceAndFee event.
   */
  function payOwner(
    uint256 receivableTokenId,
    uint256 amount,
    bytes calldata paymentReference,
    uint256 feeAmount,
    address feeAddress
  ) external {
    require(amount != 0, 'Zero amount provided');
    address owner = ownerOf(receivableTokenId);
    _paymentId.increment();

    ReceivableInfo storage receivableInfo = receivableInfoMapping[receivableTokenId];
    address tokenAddress = receivableInfo.tokenAddress;
    receivableInfo.balance += amount;

    (bool status, ) = paymentProxy.delegatecall(
      abi.encodeWithSignature(
        'transferFromWithReferenceAndFee(address,address,uint256,bytes,uint256,address)',
        tokenAddress,
        owner,
        amount,
        paymentReference,
        feeAmount,
        feeAddress
      )
    );
    require(status, 'transferFromWithReferenceAndFee failed');

    emit TransferableReceivablePayment(
      msg.sender,
      owner,
      amount,
      paymentProxy,
      receivableTokenId,
      tokenAddress,
      _paymentId.current(),
      paymentReference
    );
  }

  /**
   * @notice Mint a new transferable receivable.
   * @param owner The address to whom the receivable token will be minted.
   * @param paymentReference A reference for the payment.
   * @param amount The amount of ERC20 tokens to be paid.
   * @param erc20Addr The address of the ERC20 token to be used as payment.
   * @param newTokenURI The URI to be set on the minted receivable token.
   * @dev Anyone can pay for the mint of a receivable on behalf of a user
   */
  function mint(
    address owner,
    bytes calldata paymentReference,
    uint256 amount,
    address erc20Addr,
    string memory newTokenURI
  ) external {
    require(paymentReference.length > 0, 'Zero paymentReference provided');
    require(amount > 0, 'Zero amount provided');
    require(owner != address(0), 'Zero address provided for owner');
    require(erc20Addr != address(0), 'Zero address provided');
    bytes32 idKey = keccak256(abi.encodePacked(owner, paymentReference));
    require(
      receivableTokenIdMapping[idKey] == 0,
      'Receivable has already been minted for this user and request'
    );
    _receivableTokenId.increment();
    uint256 currentReceivableTokenId = _receivableTokenId.current();
    receivableTokenIdMapping[idKey] = currentReceivableTokenId;
    receivableInfoMapping[currentReceivableTokenId] = ReceivableInfo({
      tokenAddress: erc20Addr,
      amount: amount,
      balance: 0
    });

    _mint(owner, currentReceivableTokenId);
    _setTokenURI(currentReceivableTokenId, newTokenURI);
  }

  /**
   * @notice Get an array of all receivable token IDs owned by a specific address.
   * @param _owner The address that owns the receivable tokens.
   * @return An array of all receivable token IDs owned by the specified address.
   */
  function getTokenIds(address _owner) public view returns (uint256[] memory) {
    uint256[] memory _tokensOfOwner = new uint256[](ERC721.balanceOf(_owner));
    uint256 i;

    for (i = 0; i < ERC721.balanceOf(_owner); i++) {
      _tokensOfOwner[i] = ERC721Enumerable.tokenOfOwnerByIndex(_owner, i);
    }
    return (_tokensOfOwner);
  }

  // The following functions are overrides required by Solidity.
  /// @dev Overrides ERC721's _beforeTokenTransfer method to include functionality from ERC721Enumerable.
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, tokenId);
  }

  /// @dev Overrides ERC721's _burn method to include functionality from ERC721URIStorage.
  function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
    super._burn(tokenId);
  }

  /// @dev Overrides ERC721's tokenURI method to include functionality from ERC721URIStorage.
  function tokenURI(uint256 tokenId)
    public
    view
    override(ERC721, ERC721URIStorage)
    returns (string memory)
  {
    return super.tokenURI(tokenId);
  }

  /// @dev Overrides ERC721's supportsInterface method to include functionality from ERC721Enumerable.
  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, ERC721Enumerable)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }
}
