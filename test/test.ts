const config = require('../src/config.json');

import RequestNetwork from '../src/requestNetwork';
var rn = new RequestNetwork();

async function foo() {
    try {

			let result = await rn.requestEthereumService.createRequestAsPayee( 
					'0xf17f52151ebef6c7334fad080c5704d77216b732', // 1
					200000,
					'{"reason":"wine purchased"}'
			);

			console.log('createRequestAsPayee')
			console.log(result)

			// await rn.requestEthereumService.accept(result.request.requestId,{from:'0xf17f52151ebef6c7334fad080c5704d77216b732'});
			await rn.requestEthereumService.paymentAction(result.request.requestId,900,0,{from:'0xf17f52151ebef6c7334fad080c5704d77216b732'});
			await rn.requestEthereumService.refundAction(result.request.requestId,700);

			result = await rn.requestCoreService.getRequestHistory(result.request.requestId);


			console.log('getRequestHistory')
			console.log(result)

    }
    catch(err) {
        console.log('Error: ', err.message);
    }
}

foo();

