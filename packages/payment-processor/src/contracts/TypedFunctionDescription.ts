import { FunctionDescription } from 'ethers/utils';

/**
 * Typescript-documented FunctionDescription
 */
export interface ITypedFunctionDescription<T extends Pick<FunctionDescription, 'encode'>>
  extends FunctionDescription {
  encode: T['encode'];
}
