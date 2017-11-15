import config from './config';
import {Artifact} from './types';

import RequestEthereumService from './servicesContracts/requestEthereum-service';

export const services = {
    RequestEthereumService: 	RequestEthereumService as any,
};

export const getServiceFromAddress = function(address:string) : any{
	switch(address.toLowerCase()) {
		case config.ethereum.contracts.requestEthereum.toLowerCase():
			return services.RequestEthereumService;
		default:
			return undefined;
	}
}