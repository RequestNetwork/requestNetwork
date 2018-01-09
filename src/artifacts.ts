import { InterfaceArtifact } from './types';

const requestCoreArtifact = require('./artifacts/RequestCore.json');
const requestEthereumArtifact = require('./artifacts/RequestEthereum.json');
const requestSynchroneExtensionEscrowArtifact = require('./artifacts/RequestSynchroneExtensionEscrow.json');

export default {
    requestCoreArtifact: requestCoreArtifact as any as InterfaceArtifact,
    requestEthereumArtifact: requestEthereumArtifact as any as InterfaceArtifact,
    requestSynchroneExtensionEscrowArtifact: requestSynchroneExtensionEscrowArtifact as any as InterfaceArtifact,
};
