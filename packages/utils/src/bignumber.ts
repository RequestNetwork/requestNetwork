/** Returns the minimum of two big numbers */
const minBigNumber = (a: number | string | bigint, b: number | string | bigint): bigint => {
  if (typeof a !== "bigint") a = BigInt(a);
  if (typeof b !== "bigint") b = BigInt(b);
  return a < b ? a : b;
}

/** Returns the maximum of two big numbers */
const maxBigNumber = (a: number | string | bigint, b: number | string | bigint): bigint => {
  if (typeof a !== "bigint") a = BigInt(a);
  if (typeof b !== "bigint") b = BigInt(b);
  return a > b ? a : b;
}

export { minBigNumber, maxBigNumber };
