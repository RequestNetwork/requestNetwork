pragma solidity 0.4.18;

/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMathInt {
  function mul(int256 a, int256 b) internal pure returns (int256) {
    int256 c = a * b;
    assert((b == 0) || (c / b == a));
    return c;
  }

  function div(int256 a, int256 b) internal pure returns (int256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    int256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  function sub(int256 a, int256 b) internal pure returns (int256) {
    assert((b >= 0 && a - b <= a) || (b < 0 && a - b > a));

    return a - b;
  }

  function add(int256 a, int256 b) internal pure returns (int256) {
    int256 c = a + b;
    assert((b >= 0 && c >= a) || (b < 0 && c < a));
    return c;
  }

  // function sub(int256 a, uint256 b) internal pure returns (int256) {
  //   assert(b<2^255); // avoid miss conversion
  //   assert((a-int256(b))>a);

  //   return a - int256(b);
  // }

  // function add(int256 a, uint256 b) internal pure returns (int256) {
  //   assert(b<2^255); // avoid miss conversion
  //   int256 c = a + int256(b);
  //   assert(c <= a);
  //   return c;
  // }


  function toUint256Safe(int256 a) internal pure returns (uint256) {
    assert(a>=0);
    return uint256(a);
  }
}
