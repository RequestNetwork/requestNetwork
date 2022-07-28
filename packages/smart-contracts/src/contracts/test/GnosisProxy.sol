// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GnosisSafeProxy {
  address internal singleton;

  /// @dev Constructor function sets address of singleton contract.
  /// @param _singleton Singleton address.
  constructor(address _singleton) {
    require(_singleton != address(0), 'Invalid singleton address provided');
    singleton = _singleton;
  }

  /// @dev Fallback function forwards all transactions and returns all received return data.
  fallback() external payable {
    // solhint-disable-next-line no-inline-assembly
    assembly {
      let _singleton := and(sload(0), 0xffffffffffffffffffffffffffffffffffffffff)
      // 0xa619486e == keccak("masterCopy()"). The value is right padded to 32-bytes with 0s
      if eq(calldataload(0), 0xa619486e00000000000000000000000000000000000000000000000000000000) {
        mstore(0, _singleton)
        return(0, 0x20)
      }
      calldatacopy(0, 0, calldatasize())
      let success := delegatecall(gas(), _singleton, 0, calldatasize(), 0, 0)
      returndatacopy(0, 0, returndatasize())
      if eq(success, 0) {
        revert(0, returndatasize())
      }
      return(0, returndatasize())
    }
  }
}
