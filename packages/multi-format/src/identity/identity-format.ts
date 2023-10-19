import GroupMultiFormat from '../group-multi-format.js';

import EthereumAddressFormat from './ethereum-address-format.js';

// group all the multi-format concerning identities
const group = new GroupMultiFormat([new EthereumAddressFormat()]);
export default group;
