import requestArtifacts from 'requestnetworkartifacts';

// services
import RequestEthereumService from './servicesContracts/requestEthereum-service';
// import RequestSynchroneExtensionEscrowService from './servicesExtensions/requestSynchroneExtensionEscrow-service';

/**
 * getServiceFromAddress return the service of a coresponding currency contract address
 * @param   address     The address of the currency contract
 * @return  The service object or undefined if not found
 */
export const getServiceFromAddress = (_networkName: string, _address: string): any => {
    if (!_networkName || !_address) return;

    const artifact = requestArtifacts(_networkName, _address);
    if (!artifact) return;

    switch (artifact.contractName) {
        case 'RequestEthereum':
            return new RequestEthereumService();
        // case 'RequestSynchroneExtensionEscrow':
        //     return new RequestSynchroneExtensionEscrowService();
        default:
            return;
    }
};
