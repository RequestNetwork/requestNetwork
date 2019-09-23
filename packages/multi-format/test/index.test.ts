import { expect } from 'chai';
import 'mocha';
import { MultiFormatTypes } from '@requestnetwork/types';

import MultiFormat from '../src/index';

/* tslint:disable:no-unused-expression */
describe('Utils.multiFormat', () => {
  describe('serialize', () => {
    it('can serialize', () => {
      expect(
        MultiFormat.serialize({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        }),
        'serialize() error',
      ).to.be.equal('01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907');
    });

    it('cannot serialize a hash with wrong length', () => {
      expect(() => {
        MultiFormat.serialize({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f90711',
        });
      }, 'serialize() error').to.throw('No format found to serialize this object');
    });
  });

  describe('deserialize', () => {
    it('can deserialize', () => {
      const formatted = '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907';
      expect(MultiFormat.deserialize(formatted), 'deserialize(formatted) error').to.be.deep.equal({
        type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
        value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
      });
    });

    it('should return false if a wrong formatted hash is given to isDeserializableString', () => {
      expect(() => {
        MultiFormat.deserialize(
          'zzaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        );
      }, 'should throw with a wrong prefix').to.throw('No format found to deserialize this string');

      expect(() => {
        MultiFormat.deserialize('01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f9');
      }, 'should throw with a shorter size').to.throw('No format found to deserialize this string');

      expect(() => {
        MultiFormat.deserialize(
          '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f90799',
        );
      }, 'should throw with a longer size').to.throw('No format found to deserialize this string');
    });
  });
});
