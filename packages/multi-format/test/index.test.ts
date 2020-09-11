import { MultiFormatTypes } from '@requestnetwork/types';

import MultiFormat from '../src/index';

/* tslint:disable:no-unused-expression */
describe('Utils.multiFormat', () => {
  describe('serialize', () => {
    it('can serialize', () => {
      // 'serialize() error'
      expect(
        MultiFormat.serialize({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        }),
      ).toBe('01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907');
    });

    it('cannot serialize a hash with incorrect length', () => {
      // 'serialize() error'
      expect(() => {
        MultiFormat.serialize({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f90711',
        });
      }).toThrowError('No format found to serialize this object');
    });
  });

  describe('deserialize', () => {
    it('can deserialize', () => {
      const formatted = '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907';
      // 'deserialize(formatted) error'
      expect(MultiFormat.deserialize(formatted)).toEqual({
        type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
        value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
      });
    });

    it('should return false if an incorrect format hash is given to isDeserializableString', () => {
      // 'should throw with an incorrect prefix'
      expect(() => {
        MultiFormat.deserialize(
          'zzaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        );
      }).toThrowError('No format found to deserialize this string');

      // 'should throw with a shorter size'
      expect(() => {
        MultiFormat.deserialize('01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f9');
      }).toThrowError('No format found to deserialize this string');

      // 'should throw with a longer size'
      expect(() => {
        MultiFormat.deserialize(
          '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f90799',
        );
      }).toThrowError('No format found to deserialize this string');
    });
  });
});
