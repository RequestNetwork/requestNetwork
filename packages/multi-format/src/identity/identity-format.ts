import GroupMultiFormat from '../group-multi-format';

import EthereumAddressFormat from './ethereum-address-format';

// group all the multi-format concerning identities
const group = new GroupMultiFormat([new EthereumAddressFormat()]);
export default group;
