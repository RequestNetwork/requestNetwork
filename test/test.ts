import RequestEthereumService from "../src/servicesContracts/requestEthereum-service";
import RequestSynchroneExtensionEscrowService from "../src/servicesExtensions/requestSynchroneExtensionEscrow-service";
const config = require('../src/config.json');

var requestEthereumService = new RequestEthereumService();
var requestSynchroneExtensionEscrowService = new RequestSynchroneExtensionEscrowService();

async function foo() {
    try {
        let result = await requestEthereumService.createRequestAsPayeeAsync( 
					"0xf17f52151ebef6c7334fad080c5704d77216b732", // 1
					1000,
					/* "", */ config.ethereum.contracts.requestSynchroneExtensionEscrow,
					/* [], */ ["0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef"], // 2 
					'{"reason":"wine purchased"}');

				console.log("result createRequestAsPayeeAsync********************");
				console.log(result);

				let requestID = result.requestId;
				result = await requestEthereumService.getRequestAsync(requestID);
				console.log("result requestEthereumService getRequestAsync********************");
				console.log(result);

				// let resultExtension = await RequestSynchroneExtensionEscrowService.getInstance().getRequestAsync(requestID);
				// console.log("result requestSynchroneExtensionEscrowService getRequestAsync********************");
				// console.log(resultExtension);
				// let resultCancel = await requestEthereumService.cancelAsync(requestID);
				// console.log("result cancelAsync********************");
				// console.log(resultCancel);
				// let result2 = await requestEthereumService.getRequestAsync(requestID);
				// console.log("result requestEthereumService getRequestAsync********************");
				// console.log(result2);
				let resultAccept = await requestEthereumService.acceptAsync(requestID,0,"0xf17f52151ebef6c7334fad080c5704d77216b732");
				console.log("result acceptAsync********************");
				console.log(resultAccept);

				result = await requestEthereumService.getRequestAsync(requestID);
				console.log("result requestEthereumService getRequestAsync********************");
				console.log(result);

				console.log("######################################### payAsync #########################################");
				let resultPay = await requestEthereumService.payAsync(requestID,1000,0,0,"0xf17f52151ebef6c7334fad080c5704d77216b732");
				console.log("result resultPay********************");
				console.log(resultPay);

				result = await requestEthereumService.getRequestAsync(requestID);
				console.log("result requestEthereumService getRequestAsync********************");
				console.log(result);

				console.log("######################################### releaseToPayeeAsync #########################################");
				let resultReleaseToPayee = await requestSynchroneExtensionEscrowService.releaseToPayeeAsync(requestID,0,"0xf17f52151ebef6c7334fad080c5704d77216b732");
				console.log("result releaseToPayeeAsync********************");
				console.log(resultReleaseToPayee);

				result = await requestEthereumService.getRequestAsync(requestID);
				console.log("result requestEthereumService getRequestAsync********************");
				console.log(result);

				console.log("######################################### paybackAsync #########################################");
				let resultPayBack = await requestEthereumService.paybackAsync(requestID,100,0);
				console.log("result paybackAsync********************");
				console.log(resultPayBack);

				result = await requestEthereumService.getRequestAsync(requestID);
				console.log("result requestEthereumService getRequestAsync********************");
				console.log(result);


				console.log("######################################### discountAsync #########################################");
				let resultdiscount = await requestEthereumService.discountAsync(requestID,100);
				console.log("result discountAsync********************");
				console.log(resultdiscount);

				result = await requestEthereumService.getRequestAsync(requestID);
				console.log("result requestEthereumService getRequestAsync********************");
				console.log(result);
				
    }
    catch(err) {
        console.log('Error: ', err.message);
    }
}

foo();
