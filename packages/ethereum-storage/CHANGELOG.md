# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.2.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/ethereum-storage@0.1.1-alpha.4...@requestnetwork/ethereum-storage@0.2.0) (2019-06-06)


### Bug Fixes

* block not found error in function addHashAndSizeToEthereum of storage ([#349](https://github.com/RequestNetwork/requestNetwork/issues/349)) ([1fea138](https://github.com/RequestNetwork/requestNetwork/commit/1fea138))
* Data access synchronization not parallelized ([#333](https://github.com/RequestNetwork/requestNetwork/issues/333)) ([cd63a22](https://github.com/RequestNetwork/requestNetwork/commit/cd63a22))
* Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))
* Ethereum-storage meta, no redundant getPastEvents call ([#312](https://github.com/RequestNetwork/requestNetwork/issues/312)) ([28b5bb1](https://github.com/RequestNetwork/requestNetwork/commit/28b5bb1))
* Misc. minor fixes on the request node ([#334](https://github.com/RequestNetwork/requestNetwork/issues/334)) ([8fcf53d](https://github.com/RequestNetwork/requestNetwork/commit/8fcf53d))
* storage endless http request ([#284](https://github.com/RequestNetwork/requestNetwork/issues/284)) ([9adac9a](https://github.com/RequestNetwork/requestNetwork/commit/9adac9a))
* Storage Infura 1000 results error ([#320](https://github.com/RequestNetwork/requestNetwork/issues/320)) ([289a7f2](https://github.com/RequestNetwork/requestNetwork/commit/289a7f2))
* Use getSecondtLastBlockNumber instead of getLastBlockNumber for getBlockNumbersFromTimestamp ([#330](https://github.com/RequestNetwork/requestNetwork/issues/330)) ([58606b7](https://github.com/RequestNetwork/requestNetwork/commit/58606b7))


### Features

* add concurrent readMany to storage layer ([#363](https://github.com/RequestNetwork/requestNetwork/issues/363)) ([db3f484](https://github.com/RequestNetwork/requestNetwork/commit/db3f484))
* add IPFS peer for faster IPFS retrieval, and check IPFS and Ethereum nodes connections ([#353](https://github.com/RequestNetwork/requestNetwork/issues/353)) ([47358c2](https://github.com/RequestNetwork/requestNetwork/commit/47358c2))
* add logging interfaces and default logger ([#397](https://github.com/RequestNetwork/requestNetwork/issues/397)) ([f83a716](https://github.com/RequestNetwork/requestNetwork/commit/f83a716))
* add the ability to be able to configure the host + port via com… ([#355](https://github.com/RequestNetwork/requestNetwork/issues/355)) ([5b6a6c6](https://github.com/RequestNetwork/requestNetwork/commit/5b6a6c6))
* Add the two new IPFS nodes as known IPFS nodes ([#410](https://github.com/RequestNetwork/requestNetwork/issues/410)) ([b33f2e9](https://github.com/RequestNetwork/requestNetwork/commit/b33f2e9))
* additional node logs to show progress and logLevel option ([#338](https://github.com/RequestNetwork/requestNetwork/issues/338)) ([38559f4](https://github.com/RequestNetwork/requestNetwork/commit/38559f4))
* asynchronously pin IPFS files in batches ([#403](https://github.com/RequestNetwork/requestNetwork/issues/403)) ([926c22b](https://github.com/RequestNetwork/requestNetwork/commit/926c22b))
* check if the contracts are deployed and configured ([#360](https://github.com/RequestNetwork/requestNetwork/issues/360)) ([c18bf00](https://github.com/RequestNetwork/requestNetwork/commit/c18bf00))
* class to get Ethereum block information in storage ([#283](https://github.com/RequestNetwork/requestNetwork/issues/283)) ([1454981](https://github.com/RequestNetwork/requestNetwork/commit/1454981))
* configurable ethereum node host and port for smart contract deployment ([#358](https://github.com/RequestNetwork/requestNetwork/issues/358)) ([d7ad242](https://github.com/RequestNetwork/requestNetwork/commit/d7ad242))
* Create usable Dockerfile ([#278](https://github.com/RequestNetwork/requestNetwork/issues/278)) ([6c83f28](https://github.com/RequestNetwork/requestNetwork/commit/6c83f28))
* implements cached-throttle utility ([#348](https://github.com/RequestNetwork/requestNetwork/issues/348)) ([01c9885](https://github.com/RequestNetwork/requestNetwork/commit/01c9885))
* Migrate the synchronization from storage to data-access ([#292](https://github.com/RequestNetwork/requestNetwork/issues/292)) ([3d04d0d](https://github.com/RequestNetwork/requestNetwork/commit/3d04d0d))
* pin ipfs data on the node ([#361](https://github.com/RequestNetwork/requestNetwork/issues/361)) ([5830350](https://github.com/RequestNetwork/requestNetwork/commit/5830350))
* Save dataId's Ethereum metadata when append is called ([#352](https://github.com/RequestNetwork/requestNetwork/issues/352)) ([118d197](https://github.com/RequestNetwork/requestNetwork/commit/118d197))
* Storage cache for Ethereum metadata ([#323](https://github.com/RequestNetwork/requestNetwork/issues/323)) ([cb29b8e](https://github.com/RequestNetwork/requestNetwork/commit/cb29b8e))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* upgradable smart contracts ([#337](https://github.com/RequestNetwork/requestNetwork/issues/337)) ([c8cf724](https://github.com/RequestNetwork/requestNetwork/commit/c8cf724))


### Performance Improvements

* add the node ipfs request network at initialization ([#398](https://github.com/RequestNetwork/requestNetwork/issues/398)) ([7e0c25a](https://github.com/RequestNetwork/requestNetwork/commit/7e0c25a))
* faster initialization by factoring stat and read IPFS calls in one call ([#401](https://github.com/RequestNetwork/requestNetwork/issues/401)) ([184c14e](https://github.com/RequestNetwork/requestNetwork/commit/184c14e))






## [0.1.1-alpha.12](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/ethereum-storage@0.1.1-alpha.4...@requestnetwork/ethereum-storage@0.1.1-alpha.12) (2019-05-21)


### Bug Fixes

* block not found error in function addHashAndSizeToEthereum of storage ([#349](https://github.com/RequestNetwork/requestNetwork/issues/349)) ([1fea138](https://github.com/RequestNetwork/requestNetwork/commit/1fea138))
* Data access synchronization not parallelized ([#333](https://github.com/RequestNetwork/requestNetwork/issues/333)) ([cd63a22](https://github.com/RequestNetwork/requestNetwork/commit/cd63a22))
* Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))
* Ethereum-storage meta, no redundant getPastEvents call ([#312](https://github.com/RequestNetwork/requestNetwork/issues/312)) ([28b5bb1](https://github.com/RequestNetwork/requestNetwork/commit/28b5bb1))
* Misc. minor fixes on the request node ([#334](https://github.com/RequestNetwork/requestNetwork/issues/334)) ([8fcf53d](https://github.com/RequestNetwork/requestNetwork/commit/8fcf53d))
* storage endless http request ([#284](https://github.com/RequestNetwork/requestNetwork/issues/284)) ([9adac9a](https://github.com/RequestNetwork/requestNetwork/commit/9adac9a))
* Storage Infura 1000 results error ([#320](https://github.com/RequestNetwork/requestNetwork/issues/320)) ([289a7f2](https://github.com/RequestNetwork/requestNetwork/commit/289a7f2))
* Use getSecondtLastBlockNumber instead of getLastBlockNumber for getBlockNumbersFromTimestamp ([#330](https://github.com/RequestNetwork/requestNetwork/issues/330)) ([58606b7](https://github.com/RequestNetwork/requestNetwork/commit/58606b7))


### Features

* add the ability to be able to configure the host + port via com… ([#355](https://github.com/RequestNetwork/requestNetwork/issues/355)) ([5b6a6c6](https://github.com/RequestNetwork/requestNetwork/commit/5b6a6c6))
* additional node logs to show progress and logLevel option ([#338](https://github.com/RequestNetwork/requestNetwork/issues/338)) ([38559f4](https://github.com/RequestNetwork/requestNetwork/commit/38559f4))
* class to get Ethereum block information in storage ([#283](https://github.com/RequestNetwork/requestNetwork/issues/283)) ([1454981](https://github.com/RequestNetwork/requestNetwork/commit/1454981))
* Create usable Dockerfile ([#278](https://github.com/RequestNetwork/requestNetwork/issues/278)) ([6c83f28](https://github.com/RequestNetwork/requestNetwork/commit/6c83f28))
* implements cached-throttle utility ([#348](https://github.com/RequestNetwork/requestNetwork/issues/348)) ([01c9885](https://github.com/RequestNetwork/requestNetwork/commit/01c9885))
* Migrate the synchronization from storage to data-access ([#292](https://github.com/RequestNetwork/requestNetwork/issues/292)) ([3d04d0d](https://github.com/RequestNetwork/requestNetwork/commit/3d04d0d))
* Save dataId's Ethereum metadata when append is called ([#352](https://github.com/RequestNetwork/requestNetwork/issues/352)) ([118d197](https://github.com/RequestNetwork/requestNetwork/commit/118d197))
* Storage cache for Ethereum metadata ([#323](https://github.com/RequestNetwork/requestNetwork/issues/323)) ([cb29b8e](https://github.com/RequestNetwork/requestNetwork/commit/cb29b8e))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
* upgradable smart contracts ([#337](https://github.com/RequestNetwork/requestNetwork/issues/337)) ([c8cf724](https://github.com/RequestNetwork/requestNetwork/commit/c8cf724))






## [0.1.1-alpha.11](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/ethereum-storage@0.1.1-alpha.4...@requestnetwork/ethereum-storage@0.1.1-alpha.11) (2019-05-17)


### Bug Fixes

* Data access synchronization not parallelized ([#333](https://github.com/RequestNetwork/requestNetwork/issues/333)) ([cd63a22](https://github.com/RequestNetwork/requestNetwork/commit/cd63a22))
* Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))
* Ethereum-storage meta, no redundant getPastEvents call ([#312](https://github.com/RequestNetwork/requestNetwork/issues/312)) ([28b5bb1](https://github.com/RequestNetwork/requestNetwork/commit/28b5bb1))
* Misc. minor fixes on the request node ([#334](https://github.com/RequestNetwork/requestNetwork/issues/334)) ([8fcf53d](https://github.com/RequestNetwork/requestNetwork/commit/8fcf53d))
* storage endless http request ([#284](https://github.com/RequestNetwork/requestNetwork/issues/284)) ([9adac9a](https://github.com/RequestNetwork/requestNetwork/commit/9adac9a))
* Storage Infura 1000 results error ([#320](https://github.com/RequestNetwork/requestNetwork/issues/320)) ([289a7f2](https://github.com/RequestNetwork/requestNetwork/commit/289a7f2))
* Use getSecondtLastBlockNumber instead of getLastBlockNumber for getBlockNumbersFromTimestamp ([#330](https://github.com/RequestNetwork/requestNetwork/issues/330)) ([58606b7](https://github.com/RequestNetwork/requestNetwork/commit/58606b7))


### Features

* additional node logs to show progress and logLevel option ([#338](https://github.com/RequestNetwork/requestNetwork/issues/338)) ([38559f4](https://github.com/RequestNetwork/requestNetwork/commit/38559f4))
* class to get Ethereum block information in storage ([#283](https://github.com/RequestNetwork/requestNetwork/issues/283)) ([1454981](https://github.com/RequestNetwork/requestNetwork/commit/1454981))
* Create usable Dockerfile ([#278](https://github.com/RequestNetwork/requestNetwork/issues/278)) ([6c83f28](https://github.com/RequestNetwork/requestNetwork/commit/6c83f28))
* implements cached-throttle utility ([#348](https://github.com/RequestNetwork/requestNetwork/issues/348)) ([01c9885](https://github.com/RequestNetwork/requestNetwork/commit/01c9885))
* Migrate the synchronization from storage to data-access ([#292](https://github.com/RequestNetwork/requestNetwork/issues/292)) ([3d04d0d](https://github.com/RequestNetwork/requestNetwork/commit/3d04d0d))
* Storage cache for Ethereum metadata ([#323](https://github.com/RequestNetwork/requestNetwork/issues/323)) ([cb29b8e](https://github.com/RequestNetwork/requestNetwork/commit/cb29b8e))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))






## [0.1.1-alpha.10](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/ethereum-storage@0.1.1-alpha.4...@requestnetwork/ethereum-storage@0.1.1-alpha.10) (2019-05-10)


### Bug Fixes

* Data access synchronization not parallelized ([#333](https://github.com/RequestNetwork/requestNetwork/issues/333)) ([cd63a22](https://github.com/RequestNetwork/requestNetwork/commit/cd63a22))
* Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))
* Ethereum-storage meta, no redundant getPastEvents call ([#312](https://github.com/RequestNetwork/requestNetwork/issues/312)) ([28b5bb1](https://github.com/RequestNetwork/requestNetwork/commit/28b5bb1))
* Misc. minor fixes on the request node ([#334](https://github.com/RequestNetwork/requestNetwork/issues/334)) ([8fcf53d](https://github.com/RequestNetwork/requestNetwork/commit/8fcf53d))
* storage endless http request ([#284](https://github.com/RequestNetwork/requestNetwork/issues/284)) ([9adac9a](https://github.com/RequestNetwork/requestNetwork/commit/9adac9a))
* Storage Infura 1000 results error ([#320](https://github.com/RequestNetwork/requestNetwork/issues/320)) ([289a7f2](https://github.com/RequestNetwork/requestNetwork/commit/289a7f2))
* Use getSecondtLastBlockNumber instead of getLastBlockNumber for getBlockNumbersFromTimestamp ([#330](https://github.com/RequestNetwork/requestNetwork/issues/330)) ([58606b7](https://github.com/RequestNetwork/requestNetwork/commit/58606b7))


### Features

* class to get Ethereum block information in storage ([#283](https://github.com/RequestNetwork/requestNetwork/issues/283)) ([1454981](https://github.com/RequestNetwork/requestNetwork/commit/1454981))
* Create usable Dockerfile ([#278](https://github.com/RequestNetwork/requestNetwork/issues/278)) ([6c83f28](https://github.com/RequestNetwork/requestNetwork/commit/6c83f28))
* Migrate the synchronization from storage to data-access ([#292](https://github.com/RequestNetwork/requestNetwork/issues/292)) ([3d04d0d](https://github.com/RequestNetwork/requestNetwork/commit/3d04d0d))
* Storage cache for Ethereum metadata ([#323](https://github.com/RequestNetwork/requestNetwork/issues/323)) ([cb29b8e](https://github.com/RequestNetwork/requestNetwork/commit/cb29b8e))
* Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
