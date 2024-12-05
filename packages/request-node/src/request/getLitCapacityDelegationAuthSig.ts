import { Wallet, providers } from 'ethers';
import { LitNodeClientNodeJs } from '@lit-protocol/lit-node-client';
import { LogTypes } from '@requestnetwork/types';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as config from '../config';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { utils } from 'ethers';
import { LIT_NETWORKS_KEYS } from '@lit-protocol/types';
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
        new providers.JsonRpcProvider(config.getLitProtocolRPC()),
      );
      let tokenId = '0';
      if (config.getLitProtocolNetwork() === 'datil-dev') {
        tokenId = '0';
      } else {
        const litContractClient = new LitContracts({
          signer: ethersSigner,
          network: config.getLitProtocolNetwork() as LIT_NETWORKS_KEYS,
        });
        await litContractClient.connect();

        const existingTokens: { tokenId: string }[] =
          await litContractClient.rateLimitNftContractUtils.read.getTokensByOwnerAddress(
            await ethersSigner.getAddress(),
          );

        if (existingTokens.length === 0) {
          serverResponse.status(StatusCodes.UNPROCESSABLE_ENTITY).send('No existing tokens');
          return;
        }
        tokenId = `${existingTokens[existingTokens.length - 1].tokenId}`;
      }

      const litNodeClient = new LitNodeClientNodeJs({
        litNetwork: config.getLitProtocolNetwork() as LIT_NETWORKS_KEYS,
        debug: false,
      });
      await litNodeClient.connect();

      const { capacityDelegationAuthSig } = await litNodeClient.createCapacityDelegationAuthSig({
        capacityTokenId: tokenId,
        dAppOwnerWallet: ethersSigner,
        delegateeAddresses: [`${delegateeAddress}`],
        uses: `${config.getLitProtocolCapacityCreditsUsage()}`,
        expiration: new Date(
          Date.now() + 1000 * 60 * config.getLitProtocolCapacityCreditsExpirationInSeconds(),
        ).toISOString(), // 1 hour
      });

      serverResponse.status(StatusCodes.OK).send(capacityDelegationAuthSig);
    } catch (e) {
      this.logger.error(`GetLitCapacityDelegationAuthSigHandler error: ${e}`);

      serverResponse.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Internal Server Error');
    }
  }
}
