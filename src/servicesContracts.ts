import config from './config';
import {Artifact} from './types';

import RequestEthereumService from './servicesContracts/requestEthereum-service';


export const getServiceFromAddress = function(address:string, web3Provider ? : any) : any{
	switch(address.toLowerCase()) {
		case config.ethereum.contracts.requestEthereum.toLowerCase():
			return new RequestEthereumService(web3Provider);
		default:
			return undefined;
	}
}