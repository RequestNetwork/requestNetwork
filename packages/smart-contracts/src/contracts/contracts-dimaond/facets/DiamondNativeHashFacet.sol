// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibDiamond} from '../libraries/LibDiamond.sol';
import '../storage/AppStorage.sol';

// Facet used to administrate the native token hash
contract DiamondNativeHashFacet {
  AppStorage internal s;

  /**
   * @notice Update the native token hash
   * @param _nativeTokenHash hash of the native token represented as an eth address
   */
  function updateNativeTokenHash(address _nativeTokenHash) external {
    LibDiamond.enforceIsContractOwner();
    require(
      _nativeTokenHash != address(0),
      'UpdateNativeTokenHash failed: Invalid native token hash'
    );

    s.nativeTokenHash = _nativeTokenHash;
  }

  function getNativeTokenHash() external view returns (address) {
    return s.nativeTokenHash;
  }
}
