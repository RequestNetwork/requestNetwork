// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ForceSend {
  function forceSend(address payable recipient) public payable {
    selfdestruct(recipient);
  }
}
