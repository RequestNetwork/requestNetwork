/**
 * A collection of functions about randomness generation
 */
export default {
  generate8randomBytes,
};

// eslint-disable-next-line spellcheck/spell-checker
/**
 * Generate 8 random bytes and return as a hexadecimal string.
 * Used for salt in ETH input data.
 * Example: 'ea3bc7caf64110ca'
 *
 * @returns a string of 8 random bytes
 */
function generate8randomBytes(): string {
  const base16 = 16;

  const generate4randomBytes = (): string => {
    // A 4 byte random integer
    const randomInteger = Math.floor(Math.random() * Math.pow(2, 4 * 8));

    // Convert to hexadecimal and padded with 0
    return randomInteger.toString(base16).padStart(8, '0');
  };

  // Do it in 2 passes because an integer doesn't have enough bits
  const high = generate4randomBytes();
  const low = generate4randomBytes();
  return high + low;
}
