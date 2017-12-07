const config = require('../src/config.json');

import RequestNetwork from '../src/requestNetwork';
var rn = new RequestNetwork();


// async function foo() {
//     try {
// 		let result = await rn.requestEthereumService.getRequestAsync("0x0000010000000000000000000000000000000000000000000000000000000000");
// 		console.log('result rn.requestEthereumService getRequestAsync********************');
// 		console.log(result);
//     }
//     catch(err) {
//         console.log('Error: ', err.message);
//     }
// }

// foo();


// async function foo() {
//     try {
//         let result = await rn.requestEthereumService.createRequestAsPayeeAsync( 
// 					'0xf17f52151ebef6c7334fad080c5704d77216b732', // 1
// 					200000,
// 					'{"reason":"wine purchased"}'
// 					// ,config.ethereum.contracts.requestSynchroneExtensionEscrow
// 					// ,['0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef'] // 2 
// 					);

// 				console.log('result createRequestAsPayeeAsync********************');
// 				console.log(result);

// 				let requestID = result.request.requestId;
// 				result = await rn.requestEthereumService.getRequestAsync(requestID);
// 				console.log('result rn.requestEthereumService getRequestAsync********************');
// 				console.log(result);

// 				// let resultExtension = await RequestSynchroneExtensionEscrowService.getInstance().getRequestAsync(requestID);
// 				// console.log('result requestSynchroneExtensionEscrowService getRequestAsync********************');
// 				// console.log(resultExtension);
// 				// let resultCancel = await rn.requestEthereumService.cancelAsync(requestID);
// 				// console.log('result cancelAsync********************');
// 				// console.log(resultCancel);
// 				// let result2 = await rn.requestEthereumService.getRequestAsync(requestID);
// 				// console.log('result rn.requestEthereumService getRequestAsync********************');
// 				// console.log(result2);

// 				let resultAccept = await rn.requestEthereumService.acceptAsync(requestID,{from:'0xf17f52151ebef6c7334fad080c5704d77216b732'});
// 				console.log('result acceptAsync********************');
// 				console.log(resultAccept);

// 				result = await rn.requestEthereumService.getRequestAsync(requestID);
// 				console.log('result rn.requestEthereumService getRequestAsync********************');
// 				console.log(result);

// 				console.log('######################################### paymentActionAsync #########################################');
// 				let resultPay = await rn.requestEthereumService.paymentActionAsync(requestID,900,0,{from:'0xf17f52151ebef6c7334fad080c5704d77216b732'});
// 				console.log('result resultPay********************');
// 				console.log(resultPay);

// 				result = await rn.requestEthereumService.getRequestAsync(requestID);
// 				console.log('result rn.requestEthereumService getRequestAsync********************');
// 				console.log(result);

// 				// console.log('######################################### releaseToPayeeAsync #########################################');
// 				// let resultReleaseToPayee = await rn.requestSynchroneExtensionEscrowService.releaseToPayeeAsync(requestID,{from:'0xf17f52151ebef6c7334fad080c5704d77216b732'});
// 				// console.log('result releaseToPayeeAsync********************');
// 				// console.log(resultReleaseToPayee);

// 				// result = await rn.requestEthereumService.getRequestAsync(requestID);
// 				// console.log('result rn.requestEthereumService getRequestAsync********************');
// 				// console.log(result);

// 				console.log('######################################### refundActionAsync #########################################');
// 				let resultPayBack = await rn.requestEthereumService.refundActionAsync(requestID,100);
// 				console.log('result refundActionAsync********************');
// 				console.log(resultPayBack);

// 				result = await rn.requestEthereumService.getRequestAsync(requestID);
// 				console.log('result rn.requestEthereumService getRequestAsync********************');
// 				console.log(result);


// 				console.log('######################################### subtractActionAsync #########################################');
// 				let resultsubtractAction = await rn.requestEthereumService.subtractActionAsync(requestID,100);
// 				console.log('result subtractActionAsync********************');
// 				console.log(resultsubtractAction);

// 				result = await rn.requestEthereumService.getRequestAsync(requestID);
// 				console.log('result requestEthereumService getRequestAsync********************');
// 				console.log(result);



// 				console.log('######################################### additionalActionAsync #########################################');
// 				let resultAdditionalAction = await rn.requestEthereumService.additionalActionAsync(requestID,222,{from:'0xf17f52151ebef6c7334fad080c5704d77216b732'});
// 				console.log('result additionalActionAsync********************');
// 				console.log(resultAdditionalAction);

// 				result = await rn.requestEthereumService.getRequestAsync(requestID);
// 				console.log('result requestEthereumService getRequestAsync********************');
// 				console.log(result);

//     }
//     catch(err) {
//         console.log('Error: ', err.message);
//     }
// }

