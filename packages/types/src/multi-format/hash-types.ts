import { EnumToType } from '../shared';

/** Hash */
export interface IHash {
  // type of the hash
  type: TYPE;
  // the hash itself
  value: string;
}

export const TYPE = {
  KECCAK256: 'keccak256',
} as const;

/** Supported hash types */
export type TYPE = EnumToType<typeof TYPE>;
