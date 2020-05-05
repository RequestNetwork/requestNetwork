import GroupMultiFormat from '../group-multi-format';

import EthereumAddressFormat from './ethereum-address-format';
import EthereumSmartContractFormat from './ethereum-smartcontract-format';

// group all the multi-format concerning identities
const group = new GroupMultiFormat([
  new EthereumAddressFormat(),
  new EthereumSmartContractFormat(),
]);
export default group;
