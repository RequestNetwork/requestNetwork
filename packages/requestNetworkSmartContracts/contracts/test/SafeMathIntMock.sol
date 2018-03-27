pragma solidity ^0.4.18;

// Inspired from https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/mocks/SafeMathMock.sol

import "../base/math/SafeMathInt.sol";


contract SafeMathIntMock {
  int256 public result;

  function multiply(int256 a, int256 b) public {
    result = SafeMathInt.mul(a, b);
  }

  function divide(int256 a, int256 b) public {
    result = SafeMathInt.div(a, b);
  }

  function subtract(int256 a, int256 b) public {
    result = SafeMathInt.sub(a, b);
  }

  function add(int256 a, int256 b) public {
    result = SafeMathInt.add(a, b);
  }
}