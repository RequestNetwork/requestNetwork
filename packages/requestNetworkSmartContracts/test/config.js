var config = {
	"all":true,
	// "core.js": {
		"requestAdministrable.js":false,    
		"requestCoreCreateRequest.js":false,    
		"requestCoreAcceptCancel.js":false,
		"requestCoreUpdateExpectedAmount.js":false,  
		"requestCoreUpdateBalance.js":false,  
	// },
	// "synchrone.js": {
	//	 	"ethereum.js": {
				"requestEthereumCreateRequestAsPayee.js":false,
				"requestEthereumCreateRequestAsPayer.js":false,
				"requestEthereumBroadcastSignedRequestAsPayer.js":false,
				"requestEthereumAccept.js":false, 
				"requestEthereumCancelByPayer.js":false, 
				"requestEthereumCancel.js":false, 
				"requestEthereumWithdraw.js":false, 
				"requestEthereumSubtract.js":false, 
				"requestEthereumAdditional.js":false,  
				"requestEthereumPay.js":false, 
				"requestEthereumPayBack.js":false, 
				"requestEthereumPaymentStuck.js":false,
	//		}
	// },
};
module.exports = config;