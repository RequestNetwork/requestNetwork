# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.5.4](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.3...@requestnetwork/request-node@0.5.4) (2019-11-20)

**Note:** Version bump only for package @requestnetwork/request-node





## [0.5.3](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.2...@requestnetwork/request-node@0.5.3) (2019-10-21)

**Note:** Version bump only for package @requestnetwork/request-node






## [0.5.2](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.1...@requestnetwork/request-node@0.5.2) (2019-09-16)

**Note:** Version bump only for package @requestnetwork/request-node





## [0.5.1](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.0...@requestnetwork/request-node@0.5.1) (2019-09-05)

**Note:** Version bump only for package @requestnetwork/request-node






# [0.5.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.4.0...@requestnetwork/request-node@0.5.0) (2019-08-19)


### Features

* add an option for the Node to define the timeout when calling persistTransaction ([#485](https://github.com/RequestNetwork/requestNetwork/issues/485)) ([176228c](https://github.com/RequestNetwork/requestNetwork/commit/176228c))


### Performance Improvements

* lower concurrency to 5 and disable DHT on IPFS ([#500](https://github.com/RequestNetwork/requestNetwork/issues/500)) ([cec31e3](https://github.com/RequestNetwork/requestNetwork/commit/cec31e3))






# [0.3.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.1.1-alpha.4...@requestnetwork/request-node@0.3.0) (2019-07-24)


### Bug Fixes

* Add a specific tsconfig for Dockerfile ([#286](https://github.com/RequestNetwork/requestNetwork/issues/286)) ([901c36c](https://github.com/RequestNetwork/requestNetwork/commit/901c36c))
* block not found error in function addHashAndSizeToEthereum of storage ([#349](https://github.com/RequestNetwork/requestNetwork/issues/349)) ([1fea138](https://github.com/RequestNetwork/requestNetwork/commit/1fea138))
* Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))
* Misc. minor fixes on the request node ([#334](https://github.com/RequestNetwork/requestNetwork/issues/334)) ([8fcf53d](https://github.com/RequestNetwork/requestNetwork/commit/8fcf53d))
* Node socket hangup error ([#293](https://github.com/RequestNetwork/requestNetwork/issues/293)) ([02777ea](https://github.com/RequestNetwork/requestNetwork/commit/02777ea))
* Rename providerHost to providerUrl ([#271](https://github.com/RequestNetwork/requestNetwork/issues/271)) ([fa5480c](https://github.com/RequestNetwork/requestNetwork/commit/fa5480c))
* use keyv to persist Ethereum metadata cache ([#431](https://github.com/RequestNetwork/requestNetwork/issues/431)) ([6a6788b](https://github.com/RequestNetwork/requestNetwork/commit/6a6788b))


### Features

* add .env support to the node ([#336](https://github.com/RequestNetwork/requestNetwork/issues/336)) ([e1ef0c6](https://github.com/RequestNetwork/requestNetwork/commit/e1ef0c6))
* add concurrent readMany to storage layer ([#363](https://github.com/RequestNetwork/requestNetwork/issues/363)) ([db3f484](https://github.com/RequestNetwork/requestNetwork/commit/db3f484))
* add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
* add logging interfaces and default logger ([#397](https://github.com/RequestNetwork/requestNetwork/issues/397)) ([f83a716](https://github.com/RequestNetwork/requestNetwork/commit/f83a716))
* add logs for request processing time ([#424](https://github.com/RequestNetwork/requestNetwork/issues/424)) ([3802f4e](https://github.com/RequestNetwork/requestNetwork/commit/3802f4e))
* add logs to calculate success rate of transaction creation ([#443](https://github.com/RequestNetwork/requestNetwork/issues/443)) ([738a98d](https://github.com/RequestNetwork/requestNetwork/commit/738a98d))
* add request node health check endpoints ([#449](https://github.com/RequestNetwork/requestNetwork/issues/449)) ([bef1a71](https://github.com/RequestNetwork/requestNetwork/commit/bef1a71))
* add request node logger ([#416](https://github.com/RequestNetwork/requestNetwork/issues/416)) ([8d56ade](https://github.com/RequestNetwork/requestNetwork/commit/8d56ade))
* add script to configure private IPFS network ([#458](https://github.com/RequestNetwork/requestNetwork/issues/458)) ([4490d2b](https://github.com/RequestNetwork/requestNetwork/commit/4490d2b))
* add time to start a Node in the logs ([#423](https://github.com/RequestNetwork/requestNetwork/issues/423)) ([f9a6972](https://github.com/RequestNetwork/requestNetwork/commit/f9a6972))
* additional node logs to show progress and logLevel option ([#338](https://github.com/RequestNetwork/requestNetwork/issues/338)) ([38559f4](https://github.com/RequestNetwork/requestNetwork/commit/38559f4))
* Create usable Dockerfile ([#278](https://github.com/RequestNetwork/requestNetwork/issues/278)) ([6c83f28](https://github.com/RequestNetwork/requestNetwork/commit/6c83f28))
* **data-access:** transaction index persisted for faster initialization ([#406](https://github.com/RequestNetwork/requestNetwork/issues/406)) ([d820036](https://github.com/RequestNetwork/requestNetwork/commit/d820036))
* getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
* implements cached-throttle utility ([#348](https://github.com/RequestNetwork/requestNetwork/issues/348)) ([01c9885](https://github.com/RequestNetwork/requestNetwork/commit/01c9885))
* introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))


### Performance Improvements

* faster initialization by factoring stat and read IPFS calls in one call ([#401](https://github.com/RequestNetwork/requestNetwork/issues/401)) ([184c14e](https://github.com/RequestNetwork/requestNetwork/commit/184c14e))





## [0.2.1-alpha.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.1.1-alpha.4...@requestnetwork/request-node@0.2.1-alpha.0) (2019-07-22)


### Bug Fixes

* Add a specific tsconfig for Dockerfile ([#286](https://github.com/RequestNetwork/requestNetwork/issues/286)) ([901c36c](https://github.com/RequestNetwork/requestNetwork/commit/901c36c))
* block not found error in function addHashAndSizeToEthereum of storage ([#349](https://github.com/RequestNetwork/requestNetwork/issues/349)) ([1fea138](https://github.com/RequestNetwork/requestNetwork/commit/1fea138))
* Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))
* Misc. minor fixes on the request node ([#334](https://github.com/RequestNetwork/requestNetwork/issues/334)) ([8fcf53d](https://github.com/RequestNetwork/requestNetwork/commit/8fcf53d))
* Node socket hangup error ([#293](https://github.com/RequestNetwork/requestNetwork/issues/293)) ([02777ea](https://github.com/RequestNetwork/requestNetwork/commit/02777ea))
* Rename providerHost to providerUrl ([#271](https://github.com/RequestNetwork/requestNetwork/issues/271)) ([fa5480c](https://github.com/RequestNetwork/requestNetwork/commit/fa5480c))
* use keyv to persist Ethereum metadata cache ([#431](https://github.com/RequestNetwork/requestNetwork/issues/431)) ([6a6788b](https://github.com/RequestNetwork/requestNetwork/commit/6a6788b))


### Features

* add .env support to the node ([#336](https://github.com/RequestNetwork/requestNetwork/issues/336)) ([e1ef0c6](https://github.com/RequestNetwork/requestNetwork/commit/e1ef0c6))
* add concurrent readMany to storage layer ([#363](https://github.com/RequestNetwork/requestNetwork/issues/363)) ([db3f484](https://github.com/RequestNetwork/requestNetwork/commit/db3f484))
* add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
* add logging interfaces and default logger ([#397](https://github.com/RequestNetwork/requestNetwork/issues/397)) ([f83a716](https://github.com/RequestNetwork/requestNetwork/commit/f83a716))
* add logs for request processing time ([#424](https://github.com/RequestNetwork/requestNetwork/issues/424)) ([3802f4e](https://github.com/RequestNetwork/requestNetwork/commit/3802f4e))
* add logs to calculate success rate of transaction creation ([#443](https://github.com/RequestNetwork/requestNetwork/issues/443)) ([738a98d](https://github.com/RequestNetwork/requestNetwork/commit/738a98d))
* add request node health check endpoints ([#449](https://github.com/RequestNetwork/requestNetwork/issues/449)) ([bef1a71](https://github.com/RequestNetwork/requestNetwork/commit/bef1a71))
* add request node logger ([#416](https://github.com/RequestNetwork/requestNetwork/issues/416)) ([8d56ade](https://github.com/RequestNetwork/requestNetwork/commit/8d56ade))
* add time to start a Node in the logs ([#423](https://github.com/RequestNetwork/requestNetwork/issues/423)) ([f9a6972](https://github.com/RequestNetwork/requestNetwork/commit/f9a6972))
* additional node logs to show progress and logLevel option ([#338](https://github.com/RequestNetwork/requestNetwork/issues/338)) ([38559f4](https://github.com/RequestNetwork/requestNetwork/commit/38559f4))
* Create usable Dockerfile ([#278](https://github.com/RequestNetwork/requestNetwork/issues/278)) ([6c83f28](https://github.com/RequestNetwork/requestNetwork/commit/6c83f28))
* **data-access:** transaction index persisted for faster initialization ([#406](https://github.com/RequestNetwork/requestNetwork/issues/406)) ([d820036](https://github.com/RequestNetwork/requestNetwork/commit/d820036))
* getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
* implements cached-throttle utility ([#348](https://github.com/RequestNetwork/requestNetwork/issues/348)) ([01c9885](https://github.com/RequestNetwork/requestNetwork/commit/01c9885))
* introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))


### Performance Improvements

* faster initialization by factoring stat and read IPFS calls in one call ([#401](https://github.com/RequestNetwork/requestNetwork/issues/401)) ([184c14e](https://github.com/RequestNetwork/requestNetwork/commit/184c14e))





# [0.2.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.1.1-alpha.4...@requestnetwork/request-node@0.2.0) (2019-06-06)


### Bug Fixes

* Add a specific tsconfig for Dockerfile ([#286](https://github.com/RequestNetwork/requestNetwork/issues/286)) ([901c36c](https://github.com/RequestNetwork/requestNetwork/commit/901c36c))
* block not found error in function addHashAndSizeToEthereum of storage ([#349](https://github.com/RequestNetwork/requestNetwork/issues/349)) ([1fea138](https://github.com/RequestNetwork/requestNetwork/commit/1fea138))
* Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))
* Misc. minor fixes on the request node ([#334](https://github.com/RequestNetwork/requestNetwork/issues/334)) ([8fcf53d](https://github.com/RequestNetwork/requestNetwork/commit/8fcf53d))
* Node socket hangup error ([#293](https://github.com/RequestNetwork/requestNetwork/issues/293)) ([02777ea](https://github.com/RequestNetwork/requestNetwork/commit/02777ea))
* Rename providerHost to providerUrl ([#271](https://github.com/RequestNetwork/requestNetwork/issues/271)) ([fa5480c](https://github.com/RequestNetwork/requestNetwork/commit/fa5480c))


### Features

* add .env support to the node ([#336](https://github.com/RequestNetwork/requestNetwork/issues/336)) ([e1ef0c6](https://github.com/RequestNetwork/requestNetwork/commit/e1ef0c6))
* add concurrent readMany to storage layer ([#363](https://github.com/RequestNetwork/requestNetwork/issues/363)) ([db3f484](https://github.com/RequestNetwork/requestNetwork/commit/db3f484))
* add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
* add logging interfaces and default logger ([#397](https://github.com/RequestNetwork/requestNetwork/issues/397)) ([f83a716](https://github.com/RequestNetwork/requestNetwork/commit/f83a716))
* additional node logs to show progress and logLevel option ([#338](https://github.com/RequestNetwork/requestNetwork/issues/338)) ([38559f4](https://github.com/RequestNetwork/requestNetwork/commit/38559f4))
* Create usable Dockerfile ([#278](https://github.com/RequestNetwork/requestNetwork/issues/278)) ([6c83f28](https://github.com/RequestNetwork/requestNetwork/commit/6c83f28))
* getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
* implements cached-throttle utility ([#348](https://github.com/RequestNetwork/requestNetwork/issues/348)) ([01c9885](https://github.com/RequestNetwork/requestNetwork/commit/01c9885))
* introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))


### Performance Improvements

* faster initialization by factoring stat and read IPFS calls in one call ([#401](https://github.com/RequestNetwork/requestNetwork/issues/401)) ([184c14e](https://github.com/RequestNetwork/requestNetwork/commit/184c14e))






## [0.1.1-alpha.12](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.1.1-alpha.4...@requestnetwork/request-node@0.1.1-alpha.12) (2019-05-21)


### Bug Fixes

* Add a specific tsconfig for Dockerfile ([#286](https://github.com/RequestNetwork/requestNetwork/issues/286)) ([901c36c](https://github.com/RequestNetwork/requestNetwork/commit/901c36c))
* block not found error in function addHashAndSizeToEthereum of storage ([#349](https://github.com/RequestNetwork/requestNetwork/issues/349)) ([1fea138](https://github.com/RequestNetwork/requestNetwork/commit/1fea138))
* Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))
* Misc. minor fixes on the request node ([#334](https://github.com/RequestNetwork/requestNetwork/issues/334)) ([8fcf53d](https://github.com/RequestNetwork/requestNetwork/commit/8fcf53d))
* Node socket hangup error ([#293](https://github.com/RequestNetwork/requestNetwork/issues/293)) ([02777ea](https://github.com/RequestNetwork/requestNetwork/commit/02777ea))
* Rename providerHost to providerUrl ([#271](https://github.com/RequestNetwork/requestNetwork/issues/271)) ([fa5480c](https://github.com/RequestNetwork/requestNetwork/commit/fa5480c))


### Features

* add .env support to the node ([#336](https://github.com/RequestNetwork/requestNetwork/issues/336)) ([e1ef0c6](https://github.com/RequestNetwork/requestNetwork/commit/e1ef0c6))
* add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
* additional node logs to show progress and logLevel option ([#338](https://github.com/RequestNetwork/requestNetwork/issues/338)) ([38559f4](https://github.com/RequestNetwork/requestNetwork/commit/38559f4))
* Create usable Dockerfile ([#278](https://github.com/RequestNetwork/requestNetwork/issues/278)) ([6c83f28](https://github.com/RequestNetwork/requestNetwork/commit/6c83f28))
* getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
* implements cached-throttle utility ([#348](https://github.com/RequestNetwork/requestNetwork/issues/348)) ([01c9885](https://github.com/RequestNetwork/requestNetwork/commit/01c9885))
* introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))






## [0.1.1-alpha.11](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.1.1-alpha.4...@requestnetwork/request-node@0.1.1-alpha.11) (2019-05-17)


### Bug Fixes

* Add a specific tsconfig for Dockerfile ([#286](https://github.com/RequestNetwork/requestNetwork/issues/286)) ([901c36c](https://github.com/RequestNetwork/requestNetwork/commit/901c36c))
* Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))
* Misc. minor fixes on the request node ([#334](https://github.com/RequestNetwork/requestNetwork/issues/334)) ([8fcf53d](https://github.com/RequestNetwork/requestNetwork/commit/8fcf53d))
* Node socket hangup error ([#293](https://github.com/RequestNetwork/requestNetwork/issues/293)) ([02777ea](https://github.com/RequestNetwork/requestNetwork/commit/02777ea))
* Rename providerHost to providerUrl ([#271](https://github.com/RequestNetwork/requestNetwork/issues/271)) ([fa5480c](https://github.com/RequestNetwork/requestNetwork/commit/fa5480c))


### Features

* add .env support to the node ([#336](https://github.com/RequestNetwork/requestNetwork/issues/336)) ([e1ef0c6](https://github.com/RequestNetwork/requestNetwork/commit/e1ef0c6))
* add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
* additional node logs to show progress and logLevel option ([#338](https://github.com/RequestNetwork/requestNetwork/issues/338)) ([38559f4](https://github.com/RequestNetwork/requestNetwork/commit/38559f4))
* Create usable Dockerfile ([#278](https://github.com/RequestNetwork/requestNetwork/issues/278)) ([6c83f28](https://github.com/RequestNetwork/requestNetwork/commit/6c83f28))
* getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
* implements cached-throttle utility ([#348](https://github.com/RequestNetwork/requestNetwork/issues/348)) ([01c9885](https://github.com/RequestNetwork/requestNetwork/commit/01c9885))
* introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))






## [0.1.1-alpha.10](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.1.1-alpha.4...@requestnetwork/request-node@0.1.1-alpha.10) (2019-05-10)


### Bug Fixes

* Add a specific tsconfig for Dockerfile ([#286](https://github.com/RequestNetwork/requestNetwork/issues/286)) ([901c36c](https://github.com/RequestNetwork/requestNetwork/commit/901c36c))
* Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))
* Misc. minor fixes on the request node ([#334](https://github.com/RequestNetwork/requestNetwork/issues/334)) ([8fcf53d](https://github.com/RequestNetwork/requestNetwork/commit/8fcf53d))
* Node socket hangup error ([#293](https://github.com/RequestNetwork/requestNetwork/issues/293)) ([02777ea](https://github.com/RequestNetwork/requestNetwork/commit/02777ea))
* Rename providerHost to providerUrl ([#271](https://github.com/RequestNetwork/requestNetwork/issues/271)) ([fa5480c](https://github.com/RequestNetwork/requestNetwork/commit/fa5480c))


### Features

* add .env support to the node ([#336](https://github.com/RequestNetwork/requestNetwork/issues/336)) ([e1ef0c6](https://github.com/RequestNetwork/requestNetwork/commit/e1ef0c6))
* add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
* Create usable Dockerfile ([#278](https://github.com/RequestNetwork/requestNetwork/issues/278)) ([6c83f28](https://github.com/RequestNetwork/requestNetwork/commit/6c83f28))
* getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
* introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))
