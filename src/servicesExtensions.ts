import config from './config';
import {Artifact} from './types';

import RequestSynchroneExtensionEscrowService from './servicesExtensions/requestSynchroneExtensionEscrow-service';


export const getServiceFromAddress = function(address:string, web3Provider ? : any) : any{
	switch(address.toLowerCase()) {
		case config.ethereum.contracts.requestSynchroneExtensionEscrow.toLowerCase():
			return new RequestSynchroneExtensionEscrowService(web3Provider);
		default:
			return undefined;
	}
}