// async function foo() {
//     try {

    	rn.requestEthereumService.createRequestAsPayee( 
					'0xf17f52151ebef6c7334fad080c5704d77216b732', // 1
					200000,
					'{"reason":"wine purchased"}'
			)
			.on('broadcasted', (data:any) => {
				console.log('broadcasted')
				console.log(data)
			})
			.then((data:any) => {
				console.log('then')
				console.log(data)
			}, (err:any) => {
				console.log('catch')
				console.log(err)
			})
			// .catch((err:any) => {
			// 	console.log('catch')
			// 	console.log(err)
			// })

   //  	rn.requestEthereumService.createRequestAsPayeeAsync( 
			// 		'0xf17f52151ebef6c7334fad080c5704d77216b732', // 1
			// 		200000,
			// 		'{"reason":"wine purchased"}'
			// 		// ,config.ethereum.contracts.requestSynchroneExtensionEscrow
			// 		// ,['0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef'] // 2 
			// 		)
			// .on('transactionConfirmed', (data:any) => {
			// 	console.log('transactionConfirmed')
			// 	console.log(data)
			// })
			// .on('error', (e:any) => {
			// 	console.log('error')
			// 	console.log(e)
			// })
			// .then((err:any,data:any) => {
			// 	console.log('then')
			// 	console.log(err)
			// 	console.log(data)
			// })

     //    let result = await rn.requestEthereumService.createRequestAsPayeeAsync( 
					// '0xf17f52151ebef6c7334fad080c5704d77216b732', // 1
					// 200000,
					// '{"reason":"wine purchased"}'
					// // ,config.ethereum.contracts.requestSynchroneExtensionEscrow
					// // ,['0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef'] // 2 
					// );

				// console.log('result createRequestAsPayeeAsync********************');
				// console.log(result.transactionHash);

				// result = await rn.requestCoreService.getRequestByTransactionHashAsync(result.transactionHash);
				
				// console.log('result getRequestByTransactionHashAsync********************');
				// console.log(result);


				// let requestID = result.request.requestId;
				// result = await rn.requestEthereumService.getRequestAsync(requestID);
				// console.log('result rn.requestEthereumService getRequestAsync********************');
				// console.log(result);

				// // let resultExtension = await RequestSynchroneExtensionEscrowService.getInstance().getRequestAsync(requestID);
				// // console.log('result requestSynchroneExtensionEscrowService getRequestAsync********************');
				// // console.log(resultExtension);
				// // let resultCancel = await rn.requestEthereumService.cancelAsync(requestID);
				// // console.log('result cancelAsync********************');
				// // console.log(resultCancel);
				// // let result2 = await rn.requestEthereumService.getRequestAsync(requestID);
				// // console.log('result rn.requestEthereumService getRequestAsync********************');
				// // console.log(result2);

				// let resultAccept = await rn.requestEthereumService.acceptAsync(requestID,{from:'0xf17f52151ebef6c7334fad080c5704d77216b732'});
				// console.log('result acceptAsync********************');
				// console.log(resultAccept);

				// result = await rn.requestEthereumService.getRequestAsync(requestID);
				// console.log('result rn.requestEthereumService getRequestAsync********************');
				// console.log(result);

				// console.log('######################################### paymentActionAsync #########################################');
				// let resultPay = await rn.requestEthereumService.paymentActionAsync(requestID,900,0,{from:'0xf17f52151ebef6c7334fad080c5704d77216b732'});
				// console.log('result resultPay********************');
				// console.log(resultPay);

				// result = await rn.requestEthereumService.getRequestAsync(requestID);
				// console.log('result rn.requestEthereumService getRequestAsync********************');
				// console.log(result);

				// // console.log('######################################### releaseToPayeeAsync #########################################');
				// // let resultReleaseToPayee = await rn.requestSynchroneExtensionEscrowService.releaseToPayeeAsync(requestID,{from:'0xf17f52151ebef6c7334fad080c5704d77216b732'});
				// // console.log('result releaseToPayeeAsync********************');
				// // console.log(resultReleaseToPayee);

				// // result = await rn.requestEthereumService.getRequestAsync(requestID);
				// // console.log('result rn.requestEthereumService getRequestAsync********************');
				// // console.log(result);

				// console.log('######################################### refundActionAsync #########################################');
				// let resultPayBack = await rn.requestEthereumService.refundActionAsync(requestID,100);
				// console.log('result refundActionAsync********************');
				// console.log(resultPayBack);

				// result = await rn.requestEthereumService.getRequestAsync(requestID);
				// console.log('result rn.requestEthereumService getRequestAsync********************');
				// console.log(result);


				// console.log('######################################### subtractActionAsync #########################################');
				// let resultsubtractAction = await rn.requestEthereumService.subtractActionAsync(requestID,100);
				// console.log('result subtractActionAsync********************');
				// console.log(resultsubtractAction);

				// result = await rn.requestEthereumService.getRequestAsync(requestID);
				// console.log('result requestEthereumService getRequestAsync********************');
				// console.log(result);



				// console.log('######################################### additionalActionAsync #########################################');
				// let resultAdditionalAction = await rn.requestEthereumService.additionalActionAsync(requestID,222,{from:'0xf17f52151ebef6c7334fad080c5704d77216b732'});
				// console.log('result additionalActionAsync********************');
				// console.log(resultAdditionalAction);

				// result = await rn.requestEthereumService.getRequestAsync(requestID);
				// console.log('result requestEthereumService getRequestAsync********************');
				// console.log(result);

//     }
//     catch(err) {
//         console.log('Error: ', err.message);
//     }
// }

// foo();

