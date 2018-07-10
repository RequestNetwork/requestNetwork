pragma solidity ^0.4.18;


import "../ownership/Ownable.sol";


/**
 * @title Destructible
 * @dev Base contract that can be destroyed by owner. All funds in contract will be sent to the owner.
 * @dev From https://github.com/OpenZeppelin/openzeppelin-solidity/blob/v1.8.0/contracts/lifecycle/Destructible.sol
 */
contract Destructible is Ownable {

  function Destructible() public payable { }

  /**
   * @dev Transfers the current balance to the owner and terminates the contract.
   */
  function destroy() onlyOwner public {
    selfdestruct(owner);
  }

  function destroyAndSend(address _recipient) onlyOwner public {
    selfdestruct(_recipient);
  }
}
