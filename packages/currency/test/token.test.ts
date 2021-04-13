/* eslint-disable no-magic-numbers */
import { RequestLogicTypes } from '@requestnetwork/types';
import { Token } from '../src';

describe('api/currency Token', () => {
  describe('Token.from()', () => {
    describe('mainnet', () => {
      it('ETH from ETH', () => {
        expect(Token.from('ETH')).toMatchObject({
          symbol: 'ETH',
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        });
      });

      it('DAI from DAI', () => {
        expect(Token.from('DAI')).toMatchObject({
          symbol: 'DAI',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          network: 'mainnet',
        });
        expect(Token.from('DAI').toString()).toEqual('DAI');
      });

      it('REQ from REQ', () => {
        expect(Token.from('REQ')).toMatchObject({
          symbol: 'REQ',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x8f8221aFbB33998d8584A2B05749bA73c37a938a',
          network: 'mainnet',
        });
      });

      it('MPH from MPH', () => {
        expect(Token.from('MPH')).toMatchObject({
          symbol: 'MPH',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x8888801af4d980682e47f1a9036e589479e835c5',
          network: 'mainnet',
        });
      });

      it('INDA from INDA', () => {
        expect(Token.from('INDA')).toMatchObject({
          symbol: 'INDA',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x433d86336dB759855A66cCAbe4338313a8A7fc77',
          network: 'mainnet',
        });
      });

      it('DAI from 0x6B175474E89094C44Da98b954EedeAC495271d0F', () => {
        expect(Token.from('0x6B175474E89094C44Da98b954EedeAC495271d0F')).toMatchObject({
          symbol: 'DAI',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          network: 'mainnet',
        });
      });

      it('EUR from EUR', () => {
        expect(Token.from('EUR')).toMatchObject({
          symbol: 'EUR',
          type: RequestLogicTypes.CURRENCY.ISO4217,
          value: 'EUR',
        });
      });
    });

    describe('rinkeby', () => {
      it('FAU from FAU', () => {
        expect(Token.from('FAU')).toMatchObject({
          symbol: 'FAU',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0xFab46E002BbF0b4509813474841E0716E6730136',
          network: 'rinkeby',
        });
        expect(Token.from('FAU').toString()).toEqual('FAU-rinkeby');
      });

      it('FAU from FAU-rinkeby', () => {
        expect(Token.from('FAU')).toMatchObject({
          symbol: 'FAU',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0xFab46E002BbF0b4509813474841E0716E6730136',
          network: 'rinkeby',
        });
      });

      it('CTBK from CTBK', () => {
        expect(Token.from('CTBK')).toMatchObject({
          symbol: 'CTBK',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x995d6A8C21F24be1Dd04E105DD0d83758343E258',
          network: 'rinkeby',
        });
      });
    });

    describe('errors', () => {
      it('Unsupported tokens should throw', () => {
        expect(() => Token.from('UNSUPPORTED')).toThrow(
          'The currency UNSUPPORTED does not exist or is not supported',
        );
      });
    });
  });
});
