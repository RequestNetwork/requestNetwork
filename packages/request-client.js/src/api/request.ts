import { EventEmitter } from 'events';

import { DeclarativePaymentNetwork as PaymentNetworkDeclarative } from '@requestnetwork/payment-detection';
import { IdentityTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import * as Types from '../types';
import ContentDataExtension from './content-data-extension';
import { currencyToString } from './currency';
import localUtils from './utils';

/**
 * Class representing a request.
 * Instances of this class can be accepted, paid, refunded, etc.
 * Use the member function `getData` to access the properties of the Request.
 *
 * Requests should be created with `RequestNetwork.createRequest()`.
 */
export default class Request {
  /**
   * Unique ID of the request
   */
  public readonly requestId: RequestLogicTypes.RequestId;

  private requestLogic: RequestLogicTypes.IRequestLogic;
  private paymentNetwork: PaymentTypes.IPaymentNetwork | null = null;
  private contentDataExtension: ContentDataExtension | null;
  private emitter: EventEmitter;

  /**
   * true if the creation emitted an event 'error'
   */
  private confirmationErrorOccurredAtCreation: boolean = false;

  /**
   * Data of the request (see request-logic)
   */
  private requestData: RequestLogicTypes.IRequest | null = null;

  /**
   * Pending data of the request (see request-logic)
   */
  private pendingData: RequestLogicTypes.IPendingRequest | null = null;

  /**
   * Content data parsed from the extensions data
   */
  private contentData: any | null = null;

  /**
   * Meta data of the request (e.g: where the data have been retrieved from)
   */
  private requestMeta: RequestLogicTypes.IReturnMeta | null = null;

  /**
   * Balance and payments/refund events
   */
  private balance: PaymentTypes.IBalanceWithEvents | null = null;

  /**
   * if true, skip the payment detection
   */
  private skipPaymentDetection: boolean = false;

  /**
   * Creates an instance of Request
   *
   * @param requestLogic Instance of the request-logic layer
   * @param requestId ID of the Request
   * @param paymentNetwork Instance of a payment network to manage the request
   * @param contentDataManager Instance of content data manager
   * @param requestLogicCreateResult return from the first request creation (optimization)
   * @param options options
   */
  constructor(
    requestId: RequestLogicTypes.RequestId,
    requestLogic: RequestLogicTypes.IRequestLogic,
    options?: {
      paymentNetwork?: PaymentTypes.IPaymentNetwork | null;
      contentDataExtension?: ContentDataExtension | null;
      requestLogicCreateResult?: RequestLogicTypes.IReturnCreateRequest;
      skipPaymentDetection?: boolean;
    },
  ) {
    this.requestLogic = requestLogic;
    this.requestId = requestId;
    this.contentDataExtension = options?.contentDataExtension || null;
    this.paymentNetwork = options?.paymentNetwork || null;
    this.emitter = new EventEmitter();
    this.skipPaymentDetection = options?.skipPaymentDetection || false;

    if (options && options.requestLogicCreateResult) {
      options.requestLogicCreateResult
        .on('confirmed', async () => {
          this.emitter.emit('confirmed', await this.refresh());
        })
        .on('error', error => {
          this.confirmationErrorOccurredAtCreation = true;
          this.emitter.emit('error', error);
        });
    }
  }

  /**
   * Listen the confirmation of the creation
   *
   * @param type only "confirmed" event for now
   * @param callback callback to call when confirmed event is risen
   * @returns this
   */
  public on<K extends keyof Types.IRequestEvents>(
    event: K,
    listener: Types.IRequestEvents[K],
  ): this {
    this.emitter.on(event, listener);
    return this;
  }

  /**
   * Wait for the confirmation
   *
   * @returns the request data
   */
  public waitForConfirmation(): Promise<Types.IRequestDataWithEvents> {
    return new Promise((resolve, reject): any => {
      this.on('confirmed', resolve);
      this.on('error', reject);
    });
  }

  /**
   * Accepts a request
   *
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @param refundInformation Refund information to add (any because it is specific to the payment network used by the request)
   * @returns The updated request
   */
  public async accept(
    signerIdentity: IdentityTypes.IIdentity,
    refundInformation?: any,
  ): Promise<Types.IRequestDataWithEvents> {
    const extensionsData: any[] = [];
    if (refundInformation) {
      if (!this.paymentNetwork) {
        throw new Error('Cannot add refund information without payment network');
      }
      extensionsData.push(
        this.paymentNetwork.createExtensionsDataForAddRefundInformation(refundInformation),
      );
    }
    const parameters: RequestLogicTypes.IAcceptParameters = {
      extensionsData,
      requestId: this.requestId,
    };

    const acceptResult = await this.requestLogic.acceptRequest(parameters, signerIdentity, true);

    // refresh the local request data
    const requestData = await this.refresh();

    acceptResult
      .on('confirmed', async () => {
        requestData.emit('confirmed', await this.refresh());
      })
      .on('error', error => {
        this.emitter.emit('error', error);
      });

    return requestData;
  }

  /**
   * Cancels a request
   *
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @param refundInformation refund information to add (any because it is specific to the payment network used by the request)
   * @returns The updated request
   */
  public async cancel(
    signerIdentity: IdentityTypes.IIdentity,
    refundInformation?: any,
  ): Promise<Types.IRequestDataWithEvents> {
    const extensionsData: any[] = [];
    if (refundInformation) {
      if (!this.paymentNetwork) {
        throw new Error('Cannot add refund information without payment network');
      }
      extensionsData.push(
        this.paymentNetwork.createExtensionsDataForAddRefundInformation(refundInformation),
      );
    }

    const parameters: RequestLogicTypes.ICancelParameters = {
      extensionsData,
      requestId: this.requestId,
    };

    const cancelResult = await this.requestLogic.cancelRequest(parameters, signerIdentity, true);

    // refresh the local request data
    const requestData = await this.refresh();

    cancelResult
      .on('confirmed', async () => {
        requestData.emit('confirmed', await this.refresh());
      })
      .on('error', error => {
        this.emitter.emit('error', error);
      });

    return requestData;
  }

  /**
   * Increases the expected amount of the request.
   *
   * @param deltaAmount Amount by which to increase the expected amount
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @param refundInformation Refund information to add (any because it is specific to the payment network used by the request)
   * @returns The updated request
   */
  public async increaseExpectedAmountRequest(
    deltaAmount: RequestLogicTypes.Amount,
    signerIdentity: IdentityTypes.IIdentity,
    refundInformation?: any,
  ): Promise<Types.IRequestDataWithEvents> {
    const extensionsData: any[] = [];
    if (refundInformation) {
      if (!this.paymentNetwork) {
        throw new Error('Cannot add refund information without payment network');
      }
      extensionsData.push(
        this.paymentNetwork.createExtensionsDataForAddRefundInformation(refundInformation),
      );
    }
    const parameters: RequestLogicTypes.IIncreaseExpectedAmountParameters = {
      deltaAmount,
      extensionsData,
      requestId: this.requestId,
    };

    const increaseExpectedResult = await this.requestLogic.increaseExpectedAmountRequest(
      parameters,
      signerIdentity,
      true,
    );

    // refresh the local request data
    const requestData = await this.refresh();

    increaseExpectedResult
      .on('confirmed', async () => {
        requestData.emit('confirmed', await this.refresh());
      })
      .on('error', error => {
        this.emitter.emit('error', error);
      });

    return requestData;
  }

  /**
   * Reduces the expected amount of the request. This can be called by the payee e.g. to apply discounts or special offers.
   *
   * @param deltaAmount Amount by which to reduce the expected amount
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @param paymentInformation Payment information to add (any because it is specific to the payment network used by the request)
   * @returns The updated request
   */
  public async reduceExpectedAmountRequest(
    deltaAmount: RequestLogicTypes.Amount,
    signerIdentity: IdentityTypes.IIdentity,
    paymentInformation?: any,
  ): Promise<Types.IRequestDataWithEvents> {
    const extensionsData: any[] = [];
    if (paymentInformation) {
      if (!this.paymentNetwork) {
        throw new Error('Cannot add payment information without payment network');
      }
      extensionsData.push(
        this.paymentNetwork.createExtensionsDataForAddPaymentInformation(paymentInformation),
      );
    }

    const parameters: RequestLogicTypes.IReduceExpectedAmountParameters = {
      deltaAmount,
      extensionsData,
      requestId: this.requestId,
    };

    const reduceExpectedResult = await this.requestLogic.reduceExpectedAmountRequest(
      parameters,
      signerIdentity,
      true,
    );

    // refresh the local request data
    const requestData = await this.refresh();

    reduceExpectedResult
      .on('confirmed', async () => {
        requestData.emit('confirmed', await this.refresh());
      })
      .on('error', error => {
        this.emitter.emit('error', error);
      });

    return requestData;
  }

  /**
   * Adds payment information
   *
   * @param paymentInformation Payment information to add (any because it is specific to the payment network used by the request)
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @returns The updated request
   */
  public async addPaymentInformation(
    paymentInformation: any,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<Types.IRequestDataWithEvents> {
    const extensionsData: any[] = [];

    if (!this.paymentNetwork) {
      throw new Error('Cannot add payment information without payment network');
    }

    extensionsData.push(
      this.paymentNetwork.createExtensionsDataForAddPaymentInformation(paymentInformation),
    );

    const parameters: RequestLogicTypes.IAddExtensionsDataParameters = {
      extensionsData,
      requestId: this.requestId,
    };

    const addExtensionResult = await this.requestLogic.addExtensionsDataRequest(
      parameters,
      signerIdentity,
      true,
    );

    // refresh the local request data
    const requestData = await this.refresh();

    addExtensionResult
      .on('confirmed', async () => {
        requestData.emit('confirmed', await this.refresh());
      })
      .on('error', error => {
        this.emitter.emit('error', error);
      });

    return requestData;
  }

  /**
   * Adds refund information
   *
   * @param refundInformation Refund information to add (any because it is specific to the payment network used by the request)
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @returns The updated request
   */
  public async addRefundInformation(
    refundInformation: any,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<Types.IRequestDataWithEvents> {
    const extensionsData: any[] = [];

    if (!this.paymentNetwork) {
      throw new Error('Cannot add refund information without payment network');
    }

    extensionsData.push(
      this.paymentNetwork.createExtensionsDataForAddRefundInformation(refundInformation),
    );

    const parameters: RequestLogicTypes.IAddExtensionsDataParameters = {
      extensionsData,
      requestId: this.requestId,
    };

    const addExtensionResult = await this.requestLogic.addExtensionsDataRequest(
      parameters,
      signerIdentity,
      true,
    );

    // refresh the local request data
    const requestData = await this.refresh();

    addExtensionResult
      .on('confirmed', async () => {
        requestData.emit('confirmed', await this.refresh());
      })
      .on('error', error => {
        this.emitter.emit('error', error);
      });

    return requestData;
  }

  /**
   * Declare a payment is sent for the declarative payment network
   *
   * @param amount Amount sent
   * @param note Note from payer about the sent payment
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @returns The updated request
   */
  public async declareSentPayment(
    amount: RequestLogicTypes.Amount,
    note: string,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<Types.IRequestDataWithEvents> {
    const extensionsData: any[] = [];

    if (!this.paymentNetwork) {
      throw new Error('Cannot declare sent payment without payment network');
    }

    // We need to cast the object since IPaymentNetwork doesn't implement createExtensionsDataForDeclareSentPayment
    const declarativePaymentNetwork: PaymentNetworkDeclarative = this
      .paymentNetwork as PaymentNetworkDeclarative;

    if (!declarativePaymentNetwork.createExtensionsDataForDeclareSentPayment) {
      throw new Error('Cannot declare sent payment without declarative payment network');
    }

    extensionsData.push(
      declarativePaymentNetwork.createExtensionsDataForDeclareSentPayment({ amount, note }),
    );

    const parameters: RequestLogicTypes.IAddExtensionsDataParameters = {
      extensionsData,
      requestId: this.requestId,
    };

    const addExtensionResult = await this.requestLogic.addExtensionsDataRequest(
      parameters,
      signerIdentity,
      true,
    );

    // refresh the local request data
    const requestData = await this.refresh();

    addExtensionResult
      .on('confirmed', async () => {
        requestData.emit('confirmed', await this.refresh());
      })
      .on('error', error => {
        this.emitter.emit('error', error);
      });

    return requestData;
  }

  /**
   * Declare a refund is sent for the declarative payment network
   *
   * @param amount Amount sent
   * @param note Note from payee about the sent refund
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @returns The updated request
   */
  public async declareSentRefund(
    amount: RequestLogicTypes.Amount,
    note: string,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<Types.IRequestDataWithEvents> {
    const extensionsData: any[] = [];

    if (!this.paymentNetwork) {
      throw new Error('Cannot declare sent refund without payment network');
    }

    // We need to cast the object since IPaymentNetwork doesn't implement createExtensionsDataForDeclareSentRefund
    const declarativePaymentNetwork: PaymentNetworkDeclarative = this
      .paymentNetwork as PaymentNetworkDeclarative;

    if (!declarativePaymentNetwork.createExtensionsDataForDeclareSentRefund) {
      throw new Error('Cannot declare sent refund without declarative payment network');
    }

    extensionsData.push(
      declarativePaymentNetwork.createExtensionsDataForDeclareSentRefund({
        amount,
        note,
      }),
    );

    const parameters: RequestLogicTypes.IAddExtensionsDataParameters = {
      extensionsData,
      requestId: this.requestId,
    };

    const addExtensionResult = await this.requestLogic.addExtensionsDataRequest(
      parameters,
      signerIdentity,
      true,
    );

    // refresh the local request data
    const requestData = await this.refresh();

    addExtensionResult
      .on('confirmed', async () => {
        requestData.emit('confirmed', await this.refresh());
      })
      .on('error', error => {
        this.emitter.emit('error', error);
      });

    return requestData;
  }

  /**
   * Declare a payment is received for the declarative payment network
   *
   * @param amount Amount received
   * @param note Note from payee about the received payment
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @returns The updated request
   */
  public async declareReceivedPayment(
    amount: RequestLogicTypes.Amount,
    note: string,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<Types.IRequestDataWithEvents> {
    const extensionsData: any[] = [];

    if (!this.paymentNetwork) {
      throw new Error('Cannot declare received payment without payment network');
    }

    // We need to cast the object since IPaymentNetwork doesn't implement createExtensionsDataForDeclareReceivedPayment
    const declarativePaymentNetwork: PaymentNetworkDeclarative = this
      .paymentNetwork as PaymentNetworkDeclarative;

    if (!declarativePaymentNetwork.createExtensionsDataForDeclareReceivedPayment) {
      throw new Error('Cannot declare received payment without declarative payment network');
    }

    extensionsData.push(
      declarativePaymentNetwork.createExtensionsDataForDeclareReceivedPayment({
        amount,
        note,
      }),
    );

    const parameters: RequestLogicTypes.IAddExtensionsDataParameters = {
      extensionsData,
      requestId: this.requestId,
    };

    const addExtensionResult = await this.requestLogic.addExtensionsDataRequest(
      parameters,
      signerIdentity,
      true,
    );

    // refresh the local request data
    const requestData = await this.refresh();

    addExtensionResult
      .on('confirmed', async () => {
        requestData.emit('confirmed', await this.refresh());
      })
      .on('error', error => {
        this.emitter.emit('error', error);
      });

    return requestData;
  }

  /**
   * Declare a refund is received for the declarative payment network
   *
   * @param amount Amount received
   * @param note Note from payer about the received refund
   * @param signerIdentity Identity of the signer. The identity type must be supported by the signature provider.
   * @returns The updated request
   */
  public async declareReceivedRefund(
    amount: RequestLogicTypes.Amount,
    note: string,
    signerIdentity: IdentityTypes.IIdentity,
  ): Promise<Types.IRequestDataWithEvents> {
    const extensionsData: any[] = [];

    if (!this.paymentNetwork) {
      throw new Error('Cannot declare received refund without payment network');
    }

    // We need to cast the object since IPaymentNetwork doesn't implement createExtensionsDataForDeclareReceivedRefund
    const declarativePaymentNetwork: PaymentNetworkDeclarative = this
      .paymentNetwork as PaymentNetworkDeclarative;

    if (!declarativePaymentNetwork.createExtensionsDataForDeclareReceivedRefund) {
      throw new Error('Cannot declare received refund without declarative payment network');
    }

    extensionsData.push(
      declarativePaymentNetwork.createExtensionsDataForDeclareReceivedRefund({
        amount,
        note,
      }),
    );

    const parameters: RequestLogicTypes.IAddExtensionsDataParameters = {
      extensionsData,
      requestId: this.requestId,
    };

    const addExtensionResult = await this.requestLogic.addExtensionsDataRequest(
      parameters,
      signerIdentity,
      true,
    );

    // refresh the local request data
    const requestData = await this.refresh();

    addExtensionResult
      .on('confirmed', async () => {
        requestData.emit('confirmed', await this.refresh());
      })
      .on('error', error => {
        this.emitter.emit('error', error);
      });

    return requestData;
  }

  /**
   * Gets the request data
   *
   * @returns The updated request data
   */
  public getData(): Types.IRequestDataWithEvents {
    if (this.confirmationErrorOccurredAtCreation) {
      throw Error('request confirmation failed');
    }

    let requestData: RequestLogicTypes.IRequest = Utils.deepCopy(this.requestData);

    let pending = Utils.deepCopy(this.pendingData);
    if (!requestData) {
      requestData = pending;
      requestData.state = RequestLogicTypes.STATE.PENDING;
      pending = { state: this.pendingData!.state };
    }

    return Object.assign(new EventEmitter(), {
      ...requestData,
      balance: this.balance,
      contentData: this.contentData,
      currency: requestData.currency ? currencyToString(requestData.currency) : 'unknown',
      currencyInfo: requestData.currency,
      meta: this.requestMeta,
      pending,
    });
  }

  /**
   * Refresh the request data and balance from the network (check if new events happened - e.g: accept, payments etc..) and return these data
   *
   * @param requestAndMeta return from getRequestFromId to avoid asking twice
   * @returns Refreshed request data
   */
  public async refresh(
    requestAndMeta?: RequestLogicTypes.IReturnGetRequestFromId,
  ): Promise<Types.IRequestDataWithEvents> {
    if (this.confirmationErrorOccurredAtCreation) {
      throw Error('request confirmation failed');
    }
    if (!requestAndMeta) {
      requestAndMeta = await this.requestLogic.getRequestFromId(this.requestId);
    }

    if (!requestAndMeta.result.request && !requestAndMeta.result.pending) {
      throw new Error(
        `No request found for the id: ${this.requestId} - ${localUtils.formatGetRequestFromIdError(
          requestAndMeta,
        )}`,
      );
    }

    if (this.contentDataExtension) {
      // TODO: PROT-1131 - add a pending content
      this.contentData = await this.contentDataExtension.getContent(
        requestAndMeta.result.request || requestAndMeta.result.pending,
      );
    }

    this.requestData = requestAndMeta.result.request;
    this.pendingData = requestAndMeta.result.pending;
    this.requestMeta = requestAndMeta.meta;

    if (!this.skipPaymentDetection) {
      // let's refresh the balance
      await this.refreshBalance();
    }

    return this.getData();
  }

  /**
   * Refresh only the balance of the request and return it
   *
   * @returns return the balance
   */
  public async refreshBalance(): Promise<Types.Payment.IBalanceWithEvents<any> | null> {
    // TODO: PROT-1131 - add a pending balance
    this.balance =
      this.paymentNetwork && this.requestData
        ? await this.paymentNetwork.getBalance(this.requestData)
        : this.balance;

    return this.balance;
  }

  /**
   * Enables the payment detection
   */
  public enablePaymentDetection(): void {
    this.skipPaymentDetection = false;
  }

  /**
   * Disables the payment detection
   */
  public disablePaymentDetection(): void {
    this.skipPaymentDetection = true;
  }
}
