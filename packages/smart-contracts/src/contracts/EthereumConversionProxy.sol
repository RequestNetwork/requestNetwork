// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// import "./ChainlinkConversionPath.sol";
// import "./interfaces/EthereumFeeProxy.sol";


// /**
//  * @title EthereumConversionProxy
//  * @notice This contract convert from chainlink
//  *         before paying a request thanks to a conversion payment proxy
//   */
// contract EthereumConversionProxy {
//   address public paymentProxy;
//   ChainlinkConversionPath public chainlinkConversionPath;

//   constructor(address _paymentProxyAddress, address _chainlinkConversionPathAddress) {
//     paymentProxy = _paymentProxyAddress;
//     chainlinkConversionPath = ChainlinkConversionPath(_chainlinkConversionPathAddress);
//   }

//   // Event to declare a conversion with a reference
//   event TransferWithConversionAndReference(
//     uint256 amount,
//     address currency,
//     bytes indexed paymentReference,
//     uint256 feeAmount,
//     uint256 maxRateTimespan
//   );

//   /**
//    * @notice Performs an ERC20 token transfer with a reference computing the payment amount based on the request amount
//    * @param _to Transfer recipient of the payement
//    * @param _requestAmount Request amount
//    * @param _path Conversion path
//    * @param _paymentReference Reference of the payment related
//    * @param _feeAmount The amount of the payment fee
//    * @param _feeAddress The fee recipient
//    * @param _maxToSpend Amount max that we can spend on the behalf of the user
//    * @param _maxRateTimespan Max time span with the oldestrate, ignored if zero
//    */
//   function transferFromWithReferenceAndFee(
//     address _to,
//     uint256 _requestAmount,
//     address[] calldata _path,
//     bytes calldata _paymentReference,
//     uint256 _feeAmount,
//     address _feeAddress,
//     uint256 _maxToSpend,
//     uint256 _maxRateTimespan
//   )
//     external
//     payable
//   {
//     // payment currency must be ether
//     require(_path[_path.length - 1] == address(0xF5AF88e117747e87fC5929F2ff87221B1447652E), "payment currency must be ether");

//     (uint256 amountToPay, uint256 amountToPayInFees) = getConversions(
//       _path,
//       _requestAmount,
//       _feeAmount,
//       _maxRateTimespan);

//     require(
//       amountToPay + amountToPayInFees <= _maxToSpend,
//       "Amount to pay is over the user limit"
//     );

//     // Pay the request and fees
//     (bool status, ) = paymentProxy.delegatecall(
//       abi.encodeWithSignature(
//         "transferFromWithReferenceAndFee(address,bytes,uint256,address)",
//         _to,
//         _paymentReference,
//         amountToPayInFees,
//         _feeAddress
//       )
//     );
//     require(status, "transferFromWithReferenceAndFee failed");

//     // Event to declare a transfer with a reference
//     emit TransferWithConversionAndReference(
//       _requestAmount,
//       _path[0],
//       _paymentReference,
//       _feeAmount,
//       _maxRateTimespan
//     );
//   }

//   function getConversions(
//     address[] memory _path,
//     uint256 _requestAmount,
//     uint256 _feeAmount,
//     uint256 _maxRateTimespan
//   )
//     internal
//     view
//     returns (uint256 amountToPay, uint256 amountToPayInFees)
//   {
//     (uint256 rate, uint256 oldestTimestampRate, uint256 decimals) = chainlinkConversionPath.getRate(_path);

//     // Check rate timespan
//     require(
//       _maxRateTimespan == 0 || block.timestamp - oldestTimestampRate <= _maxRateTimespan,
//       "aggregator rate is outdated"
//     );

//     // Get the amount to pay in the crypto currency chosen
//     amountToPay = (_requestAmount * rate) / decimals;
//     amountToPayInFees = (_feeAmount * rate) /decimals;
//   }
// }
