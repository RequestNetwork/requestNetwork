---
title: Request Logic
keywords: [Request protocol, Request Logic, Extension, Advanced Logic, Signature]
description: Learn how to integrate Request network and its features.

---

This layer is responsible for the business logic of Request. This is where we define the data structure of a request.

This layer has three responsibilities:

- It defines the properties of the requests and the actions performed to them.
- It's responsible for the signature of the actions performed to ensure the request stakeholder identities.
- It manages extensions that can be created to extend the features of the Request Protocol through the Advanced Logic package.

[https://github.com/RequestNetwork/requestNetwork/tree/master/packages/request-logic](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/request-logic)

### Actions

Actions are the basic elements that compose a request. At this layer's point of view, a request is simply a list of different actions.

![](/img/RequestProtocol/2-RequestPresentation.jpg)
*Example of a request in Request Logic represented by a list of actions*

- The payee creates the request requesting 1 ETH to the payer
- The payer accepts the request
- The payer increases the expected amount of the request by 1 ETH (the expected amount of the request can only be increased by the payer and decreased by the payee)

Given the list of these actions, we can interpret the state of the request `0xaaa`, it's a request that has been accepted by the payer where he will have to pay 2 ETH to the payee.

Note that the request Id is determined by the hash of the `create` action. Therefore, this action doesn't specify the request Id since it doesn't exist yet. The update actions (`accept` and `increaseExpectedAmount`) specify the request Id in their data.

There are two kinds of action:

- Create: This action is not related to an existing request, it will create a new one
- Update: All other actions, it will update the state of an existing request

### Signature

In addition to providing the structure to form an action composing a request, the logic layer is also responsible for signing the action.

In order to abstract the signing process from the layer (and eventually be able to use it in other packages), the signing process is done through external packages named signature providers.

The protocol repository currently contains two signature provider packages:

- epk-signature ([https://github.com/RequestNetwork/requestNetwork/tree/master/packages/epk-signature](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/epk-signature))
- web3-signature ([https://github.com/RequestNetwork/requestNetwork/tree/master/packages/web3-signature](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/web3-signature))

Both packages use the Elliptic Curve Digital Signature Algorithm (ECDSA) used in Ethereum. web3-signature will connect to Metamask to ask users to sign request while for epk-signature, the private keys are clear and managed manually.

`web3-signature` provider should be used if you want to create a fully-decentralized solution where the users manage their own private key. `epk-signature` provider is adapted when you want to manage the private key for the users and have good flexibility to do it, it's never a good idea to let users handling plain private keys.

### Advanced Logic

Simplicity is one of the most important characteristics we want to achieve in the Protocol. This is why the actions available in Request Logic are the minimal set of actions needed for any kind of request for payment. In the same way, the basic request state is universally common to any request, every request has a payee (a recipient), a currency (what requested), an expected amount (how much requested) and a basic state (accepted, canceled). In order to enable more advanced features for the users, we conceived Advanced Logic.

Advanced Logic is a package that allows the user to define extensions that can be added to the request. An extension is an isolated context inside the request that contains his own actions and his own state. For example, the extension `content-data` allows the user to add any metadata to a request (e.g. the additional data needed for an invoice). The Advanced Logic layer is also where the payment networks allowing payment detection are implemented.

Similar to Request Logic, a specific extension can define different actions related to it. There is the Create action of the extension and eventually different update actions. The extension is initialized at the same time as the request and any action of the Request Logic can add extension data. There is a specific action, `AddExtensionData`, in Request Logic, only intended to add extension data to the request with no other side-effect.

![](/img/RequestProtocol/2-AdvancedRequestPresentation.jpg)
*Example of a request with extension data: the payee creates a request with content data and declarative payment information, the payer accepts the request and declares a sent payment in the same time, finally, the payee declares the received payment*

The specification for each extension can be found at this link: [https://github.com/RequestNetwork/requestNetwork/tree/master/packages/advanced-logic/specs](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/advanced-logic/specs)
