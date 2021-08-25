// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract AggregatorMock {
  uint8 private _decimals;
  int256 private _rate;
  uint8 private _rateAge;

  constructor(int256 _r, uint8 _d, uint8 _ra) {
      _rate = _r;
      _decimals = _d;
      _rateAge = _ra;
  }

  function decimals() external view returns (uint8) {
    return _decimals;
  }

  function latestAnswer() external view returns (int256) {
    return _rate;
  }

  function latestTimestamp() external view returns (uint256) {
    // one minute old
    return block.timestamp - _rateAge;
  }

  function setDecimals(uint8 _d) public {
      _decimals = _d;
  }

  function setRate(int256 _r) public {
      _rate = _r;
  }

  function setRageAge(uint8 _ra) public {
      _rateAge = _ra;
  }
}
