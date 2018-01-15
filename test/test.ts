const config = require('../src/config.json');

import RequestNetwork from '../src/requestNetwork';
var rn = new RequestNetwork("http://localhost:8545",10000000000);

async function foo() {
    try {

			let result = await rn.requestEthereumService.createRequestAsPayee( 
					'0xf17f52151ebef6c7334fad080c5704d77216b732', // 1
					200000,
					// '{"reason":"wine purchased"}'
			);
			console.log('createRequestAsPayee')
			console.log(result)

			// result = await rn.requestEthereumService.createRequestAsPayee( 
			// 		'0x2932b7a2355d6fecc4b5c0b6bd44cc31df247a2e', // 1
			// 		200000,
			// 		'{"reason":"wine purchased"}',
			// 		'',
			// 		[],
			// 		{from:'0xf17f52151ebef6c7334fad080c5704d77216b732'}
			// );

			// console.log('createRequestAsPayee')
			// console.log(result)

			result = await rn.requestCoreService.getRequestsByAddress('0x627306090abab3a6e1400e9345bc60c78a8bef57');

			console.log('getRequestsByAddress')
			console.log(result);
			console.log(result.asPayee);

			// await rn.requestEthereumService.accept(result.request.requestId,{from:'0xf17f52151ebef6c7334fad080c5704d77216b732'});
			// await rn.requestEthereumService.paymentAction(result.request.requestId,900,0,{from:'0xf17f52151ebef6c7334fad080c5704d77216b732'});
			// await rn.requestEthereumService.refundAction(result.request.requestId,700);
			// result = await rn.requestCoreService.getRequestEvents(result.request.requestId);
			// console.log('getRequestEvents')
			// console.log(result)
			// console.log('getRequestEvents JSON')
			// console.log(JSON.stringify(result))

    }
    catch (err) {
        console.log('Error: ', err.message);
    }
}

foo();

