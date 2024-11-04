import { ethers } from 'ethers';
import { Types } from '@requestnetwork/request-client.js';
import { CurrencyTypes } from '@requestnetwork/types';

export const currencyAddress = '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'; // USDC
export const currencyAmount = ethers.utils.parseUnits('0.01', 6).toBigInt();
export const currentNetwork: CurrencyTypes.ChainName = 'optimism';
export const currentCurrenyType = Types.RequestLogic.CURRENCY.ERC20;
export const currentGateway = 'https://sepolia.gateway.request.network';
export const payee = '0xA4faFa5523F63EE58aE7b56ad8EB5a344A19F266'; // some random address
export const fee = '0';
export const contentData = {
  reason: 'Hinkal Test',
  dueDate: '2025.06.16',
};
