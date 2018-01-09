import Artifacts from './artifacts';

import RequestEthereumService from './servicesContracts/requestEthereum-service';

/**
 * getServiceFromAddress return the service of a coresponding currency contract address
 * @param   address     The address of the currency contract
 * @return  The service object or undefined if not found
 */
export const getServiceFromAddress = (address: string): any => {
    if (!address) return undefined;

    if (isThisArtifact(Artifacts.requestEthereumArtifact, address)) {
        return new RequestEthereumService();
    } else {
        return undefined;
    }
};

const isThisArtifact = (artifact: any, address: string): boolean => {
    if (!address) return false;
    let found: boolean = false;
    Object.keys(artifact.networks).forEach((k) => {
        found = found || (artifact.networks[k].address
                            && artifact.networks[k].address.toLowerCase() === address.toLowerCase());
    });
    return found;
};
