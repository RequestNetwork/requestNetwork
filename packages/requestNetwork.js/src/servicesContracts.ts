import requestArtifacts from 'requestnetworkartifacts';

// services
import RequestERC20Service from './servicesContracts/requestERC20-service';
import RequestEthereumService from './servicesContracts/requestEthereum-service';

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
        case 'RequestERC20':
            return new RequestERC20Service();
        case 'RequestEthereum':
            return new RequestEthereumService();
        default:
            return;
    }
};
