var config = {
    "all":true,
    // "core.js": {
        "requestAdministrable.js":false, 
        "requestCoreCreateRequest.js":false,
        "requestCoreCreateRequestFromBytes.js":false, 
        "requestCoreAcceptCancel.js":false,
        "requestCoreUpdateExpectedAmount.js":false,
        "requestCoreUpdateBalance.js":false,
        "CentralBank-test.js":false,
        "SafeMathInt-test.js":false,
        "burner-test.js":false,
        "requestCollectInterface.js":false,
    // },
    // "synchrone": {
    //      "ethereum.js": {
                "requestEthereumCreateRequestAsPayee.js":false,
                "requestEthereumCreateRequestAsPayer.js":false,
                "requestEthereumBroadcastSignedRequestAsPayer.js":false,
                "requestEthereumAccept.js":false, 
                "requestEthereumCancelByPayer.js":false, 
                "requestEthereumCancel.js":false,
                "requestEthereumSubtract.js":false, 
                "requestEthereumAdditional.js":false,
                "requestEthereumPay.js":false, 
                "requestEthereumPayBack.js":false, 
                "requestEthereumPaymentStuck.js":false,
    //      },
    //      "erc20.js": {
                "requestERC20CreateRequestAsPayee.js":false,
                "requestERC20CreateRequestAsPayer.js":false,
                "requestERC20BroadcastSignedRequestAsPayer.js":false,
                "requestERC20Accept.js":false,
                "requestERC20Cancel.js":false,
                "requestERC20CancelByPayer.js":false,
                "requestERC20Subtract.js":false,
                "requestERC20Additional.js":false,
                "requestERC20PaymentAction.js":false,
                "requestERC20RefundAction.js":false,
    //      }
    // },
    // "asynchrone": {
    //      "requestBitcoinNodesValidation.js": {
                "requestBitcoinNodesValidationCreateRequestAsPayee.js":false,
                "requestBitcoinNodesValidationCreateRequestAsPayee.js":false,
                "requestBitcoinNodesValidationAccept.js":false, 
                "requestBitcoinNodesValidationCancelByPayer.js":false, 
                "requestBitcoinNodesValidationCancel.js":false,
                "requestBitcoinNodesValidationSubtract.js":false, 
                "requestBitcoinNodesValidationAdditional.js":false,
};
module.exports = config;
