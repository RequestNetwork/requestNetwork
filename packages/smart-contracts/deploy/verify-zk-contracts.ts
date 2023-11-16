import { verifyContractByName } from './utils';

// An example of a basic deploy script
// It will deploy a Greeter contract to selected network
// as well as verify it on Block Explorer if possible for the network
export default async function () {
  await verifyContractByName('ERC20FeeProxy', '0xb4E10de047b72Af2a44F64892419d248d58d9dF5');
  await verifyContractByName('EthereumFeeProxy', '0x0de6a1FB56a141086E0192269399af8b8a9e334A');
}
