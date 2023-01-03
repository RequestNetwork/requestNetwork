import { MultiFormatTypes } from '@requestnetwork/types';
import {
  generate32BufferKey,
  generate8randomBytes,
  last20bytesOfNormalizedKeccak256Hash,
  normalize,
  normalizeKeccak256Hash,
} from '../src';

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('Utils/crypto', () => {
  it('can normalizeKeccak256Hash', () => {
    const arbitraryObject = {
      param1: 'valC',
      param2: 'valB',
      param3: 'valA',
    };
    // 'normalizeKeccak256Hash(arbitraryObject) error'
    expect(normalizeKeccak256Hash(arbitraryObject)).toEqual({
      type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
      value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
    });
  });

  it('can normalizeKeccak256Hash with two same object with different order', () => {
    const arbitraryObject = {
      param1: 'valC',
      param2: 'valB',
      param3: 'valA',
    };

    /* eslint-disable  */
    const arbitraryObjectSame = {
      param1: 'valC',
      param3: 'valA',
      param2: 'valB',
    };
    /* eslint-enable  */
    // 'normalizeKeccak256Hash(arbitraryObject) error'
    expect(normalizeKeccak256Hash(arbitraryObject)).toEqual({
      type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
      value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
    });
    // 'normalizeKeccak256Hash(arbitraryObjectSame) error'
    expect(normalizeKeccak256Hash(arbitraryObjectSame)).toEqual({
      type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
      value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
    });
  });

  it('can normalizeKeccak256Hash with two same nested objects with different', () => {
    const arbitraryObject = {
      param1: 'valC',
      param2: {
        parama: {
          parami: 'val',
          paramj: 'val',
          paramk: 'val',
        },
        paramb: 'valB',
      },
      param3: 'valA',
    };

    /* eslint-disable  */
    const arbitraryObjectSame = {
      param1: 'valC',
      param3: 'valA',
      param2: {
        paramb: 'valB',
        parama: {
          paramj: 'val',
          parami: 'val',
          paramk: 'val',
        },
      },
    };
    /* eslint-enable  */
    // 'normalizeKeccak256Hash(arbitraryObject) error'
    expect(normalizeKeccak256Hash(arbitraryObject)).toEqual({
      type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
      value: '0x7c36b5b8c7c5e787838a8ad5b083f3c9326bf364aa9e35691140f15c9a94f786',
    });
    // 'normalizeKeccak256Hash(arbitraryObjectSame) error'
    expect(normalizeKeccak256Hash(arbitraryObjectSame)).toEqual({
      type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
      value: '0x7c36b5b8c7c5e787838a8ad5b083f3c9326bf364aa9e35691140f15c9a94f786',
    });
  });

  it('can normalize integer, null, string, undefined', () => {
    expect(normalize('TesT')).toBe('"test"');
    // eslint-disable-next-line no-magic-numbers
    expect(normalize(12345)).toBe('12345');
    expect(normalize(null)).toBe('null');
    expect(normalize(undefined)).toBe('undefined');
  });

  it('can generate32BufferKey()', async () => {
    const randomKey = await generate32BufferKey();
    // 'random32Bytes() error'
    expect(Buffer.from(randomKey, 'base64').length).toBe(32);
  });

  it('can last20bytesOfNormalizedKeccak256Hash', () => {
    const arbitraryObject = {
      param1: 'valC',
      param2: 'valB',
      param3: 'valA',
    };
    expect(last20bytesOfNormalizedKeccak256Hash(arbitraryObject)).toEqual(
      '0xd6088568e24275a6cfbe9e80f4c2f42a4308f907',
    );
  });

  /* eslint-disable @typescript-eslint/no-unused-expressions */
  /* eslint-disable no-magic-numbers */
  describe('generate8randomBytes', () => {
    it('generates a 16 characters long string', async () => {
      // Do it 20 times because it's random. It's ok, it takes a few milliseconds
      for (let i = 0; i < 100; i++) {
        expect((await generate8randomBytes()).length).toBe(16);
      }
    });

    it('generates a 16 character of hexademical number', async () => {
      // Regex for "at least 16 hexadecimal numbers". Used to validate the salt
      const eightHexRegex = /[0-9a-f]{16}/;

      // Do it 20 times because it's random. It's ok, it takes a few milliseconds
      for (let i = 0; i < 100; i++) {
        expect(eightHexRegex.test(await generate8randomBytes())).toBe(true);
      }
    });

    it('generates unique strings', async () => {
      const first = await generate8randomBytes();
      const second = await generate8randomBytes();
      expect(first).not.toBe(second);
    });
  });
});
