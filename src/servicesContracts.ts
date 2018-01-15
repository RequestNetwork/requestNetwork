import Artifacts from './artifacts';
import { InterfaceArtifact } from './types';

import RequestEthereumService from './servicesContracts/requestEthereum-service';

/**
 * getServiceFromAddress return the service of a coresponding currency contract address
 * @param   address     The address of the currency contract
 * @return  The service object or undefined if not found
 */
export const getServiceFromAddress = (address: string): any => {
    if (!address) return;

    if (isThisArtifact(Artifacts.requestEthereumArtifact, address)) {
        return new RequestEthereumService();
    }
};

const isThisArtifact = (artifact: InterfaceArtifact, address: string): boolean => {
    if (!address) return false;

    const sanitizedAdress = address.toLowerCase();
    return Object.keys(artifact.networks)
        .some((k) => {
            const network = artifact.networks[k];
            if (!network.address) return false;
            return network.address.toLowerCase() === sanitizedAdress;
        });
};
