import { RequestNetworkBase } from '@requestnetwork/request-client.js';
import { TheGraphDataAccess } from '@requestnetwork/thegraph-data-access';
import { Wallet } from 'ethers';
import { IpfsStorage, EthereumStorageEthers } from '@requestnetwork/ethereum-storage';

const signer = Wallet.createRandom();
const storage = new EthereumStorageEthers({
  ipfsStorage: new IpfsStorage({}),
  signer,
  network: 'private',
});
const dataAccess = new TheGraphDataAccess({
  graphql: { url: 'http://localhost:8000/subgraphs/name/RequestNetwork/request-storage' },
  network: 'private',
  storage,
});
const rn = new RequestNetworkBase({ dataAccess });

// const {requestId} = await rn.createRequest(...)

// const request = await rn.fromRequestId(
//   '01123c33c9654c38e5c015de57164d5d26f70bcc53ffe051a0b85e1d8b1d0b07ea',
// );

// // Cannot modify request
// await request.accept(...)
