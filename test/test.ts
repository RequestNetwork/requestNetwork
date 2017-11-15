import RequestEthereumService from '../src/services/requestEthereum-service';
import RequestSynchroneExtensionEscrowService from '../src/services/requestSynchroneExtensionEscrow-service';

const config = require('../src/config.json');

var requestEthereumService = new RequestEthereumService();
// var requestSynchroneExtensionEscrowService = new RequestSynchroneExtensionEscrowService();


// console.log('1111111111111111111111111');
// 	requestEthereumService.createRequestAsPayee( 
// 		'0x4ef9E4721BBF02b84D0E73822EE4E26e95076b9D', // 1
// 		10,
// 		config.ethereum.contracts.requestSyncEscrow,
// 		['0x4222ec932c5a68b80e71f4ddebb069fa02518b8a'], // 3
// 		'{"reason":"wine purchased"}',
// 		(transactionHash:string) => {
// 			console.log('transactionHash')
// 			console.log(transactionHash)
// 		},
//  		(receipt:any) => {
// 			console.log('receipt')
// 			console.log(receipt)
// 			console.log(receipt.events[0].raw)

// 		},
// 		(confirmationNumber:number, receipt:any) => {
// 			console.log('confirmationNumber')
// 			console.log(confirmationNumber)
// 			console.log(receipt)
// 		},
// 		(error:Error) => console.error
// 	);
// console.log('2222222222222222222222222222');



async function foo() {
    try {
        let result = await requestEthereumService.createRequestAsPayeeAsync(
            '0x4ef9E4721BBF02b84D0E73822EE4E26e95076b9D', // 1
            100000000000,
            config.ethereum.contracts.requestSynchroneExtensionEscrow, ['0x4222ec932c5a68b80e71f4ddebb069fa02518b8a'], // 3
            '{reason:"wine purchased"}');

        console.log('result createRequestAsPayeeAsync********************');
        console.log(result);

        let result1 = await requestEthereumService.getRequestAsync(result.requestId);
        console.log('result requestEthereumService getRequestAsync********************');
        console.log(result1);

        let resultExtension = await RequestSynchroneExtensionEscrowService.getInstance().getRequestAsync(result.requestId);
        console.log('result requestSynchroneExtensionEscrowService getRequestAsync********************');
        console.log(resultExtension);

        // let resultCancel = await requestEthereumService.cancelAsync(result.requestId);
        // console.log('result cancelAsync********************');
        // console.log(resultCancel);

        // let result2 = await requestEthereumService.getRequestAsync(result.requestId);
        // console.log('result requestEthereumService getRequestAsync********************');
        // console.log(result2);
    } catch (err) {
        console.log('Error: ', err.message);
    }
}

foo();

// requestEthereumService.getRequest('0x7dfe757ecd65cbd7922a9c0161e935dd7fdbcc0e999689c7d31633896b1fc60b', (err:Error, request:any) => {
// 	if(err) {
// 		console.log('err');
// 		console.log(err);
// 	}
// 	console.log('request');
// 	console.log(request);
// });






// import Ipfs from './src/services/ipfs-service';

// let ipfs:any = Ipfs.getInstance();

// ipfs.addFile('{reason:"weed purchase"}', (err:Error,hash:string) => {
// 	if(err) {
// 		console.log('err 0');
// 		console.log(err);
// 	}
// 	console.log('hash');
// 	console.log(hash);

// 	ipfs.getFile(hash, (err:Error,data:any) => {
// 		if(err) {
// 			console.log('err');
// 			console.log(err);
// 		}
// 		console.log('data');
// 		console.log(data);
// 	});
// });


// ipfs.getFile('QmSbfaY3FRQQNaFx8Uxm6rRKnqwu8s9oWGpRmqgfTEgxWz', (err:Error,data:any) => {
// 	if(err) {
// 		console.log('err');
// 		console.log(err);
// 	}
// 	console.log('data');
// 	console.log(data);
// });













// var ipfsAPI = require('ipfs-api')

// var ipfs = ipfsAPI('localhost', '5001', {protocol: 'http'})

// ipfs.files.add(Buffer.from('{reason:"beers"}'), (err, result) => {
// 	if (err) { throw err }

// 	console.log('err')
// 	console.log(err)
// 	console.log('result')
// 	console.log(result)
// 	console.log('result')

// 	console.log('\nAdded file:', result[0].path, result[0].hash)
// 	// process.exit()
// })

// // QmSbfaY3FRQQNaFx8Uxm6rRKnqwu8s9oWGpRmqgfTEgxWz
//