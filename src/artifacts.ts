// import * as RequestEthereumArtifact from './artifacts/RequestEthereum.json';
const RequestCoreArtifact = require('./artifacts/RequestCore.json');
const RequestEthereumArtifact = require('./artifacts/RequestEthereum.json');
const RequestSynchroneExtensionEscrowArtifact = require('./artifacts/RequestSynchroneExtensionEscrow.json');

import { Artifact } from './types';

export const artifacts = {
    RequestCoreArtifact: RequestCoreArtifact as any as Artifact,
    RequestEthereumArtifact: RequestEthereumArtifact as any as Artifact,
    RequestSynchroneExtensionEscrowArtifact: RequestSynchroneExtensionEscrowArtifact as any as Artifact,
};