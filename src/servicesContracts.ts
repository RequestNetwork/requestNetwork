import Artifacts from './artifacts';

import RequestEthereumService from './servicesContracts/requestEthereum-service';

export const getServiceFromAddress = function(address: string): any{
	if(!address) return undefined;

	if(isThisArtifact(Artifacts.RequestEthereumArtifact, address)) {
		return new RequestEthereumService();
	} else {
		return undefined;
	}
}

const isThisArtifact = function(artifact: any,address: string): boolean {
	if(!address) return false;
	let found: boolean = false;
	Object.keys(artifact.networks).forEach(function(k) {
		found = found || (artifact.networks[k].address && artifact.networks[k].address.toLowerCase() == address.toLowerCase());
	})
	return found;
}
