import { ethers } from 'ethers';
import { Types } from '@requestnetwork/request-client.js';
import { CurrencyTypes } from '@requestnetwork/types';

export const currencyAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC
export const currencyAmount = ethers.utils.parseUnits('0.0001', 6).toBigInt();
export const currentNetwork: CurrencyTypes.ChainName = 'base';
export const currentCurrenyType = Types.RequestLogic.CURRENCY.ERC20;
export const currentGateway = 'https://sepolia.gateway.request.network';
export const payee = '0xA4faFa5523F63EE58aE7b56ad8EB5a344A19F266'; // some random address
export const fee = '0';
export const contentData = {
  reason: 'Hinkal Test',
  dueDate: '2025.06.16',
};
