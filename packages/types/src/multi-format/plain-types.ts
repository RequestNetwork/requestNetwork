import { EnumToType } from '../shared';

/** Plain data */
export interface IPlainData {
  // type of the plain
  type: TYPE;
  // the plain data itself
  value: string;
}

export const TYPE = {
  PLAIN_TEXT: 'plain-text',
} as const;

/** Supported types */
export type TYPE = EnumToType<typeof TYPE>;
