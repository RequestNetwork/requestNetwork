import config from './config';
import {Artifact} from './types';

import RequestSynchroneExtensionEscrowService from './servicesExtensions/requestSynchroneExtensionEscrow-service';

export const services = {
    RequestSynchroneExtensionEscrowService: 	RequestSynchroneExtensionEscrowService as any,
};

export const getServiceFromAddress = function(address:string) : any{
	switch(address.toLowerCase()) {
		case config.ethereum.contracts.requestSynchroneExtensionEscrow.toLowerCase():
			return services.RequestSynchroneExtensionEscrowService;
		default:
			return undefined;
	}
}