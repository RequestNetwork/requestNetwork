import { MultiFormatGroup } from '../multi-format-group';

import { EthereumAddressMultiFormat } from './ethereum-address-format';

// group all the multi-format concerning identities
export const identityFormat = new MultiFormatGroup([new EthereumAddressMultiFormat()]);
