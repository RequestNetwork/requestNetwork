import { MultiFormatGroup } from '../multi-format-group';
import { Keccak256MultiFormat } from './keccak256-format';

// group all the multi-format concerning the hashing
export const hashFormat = new MultiFormatGroup([new Keccak256MultiFormat()]);
