# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.7.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.6.0...@requestnetwork/request-client.js@0.7.0) (2019-09-16)


### Features

* **data-access:** get channels from multiple topics ([#527](https://github.com/RequestNetwork/requestNetwork/issues/527)) ([bdebab7](https://github.com/RequestNetwork/requestNetwork/commit/bdebab7))
* **transaction-manager:** add transaction to an existing encrypted channel ([#524](https://github.com/RequestNetwork/requestNetwork/issues/524)) ([027a0f5](https://github.com/RequestNetwork/requestNetwork/commit/027a0f5))
* get requests by multiple topics or multiple identities ([#530](https://github.com/RequestNetwork/requestNetwork/issues/530)) ([8fe7d30](https://github.com/RequestNetwork/requestNetwork/commit/8fe7d30))





# [0.6.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.5.0...@requestnetwork/request-client.js@0.6.0) (2019-09-05)


### Features

* request logic version 2.0.1: compute the request id takes in account the signature ([#511](https://github.com/RequestNetwork/requestNetwork/issues/511)) ([14643d8](https://github.com/RequestNetwork/requestNetwork/commit/14643d8))
* Transaction-manager: ignore the wrong transactions of channels ([#514](https://github.com/RequestNetwork/requestNetwork/issues/514)) ([4ec82c6](https://github.com/RequestNetwork/requestNetwork/commit/4ec82c6))






# [0.5.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.4.0...@requestnetwork/request-client.js@0.5.0) (2019-08-19)


### Features

* add an option for the Node to define the timeout when calling persistTransaction ([#485](https://github.com/RequestNetwork/requestNetwork/issues/485)) ([176228c](https://github.com/RequestNetwork/requestNetwork/commit/176228c))
* Request logic: create encrypted request ([#496](https://github.com/RequestNetwork/requestNetwork/issues/496)) ([9f1ebe6](https://github.com/RequestNetwork/requestNetwork/commit/9f1ebe6))






# [0.3.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.1.1-alpha.4...@requestnetwork/request-client.js@0.3.0) (2019-07-24)


### Bug Fixes

* fix bitcoin providers for edge cases (many transactions on one address, reentrant transaction..) ([#453](https://github.com/RequestNetwork/requestNetwork/issues/453)) ([9246116](https://github.com/RequestNetwork/requestNetwork/commit/9246116))
* remove unecessary await on getData ([#332](https://github.com/RequestNetwork/requestNetwork/issues/332)) ([232f1e1](https://github.com/RequestNetwork/requestNetwork/commit/232f1e1))
* request-client.js readme not updated ([#364](https://github.com/RequestNetwork/requestNetwork/issues/364)) ([379089e](https://github.com/RequestNetwork/requestNetwork/commit/379089e))
* Wrong parameter name for createRequest function in client-request.js README ([#362](https://github.com/RequestNetwork/requestNetwork/issues/362)) ([2912e77](https://github.com/RequestNetwork/requestNetwork/commit/2912e77))


### Features

* add concurrent readMany to storage layer ([#363](https://github.com/RequestNetwork/requestNetwork/issues/363)) ([db3f484](https://github.com/RequestNetwork/requestNetwork/commit/db3f484))
* add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
* add IPFS peer for faster IPFS retrieval, and check IPFS and Ethereum nodes connections ([#353](https://github.com/RequestNetwork/requestNetwork/issues/353)) ([47358c2](https://github.com/RequestNetwork/requestNetwork/commit/47358c2))
* add retry for Bitcoin transaction provider requests ([#417](https://github.com/RequestNetwork/requestNetwork/issues/417)) ([0cac415](https://github.com/RequestNetwork/requestNetwork/commit/0cac415))
* compute the requestId before creation with computeRequestId ([#407](https://github.com/RequestNetwork/requestNetwork/issues/407)) ([c88c6f6](https://github.com/RequestNetwork/requestNetwork/commit/c88c6f6))
* declarative requests on request-client.js ([#318](https://github.com/RequestNetwork/requestNetwork/issues/318)) ([c4a4cb5](https://github.com/RequestNetwork/requestNetwork/commit/c4a4cb5))
* getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
* introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
* payment network declarative for any currency ([#315](https://github.com/RequestNetwork/requestNetwork/issues/315)) ([06fb561](https://github.com/RequestNetwork/requestNetwork/commit/06fb561))
* request-client.js: adding more Bitcoin providers ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6379c6f](https://github.com/RequestNetwork/requestNetwork/commit/6379c6f))
* retrying Axios requests from request-client.js to request-node in case of failure ([#418](https://github.com/RequestNetwork/requestNetwork/issues/418)) ([430e09b](https://github.com/RequestNetwork/requestNetwork/commit/430e09b))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))
* update readme ([#310](https://github.com/RequestNetwork/requestNetwork/issues/310)) ([c6a9ee6](https://github.com/RequestNetwork/requestNetwork/commit/c6a9ee6))
* **data-access:** transaction index persisted for faster initialization ([#406](https://github.com/RequestNetwork/requestNetwork/issues/406)) ([d820036](https://github.com/RequestNetwork/requestNetwork/commit/d820036))


### Performance Improvements

* faster initialization by factoring stat and read IPFS calls in one call ([#401](https://github.com/RequestNetwork/requestNetwork/issues/401)) ([184c14e](https://github.com/RequestNetwork/requestNetwork/commit/184c14e))





## [0.2.1-alpha.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.1.1-alpha.4...@requestnetwork/request-client.js@0.2.1-alpha.0) (2019-07-22)


### Bug Fixes

* fix bitcoin providers for edge cases (many transactions on one address, reentrant transaction..) ([#453](https://github.com/RequestNetwork/requestNetwork/issues/453)) ([9246116](https://github.com/RequestNetwork/requestNetwork/commit/9246116))
* remove unecessary await on getData ([#332](https://github.com/RequestNetwork/requestNetwork/issues/332)) ([232f1e1](https://github.com/RequestNetwork/requestNetwork/commit/232f1e1))
* request-client.js readme not updated ([#364](https://github.com/RequestNetwork/requestNetwork/issues/364)) ([379089e](https://github.com/RequestNetwork/requestNetwork/commit/379089e))
* Wrong parameter name for createRequest function in client-request.js README ([#362](https://github.com/RequestNetwork/requestNetwork/issues/362)) ([2912e77](https://github.com/RequestNetwork/requestNetwork/commit/2912e77))


### Features

* add concurrent readMany to storage layer ([#363](https://github.com/RequestNetwork/requestNetwork/issues/363)) ([db3f484](https://github.com/RequestNetwork/requestNetwork/commit/db3f484))
* add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
* add IPFS peer for faster IPFS retrieval, and check IPFS and Ethereum nodes connections ([#353](https://github.com/RequestNetwork/requestNetwork/issues/353)) ([47358c2](https://github.com/RequestNetwork/requestNetwork/commit/47358c2))
* add retry for Bitcoin transaction provider requests ([#417](https://github.com/RequestNetwork/requestNetwork/issues/417)) ([0cac415](https://github.com/RequestNetwork/requestNetwork/commit/0cac415))
* compute the requestId before creation with computeRequestId ([#407](https://github.com/RequestNetwork/requestNetwork/issues/407)) ([c88c6f6](https://github.com/RequestNetwork/requestNetwork/commit/c88c6f6))
* declarative requests on request-client.js ([#318](https://github.com/RequestNetwork/requestNetwork/issues/318)) ([c4a4cb5](https://github.com/RequestNetwork/requestNetwork/commit/c4a4cb5))
* getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
* introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
* payment network declarative for any currency ([#315](https://github.com/RequestNetwork/requestNetwork/issues/315)) ([06fb561](https://github.com/RequestNetwork/requestNetwork/commit/06fb561))
* request-client.js: adding more Bitcoin providers ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6379c6f](https://github.com/RequestNetwork/requestNetwork/commit/6379c6f))
* retrying Axios requests from request-client.js to request-node in case of failure ([#418](https://github.com/RequestNetwork/requestNetwork/issues/418)) ([430e09b](https://github.com/RequestNetwork/requestNetwork/commit/430e09b))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))
* update readme ([#310](https://github.com/RequestNetwork/requestNetwork/issues/310)) ([c6a9ee6](https://github.com/RequestNetwork/requestNetwork/commit/c6a9ee6))
* **data-access:** transaction index persisted for faster initialization ([#406](https://github.com/RequestNetwork/requestNetwork/issues/406)) ([d820036](https://github.com/RequestNetwork/requestNetwork/commit/d820036))


### Performance Improvements

* faster initialization by factoring stat and read IPFS calls in one call ([#401](https://github.com/RequestNetwork/requestNetwork/issues/401)) ([184c14e](https://github.com/RequestNetwork/requestNetwork/commit/184c14e))





# [0.2.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.1.1-alpha.4...@requestnetwork/request-client.js@0.2.0) (2019-06-06)


### Bug Fixes

* remove unecessary await on getData ([#332](https://github.com/RequestNetwork/requestNetwork/issues/332)) ([232f1e1](https://github.com/RequestNetwork/requestNetwork/commit/232f1e1))
* request-client.js readme not updated ([#364](https://github.com/RequestNetwork/requestNetwork/issues/364)) ([379089e](https://github.com/RequestNetwork/requestNetwork/commit/379089e))
* Wrong parameter name for createRequest function in client-request.js README ([#362](https://github.com/RequestNetwork/requestNetwork/issues/362)) ([2912e77](https://github.com/RequestNetwork/requestNetwork/commit/2912e77))


### Features

* add concurrent readMany to storage layer ([#363](https://github.com/RequestNetwork/requestNetwork/issues/363)) ([db3f484](https://github.com/RequestNetwork/requestNetwork/commit/db3f484))
* add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
* add IPFS peer for faster IPFS retrieval, and check IPFS and Ethereum nodes connections ([#353](https://github.com/RequestNetwork/requestNetwork/issues/353)) ([47358c2](https://github.com/RequestNetwork/requestNetwork/commit/47358c2))
* declarative requests on request-client.js ([#318](https://github.com/RequestNetwork/requestNetwork/issues/318)) ([c4a4cb5](https://github.com/RequestNetwork/requestNetwork/commit/c4a4cb5))
* getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
* introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
* payment network declarative for any currency ([#315](https://github.com/RequestNetwork/requestNetwork/issues/315)) ([06fb561](https://github.com/RequestNetwork/requestNetwork/commit/06fb561))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))
* update readme ([#310](https://github.com/RequestNetwork/requestNetwork/issues/310)) ([c6a9ee6](https://github.com/RequestNetwork/requestNetwork/commit/c6a9ee6))


### Performance Improvements

* faster initialization by factoring stat and read IPFS calls in one call ([#401](https://github.com/RequestNetwork/requestNetwork/issues/401)) ([184c14e](https://github.com/RequestNetwork/requestNetwork/commit/184c14e))






## [0.1.1-alpha.12](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.1.1-alpha.4...@requestnetwork/request-client.js@0.1.1-alpha.12) (2019-05-21)


### Bug Fixes

* remove unecessary await on getData ([#332](https://github.com/RequestNetwork/requestNetwork/issues/332)) ([232f1e1](https://github.com/RequestNetwork/requestNetwork/commit/232f1e1))


### Features

* add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
* declarative requests on request-client.js ([#318](https://github.com/RequestNetwork/requestNetwork/issues/318)) ([c4a4cb5](https://github.com/RequestNetwork/requestNetwork/commit/c4a4cb5))
* getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
* introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
* payment network declarative for any currency ([#315](https://github.com/RequestNetwork/requestNetwork/issues/315)) ([06fb561](https://github.com/RequestNetwork/requestNetwork/commit/06fb561))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))
* update readme ([#310](https://github.com/RequestNetwork/requestNetwork/issues/310)) ([c6a9ee6](https://github.com/RequestNetwork/requestNetwork/commit/c6a9ee6))






## [0.1.1-alpha.11](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.1.1-alpha.4...@requestnetwork/request-client.js@0.1.1-alpha.11) (2019-05-17)


### Bug Fixes

* remove unecessary await on getData ([#332](https://github.com/RequestNetwork/requestNetwork/issues/332)) ([232f1e1](https://github.com/RequestNetwork/requestNetwork/commit/232f1e1))


### Features

* add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
* declarative requests on request-client.js ([#318](https://github.com/RequestNetwork/requestNetwork/issues/318)) ([c4a4cb5](https://github.com/RequestNetwork/requestNetwork/commit/c4a4cb5))
* getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
* introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
* payment network declarative for any currency ([#315](https://github.com/RequestNetwork/requestNetwork/issues/315)) ([06fb561](https://github.com/RequestNetwork/requestNetwork/commit/06fb561))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))
* update readme ([#310](https://github.com/RequestNetwork/requestNetwork/issues/310)) ([c6a9ee6](https://github.com/RequestNetwork/requestNetwork/commit/c6a9ee6))






## [0.1.1-alpha.10](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.1.1-alpha.4...@requestnetwork/request-client.js@0.1.1-alpha.10) (2019-05-10)


### Bug Fixes

* remove unecessary await on getData ([#332](https://github.com/RequestNetwork/requestNetwork/issues/332)) ([232f1e1](https://github.com/RequestNetwork/requestNetwork/commit/232f1e1))


### Features

* add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
* getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
* introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
* payment network declarative for any currency ([#315](https://github.com/RequestNetwork/requestNetwork/issues/315)) ([06fb561](https://github.com/RequestNetwork/requestNetwork/commit/06fb561))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))
* update readme ([#310](https://github.com/RequestNetwork/requestNetwork/issues/310)) ([c6a9ee6](https://github.com/RequestNetwork/requestNetwork/commit/c6a9ee6))
