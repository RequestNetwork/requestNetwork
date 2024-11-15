import { Wallet, providers } from 'ethers';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitNetwork } from '@lit-protocol/constants';
import { LIT_RPC } from '@lit-protocol/constants';
import { LogTypes } from '@requestnetwork/types';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as config from '../config';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { utils } from 'ethers';

/**
 * Handles getLitCapacityDelegationAuthSigHandler.
 *
 * @param clientRequest http client request object
 * @param serverResponse http server response object
 */
export default class GetLitCapacityDelegationAuthSigHandler {
  constructor(private logger: LogTypes.ILogger) {
    this.handler = this.handler.bind(this);
  }
  async handler(clientRequest: Request, serverResponse: Response): Promise<void> {
    const { delegateeAddress } = clientRequest.query;
    // Verifies if data sent from get request are correct
    // clientRequest.query is expected to contain the delegateeAddress
    if (!delegateeAddress || !utils.isAddress(delegateeAddress as string)) {
      serverResponse.status(StatusCodes.UNPROCESSABLE_ENTITY).send('Incorrect data');
      return;
    }

    try {
      const ethersSigner = Wallet.fromMnemonic(config.getMnemonic()).connect(
        new providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE),
      );

      const litContractClient = new LitContracts({
        signer: ethersSigner,
        network: LitNetwork.DatilTest,
      });
      await litContractClient.connect();

      const existingTokens: any[] =
        await litContractClient.rateLimitNftContractUtils.read.getTokensByOwnerAddress(
          await ethersSigner.getAddress(),
        );

      if (existingTokens.length === 0) {
        serverResponse.status(StatusCodes.UNPROCESSABLE_ENTITY).send('No existing tokens');
        return;
      }

      const litNodeClient = new LitNodeClient({
        litNetwork: LitNetwork.DatilTest,
        debug: false,
      });
      await litNodeClient.connect();

      const { capacityDelegationAuthSig } = await litNodeClient.createCapacityDelegationAuthSig({
        capacityTokenId: existingTokens[existingTokens.length - 1].tokenId,
        dAppOwnerWallet: ethersSigner,
        delegateeAddresses: [delegateeAddress],
        uses: '1',
        expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
      });

      serverResponse.status(StatusCodes.OK).send(capacityDelegationAuthSig);
    } catch (e) {
      this.logger.error(`GetLitCapacityDelegationAuthSigHandler error: ${e}`);

      serverResponse.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
    }
  }
}
