// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';

contract ERC20TransferableReceivable is ERC721, ERC721Enumerable, ERC721URIStorage {
  using Counters for Counters.Counter;

  // Counter for uniquely identifying payments
  Counters.Counter private _paymentId;

  // Counter for uniquely identifying receivable tokens
  Counters.Counter private _receivableTokenId;

  struct ReceivableInfo {
    address tokenAddress;
    uint256 amount;
    uint256 balance;
  }
  mapping(uint256 => ReceivableInfo) public receivableInfoMapping;

  // Mapping for looking up receivable token given a paymentReference
  // and minter address
  mapping(bytes32 => uint256) public receivableTokenIdMapping;

  address public paymentProxy;

  // Event to declare payments to a receivableTokenId
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

  // Event to declare a transfer with a reference
  // This event is emitted from a delegatecall to an ERC20FeeProxy contract
  event TransferWithReferenceAndFee(
    address tokenAddress,
    address to,
    uint256 amount,
    bytes indexed paymentReference,
    uint256 feeAmount,
    address feeAddress
  );

  constructor(
    string memory name,
    string memory symbol,
    address _paymentProxyAddress
  ) ERC721(name, symbol) {
    paymentProxy = _paymentProxyAddress;
  }

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

  function mint(
    bytes calldata paymentReference,
    uint256 amount,
    address erc20Addr,
    string memory newTokenURI
  ) external {
    require(paymentReference.length > 0, 'Zero paymentReference provided');
    require(amount > 0, 'Zero amount provided');
    require(erc20Addr != address(0), 'Zero address provided');
    bytes32 idKey = keccak256(abi.encodePacked(msg.sender, paymentReference));
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

    _mint(msg.sender, currentReceivableTokenId);
    _setTokenURI(currentReceivableTokenId, newTokenURI);
  }

  function getTokenIds(address _owner) public view returns (uint256[] memory) {
    uint256[] memory _tokensOfOwner = new uint256[](ERC721.balanceOf(_owner));
    uint256 i;

    for (i = 0; i < ERC721.balanceOf(_owner); i++) {
      _tokensOfOwner[i] = ERC721Enumerable.tokenOfOwnerByIndex(_owner, i);
    }
    return (_tokensOfOwner);
  }

  // The following functions are overrides required by Solidity.
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, tokenId);
  }

  function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
    super._burn(tokenId);
  }

  function tokenURI(uint256 tokenId)
    public
    view
    override(ERC721, ERC721URIStorage)
    returns (string memory)
  {
    return super.tokenURI(tokenId);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, ERC721Enumerable)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }
}
