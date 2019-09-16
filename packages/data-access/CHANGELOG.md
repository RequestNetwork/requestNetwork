# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.5.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/data-access@0.4.2...@requestnetwork/data-access@0.5.0) (2019-09-16)


### Features

* **data-access:** get channels from multiple topics ([#527](https://github.com/RequestNetwork/requestNetwork/issues/527)) ([bdebab7](https://github.com/RequestNetwork/requestNetwork/commit/bdebab7))





## [0.4.2](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/data-access@0.4.1...@requestnetwork/data-access@0.4.2) (2019-09-05)


### Bug Fixes

* log interval function failure as warning instead of error in data-access ([#508](https://github.com/RequestNetwork/requestNetwork/issues/508)) ([d132f54](https://github.com/RequestNetwork/requestNetwork/commit/d132f54))






## [0.4.1](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/data-access@0.4.0...@requestnetwork/data-access@0.4.1) (2019-08-19)

**Note:** Version bump only for package @requestnetwork/data-access






# [0.3.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/data-access@0.1.1-alpha.4...@requestnetwork/data-access@0.3.0) (2019-07-24)


### Bug Fixes

* Data access synchronization not parallelized ([#333](https://github.com/RequestNetwork/requestNetwork/issues/333)) ([cd63a22](https://github.com/RequestNetwork/requestNetwork/commit/cd63a22))
* data-access taking time to initialize when Node start ([#422](https://github.com/RequestNetwork/requestNetwork/issues/422)) ([61999b6](https://github.com/RequestNetwork/requestNetwork/commit/61999b6))
* Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))
* Ignore invalid block during synchronisation instead of throwing ([#461](https://github.com/RequestNetwork/requestNetwork/issues/461)) ([528d74f](https://github.com/RequestNetwork/requestNetwork/commit/528d74f))


### Features

* add concurrent readMany to storage layer ([#363](https://github.com/RequestNetwork/requestNetwork/issues/363)) ([db3f484](https://github.com/RequestNetwork/requestNetwork/commit/db3f484))
* add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
* add IPFS peer for faster IPFS retrieval, and check IPFS and Ethereum nodes connections ([#353](https://github.com/RequestNetwork/requestNetwork/issues/353)) ([47358c2](https://github.com/RequestNetwork/requestNetwork/commit/47358c2))
* **data-access:** transaction index persisted for faster initialization ([#406](https://github.com/RequestNetwork/requestNetwork/issues/406)) ([d820036](https://github.com/RequestNetwork/requestNetwork/commit/d820036))
* add request node logger ([#416](https://github.com/RequestNetwork/requestNetwork/issues/416)) ([8d56ade](https://github.com/RequestNetwork/requestNetwork/commit/8d56ade))
* getTransactionByTopic with timestamp boundaries ([#294](https://github.com/RequestNetwork/requestNetwork/issues/294)) ([be4ec56](https://github.com/RequestNetwork/requestNetwork/commit/be4ec56))
* introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
* Migrate the synchronization from storage to data-access ([#292](https://github.com/RequestNetwork/requestNetwork/issues/292)) ([3d04d0d](https://github.com/RequestNetwork/requestNetwork/commit/3d04d0d))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))


### Performance Improvements

* faster initialization by factoring stat and read IPFS calls in one call ([#401](https://github.com/RequestNetwork/requestNetwork/issues/401)) ([184c14e](https://github.com/RequestNetwork/requestNetwork/commit/184c14e))





## [0.2.1-alpha.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/data-access@0.1.1-alpha.4...@requestnetwork/data-access@0.2.1-alpha.0) (2019-07-22)


### Bug Fixes

* Data access synchronization not parallelized ([#333](https://github.com/RequestNetwork/requestNetwork/issues/333)) ([cd63a22](https://github.com/RequestNetwork/requestNetwork/commit/cd63a22))
* data-access taking time to initialize when Node start ([#422](https://github.com/RequestNetwork/requestNetwork/issues/422)) ([61999b6](https://github.com/RequestNetwork/requestNetwork/commit/61999b6))
* Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))
* Ignore invalid block during synchronisation instead of throwing ([#461](https://github.com/RequestNetwork/requestNetwork/issues/461)) ([528d74f](https://github.com/RequestNetwork/requestNetwork/commit/528d74f))


### Features

* add concurrent readMany to storage layer ([#363](https://github.com/RequestNetwork/requestNetwork/issues/363)) ([db3f484](https://github.com/RequestNetwork/requestNetwork/commit/db3f484))
* add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
* add IPFS peer for faster IPFS retrieval, and check IPFS and Ethereum nodes connections ([#353](https://github.com/RequestNetwork/requestNetwork/issues/353)) ([47358c2](https://github.com/RequestNetwork/requestNetwork/commit/47358c2))
* **data-access:** transaction index persisted for faster initialization ([#406](https://github.com/RequestNetwork/requestNetwork/issues/406)) ([d820036](https://github.com/RequestNetwork/requestNetwork/commit/d820036))
* add request node logger ([#416](https://github.com/RequestNetwork/requestNetwork/issues/416)) ([8d56ade](https://github.com/RequestNetwork/requestNetwork/commit/8d56ade))
* getTransactionByTopic with timestamp boundaries ([#294](https://github.com/RequestNetwork/requestNetwork/issues/294)) ([be4ec56](https://github.com/RequestNetwork/requestNetwork/commit/be4ec56))
* introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
* Migrate the synchronization from storage to data-access ([#292](https://github.com/RequestNetwork/requestNetwork/issues/292)) ([3d04d0d](https://github.com/RequestNetwork/requestNetwork/commit/3d04d0d))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))


### Performance Improvements

* faster initialization by factoring stat and read IPFS calls in one call ([#401](https://github.com/RequestNetwork/requestNetwork/issues/401)) ([184c14e](https://github.com/RequestNetwork/requestNetwork/commit/184c14e))





# [0.2.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/data-access@0.1.1-alpha.4...@requestnetwork/data-access@0.2.0) (2019-06-06)


### Bug Fixes

* Data access synchronization not parallelized ([#333](https://github.com/RequestNetwork/requestNetwork/issues/333)) ([cd63a22](https://github.com/RequestNetwork/requestNetwork/commit/cd63a22))
* Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))


### Features

* add concurrent readMany to storage layer ([#363](https://github.com/RequestNetwork/requestNetwork/issues/363)) ([db3f484](https://github.com/RequestNetwork/requestNetwork/commit/db3f484))
* add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
* add IPFS peer for faster IPFS retrieval, and check IPFS and Ethereum nodes connections ([#353](https://github.com/RequestNetwork/requestNetwork/issues/353)) ([47358c2](https://github.com/RequestNetwork/requestNetwork/commit/47358c2))
* getTransactionByTopic with timestamp boundaries ([#294](https://github.com/RequestNetwork/requestNetwork/issues/294)) ([be4ec56](https://github.com/RequestNetwork/requestNetwork/commit/be4ec56))
* introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
* Migrate the synchronization from storage to data-access ([#292](https://github.com/RequestNetwork/requestNetwork/issues/292)) ([3d04d0d](https://github.com/RequestNetwork/requestNetwork/commit/3d04d0d))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))


### Performance Improvements

* faster initialization by factoring stat and read IPFS calls in one call ([#401](https://github.com/RequestNetwork/requestNetwork/issues/401)) ([184c14e](https://github.com/RequestNetwork/requestNetwork/commit/184c14e))






## [0.1.1-alpha.12](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/data-access@0.1.1-alpha.4...@requestnetwork/data-access@0.1.1-alpha.12) (2019-05-21)


### Bug Fixes

* Data access synchronization not parallelized ([#333](https://github.com/RequestNetwork/requestNetwork/issues/333)) ([cd63a22](https://github.com/RequestNetwork/requestNetwork/commit/cd63a22))
* Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))


### Features

* add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
* getTransactionByTopic with timestamp boundaries ([#294](https://github.com/RequestNetwork/requestNetwork/issues/294)) ([be4ec56](https://github.com/RequestNetwork/requestNetwork/commit/be4ec56))
* introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
* Migrate the synchronization from storage to data-access ([#292](https://github.com/RequestNetwork/requestNetwork/issues/292)) ([3d04d0d](https://github.com/RequestNetwork/requestNetwork/commit/3d04d0d))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))






## [0.1.1-alpha.11](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/data-access@0.1.1-alpha.4...@requestnetwork/data-access@0.1.1-alpha.11) (2019-05-17)


### Bug Fixes

* Data access synchronization not parallelized ([#333](https://github.com/RequestNetwork/requestNetwork/issues/333)) ([cd63a22](https://github.com/RequestNetwork/requestNetwork/commit/cd63a22))
* Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))


### Features

* add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
* getTransactionByTopic with timestamp boundaries ([#294](https://github.com/RequestNetwork/requestNetwork/issues/294)) ([be4ec56](https://github.com/RequestNetwork/requestNetwork/commit/be4ec56))
* introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
* Migrate the synchronization from storage to data-access ([#292](https://github.com/RequestNetwork/requestNetwork/issues/292)) ([3d04d0d](https://github.com/RequestNetwork/requestNetwork/commit/3d04d0d))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))






## [0.1.1-alpha.10](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/data-access@0.1.1-alpha.4...@requestnetwork/data-access@0.1.1-alpha.10) (2019-05-10)


### Bug Fixes

* Data access synchronization not parallelized ([#333](https://github.com/RequestNetwork/requestNetwork/issues/333)) ([cd63a22](https://github.com/RequestNetwork/requestNetwork/commit/cd63a22))
* Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))


### Features

* add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
* getTransactionByTopic with timestamp boundaries ([#294](https://github.com/RequestNetwork/requestNetwork/issues/294)) ([be4ec56](https://github.com/RequestNetwork/requestNetwork/commit/be4ec56))
* introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
* Migrate the synchronization from storage to data-access ([#292](https://github.com/RequestNetwork/requestNetwork/issues/292)) ([3d04d0d](https://github.com/RequestNetwork/requestNetwork/commit/3d04d0d))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))
