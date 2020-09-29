# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.23.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.9.0...@requestnetwork/request-client.js@0.23.0) (2020-09-28)


### Bug Fixes

* clone the array topics to avoid modification of parameters ([#215](https://github.com/RequestNetwork/requestNetwork/issues/215)) ([7447c0b](https://github.com/RequestNetwork/requestNetwork/commit/7447c0be26b645ab54e1c82b1451570e88618861))
* don't remove failed transactions from data-access ([#236](https://github.com/RequestNetwork/requestNetwork/issues/236)) ([74835f0](https://github.com/RequestNetwork/requestNetwork/commit/74835f0890de5816d0d29c43c1c253ecd756bd6e))
* skip failing etherscan tests ([#316](https://github.com/RequestNetwork/requestNetwork/issues/316)) ([55fa5d6](https://github.com/RequestNetwork/requestNetwork/commit/55fa5d6cb01495339ae141c567f155d6f277f17b))


### Features

* add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
* add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
* amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
* replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))



# 0.16.0 (2020-04-21)


### Features

* add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
* **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))
* add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))



# 0.15.0 (2020-04-06)


### Bug Fixes

* reduce number of call to btc providers in the tests ([#153](https://github.com/RequestNetwork/requestNetwork/issues/153)) ([469161b](https://github.com/RequestNetwork/requestNetwork/commit/469161b0a26b43c8bdf8ff7ceb7524dfd3d2029f))
* stateful currency network for ETH and BTC ([#161](https://github.com/RequestNetwork/requestNetwork/issues/161)) ([20ec53e](https://github.com/RequestNetwork/requestNetwork/commit/20ec53ea3be6b98252bdb3dc106eb4eedccd90c1))


### Features

* add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
* emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))



# 0.13.0 (2020-02-20)


### Bug Fixes

* ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))


### Features

* add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
* buffered ethereum storage  ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
* confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
* merge eth-proxy-contract into eth-input-data  ([#139](https://github.com/RequestNetwork/requestNetwork/issues/139)) ([380bfb9](https://github.com/RequestNetwork/requestNetwork/commit/380bfb9d036b04c5bb63d7dfef5f360bc40af985))
* persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))



# 0.12.0 (2020-01-16)


### Bug Fixes

* create an ETH request without refund address ([#82](https://github.com/RequestNetwork/requestNetwork/issues/82)) ([61664cd](https://github.com/RequestNetwork/requestNetwork/commit/61664cd41eef5341678b357a153379dfe2aae14e))
* mock BTC provider on tests ([#103](https://github.com/RequestNetwork/requestNetwork/issues/103)) ([d17f5bd](https://github.com/RequestNetwork/requestNetwork/commit/d17f5bd841690dcbb2615af126e66116685ee3be))
* use lowercase for payment reference ([#83](https://github.com/RequestNetwork/requestNetwork/issues/83)) ([6cbedeb](https://github.com/RequestNetwork/requestNetwork/commit/6cbedeb4d2e130d7ece1ba526cea9c17d6e545e0))


### Features

* **request-client.js:** add erc20 proxy contract PN in request-client.js ([#80](https://github.com/RequestNetwork/requestNetwork/issues/80)) ([53e8839](https://github.com/RequestNetwork/requestNetwork/commit/53e8839fad5a369257b4ba7908bc80abfa53c5f6))
* **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
* balance event timestamps ([#78](https://github.com/RequestNetwork/requestNetwork/issues/78)) ([ee2a78f](https://github.com/RequestNetwork/requestNetwork/commit/ee2a78ff5ba83d84739b743db283bb8abfca6b63))



# 0.10.0 (2019-12-04)


### Bug Fixes

* use ERC20 default network ([#623](https://github.com/RequestNetwork/requestNetwork/issues/623)) ([772dd37](https://github.com/RequestNetwork/requestNetwork/commit/772dd37877497a38b9cc74a08c70a6c5aecefa2d))


### Features

* add ETH paymentNetwork to request-client  ([#617](https://github.com/RequestNetwork/requestNetwork/issues/617)) ([84ed64e](https://github.com/RequestNetwork/requestNetwork/commit/84ed64ebf96a296155dc2d4d5e6c538344fb881b))
* ETH payment detection in request-client.js ([#626](https://github.com/RequestNetwork/requestNetwork/issues/626)) ([dc3b238](https://github.com/RequestNetwork/requestNetwork/commit/dc3b23827cff7d5466c27d5575515887c461c3b4))
* exposes currency utilities and list of all supported currencies ([#625](https://github.com/RequestNetwork/requestNetwork/issues/625)) ([eeac838](https://github.com/RequestNetwork/requestNetwork/commit/eeac8385025274fdada39ca3fb2182fc54d470d5))
* **request-client.js:** add an explanation when request not found ([#609](https://github.com/RequestNetwork/requestNetwork/issues/609)) ([3909958](https://github.com/RequestNetwork/requestNetwork/commit/39099580b65b86282d19a71ffad77f1b89767cca))





# [0.22.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.9.0...@requestnetwork/request-client.js@0.22.0) (2020-09-18)


### Bug Fixes

* clone the array topics to avoid modification of parameters ([#215](https://github.com/RequestNetwork/requestNetwork/issues/215)) ([7447c0b](https://github.com/RequestNetwork/requestNetwork/commit/7447c0be26b645ab54e1c82b1451570e88618861))
* don't remove failed transactions from data-access ([#236](https://github.com/RequestNetwork/requestNetwork/issues/236)) ([74835f0](https://github.com/RequestNetwork/requestNetwork/commit/74835f0890de5816d0d29c43c1c253ecd756bd6e))


### Features

* add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
* add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
* amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
* replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))



# 0.16.0 (2020-04-21)


### Features

* add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
* **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))
* add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))



# 0.15.0 (2020-04-06)


### Bug Fixes

* reduce number of call to btc providers in the tests ([#153](https://github.com/RequestNetwork/requestNetwork/issues/153)) ([469161b](https://github.com/RequestNetwork/requestNetwork/commit/469161b0a26b43c8bdf8ff7ceb7524dfd3d2029f))
* stateful currency network for ETH and BTC ([#161](https://github.com/RequestNetwork/requestNetwork/issues/161)) ([20ec53e](https://github.com/RequestNetwork/requestNetwork/commit/20ec53ea3be6b98252bdb3dc106eb4eedccd90c1))


### Features

* add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
* emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))



# 0.13.0 (2020-02-20)


### Bug Fixes

* ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))


### Features

* add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
* buffered ethereum storage  ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
* confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
* merge eth-proxy-contract into eth-input-data  ([#139](https://github.com/RequestNetwork/requestNetwork/issues/139)) ([380bfb9](https://github.com/RequestNetwork/requestNetwork/commit/380bfb9d036b04c5bb63d7dfef5f360bc40af985))
* persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))



# 0.12.0 (2020-01-16)


### Bug Fixes

* create an ETH request without refund address ([#82](https://github.com/RequestNetwork/requestNetwork/issues/82)) ([61664cd](https://github.com/RequestNetwork/requestNetwork/commit/61664cd41eef5341678b357a153379dfe2aae14e))
* mock BTC provider on tests ([#103](https://github.com/RequestNetwork/requestNetwork/issues/103)) ([d17f5bd](https://github.com/RequestNetwork/requestNetwork/commit/d17f5bd841690dcbb2615af126e66116685ee3be))
* use lowercase for payment reference ([#83](https://github.com/RequestNetwork/requestNetwork/issues/83)) ([6cbedeb](https://github.com/RequestNetwork/requestNetwork/commit/6cbedeb4d2e130d7ece1ba526cea9c17d6e545e0))


### Features

* **request-client.js:** add erc20 proxy contract PN in request-client.js ([#80](https://github.com/RequestNetwork/requestNetwork/issues/80)) ([53e8839](https://github.com/RequestNetwork/requestNetwork/commit/53e8839fad5a369257b4ba7908bc80abfa53c5f6))
* **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
* balance event timestamps ([#78](https://github.com/RequestNetwork/requestNetwork/issues/78)) ([ee2a78f](https://github.com/RequestNetwork/requestNetwork/commit/ee2a78ff5ba83d84739b743db283bb8abfca6b63))



# 0.10.0 (2019-12-04)


### Bug Fixes

* use ERC20 default network ([#623](https://github.com/RequestNetwork/requestNetwork/issues/623)) ([772dd37](https://github.com/RequestNetwork/requestNetwork/commit/772dd37877497a38b9cc74a08c70a6c5aecefa2d))


### Features

* add ETH paymentNetwork to request-client  ([#617](https://github.com/RequestNetwork/requestNetwork/issues/617)) ([84ed64e](https://github.com/RequestNetwork/requestNetwork/commit/84ed64ebf96a296155dc2d4d5e6c538344fb881b))
* ETH payment detection in request-client.js ([#626](https://github.com/RequestNetwork/requestNetwork/issues/626)) ([dc3b238](https://github.com/RequestNetwork/requestNetwork/commit/dc3b23827cff7d5466c27d5575515887c461c3b4))
* exposes currency utilities and list of all supported currencies ([#625](https://github.com/RequestNetwork/requestNetwork/issues/625)) ([eeac838](https://github.com/RequestNetwork/requestNetwork/commit/eeac8385025274fdada39ca3fb2182fc54d470d5))
* **request-client.js:** add an explanation when request not found ([#609](https://github.com/RequestNetwork/requestNetwork/issues/609)) ([3909958](https://github.com/RequestNetwork/requestNetwork/commit/39099580b65b86282d19a71ffad77f1b89767cca))





# [0.21.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.9.0...@requestnetwork/request-client.js@0.21.0) (2020-09-01)


### Bug Fixes

* clone the array topics to avoid modification of parameters ([#215](https://github.com/RequestNetwork/requestNetwork/issues/215)) ([7447c0b](https://github.com/RequestNetwork/requestNetwork/commit/7447c0be26b645ab54e1c82b1451570e88618861))
* don't remove failed transactions from data-access ([#236](https://github.com/RequestNetwork/requestNetwork/issues/236)) ([74835f0](https://github.com/RequestNetwork/requestNetwork/commit/74835f0890de5816d0d29c43c1c253ecd756bd6e))


### Features

* add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
* add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
* amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
* replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))



# 0.16.0 (2020-04-21)


### Features

* **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))
* add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
* add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))



# 0.15.0 (2020-04-06)


### Bug Fixes

* reduce number of call to btc providers in the tests ([#153](https://github.com/RequestNetwork/requestNetwork/issues/153)) ([469161b](https://github.com/RequestNetwork/requestNetwork/commit/469161b0a26b43c8bdf8ff7ceb7524dfd3d2029f))
* stateful currency network for ETH and BTC ([#161](https://github.com/RequestNetwork/requestNetwork/issues/161)) ([20ec53e](https://github.com/RequestNetwork/requestNetwork/commit/20ec53ea3be6b98252bdb3dc106eb4eedccd90c1))


### Features

* add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
* emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))



# 0.13.0 (2020-02-20)


### Bug Fixes

* ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))


### Features

* add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
* buffered ethereum storage  ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
* confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
* merge eth-proxy-contract into eth-input-data  ([#139](https://github.com/RequestNetwork/requestNetwork/issues/139)) ([380bfb9](https://github.com/RequestNetwork/requestNetwork/commit/380bfb9d036b04c5bb63d7dfef5f360bc40af985))
* persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))



# 0.12.0 (2020-01-16)


### Bug Fixes

* create an ETH request without refund address ([#82](https://github.com/RequestNetwork/requestNetwork/issues/82)) ([61664cd](https://github.com/RequestNetwork/requestNetwork/commit/61664cd41eef5341678b357a153379dfe2aae14e))
* mock BTC provider on tests ([#103](https://github.com/RequestNetwork/requestNetwork/issues/103)) ([d17f5bd](https://github.com/RequestNetwork/requestNetwork/commit/d17f5bd841690dcbb2615af126e66116685ee3be))
* use lowercase for payment reference ([#83](https://github.com/RequestNetwork/requestNetwork/issues/83)) ([6cbedeb](https://github.com/RequestNetwork/requestNetwork/commit/6cbedeb4d2e130d7ece1ba526cea9c17d6e545e0))


### Features

* balance event timestamps ([#78](https://github.com/RequestNetwork/requestNetwork/issues/78)) ([ee2a78f](https://github.com/RequestNetwork/requestNetwork/commit/ee2a78ff5ba83d84739b743db283bb8abfca6b63))
* **request-client.js:** add erc20 proxy contract PN in request-client.js ([#80](https://github.com/RequestNetwork/requestNetwork/issues/80)) ([53e8839](https://github.com/RequestNetwork/requestNetwork/commit/53e8839fad5a369257b4ba7908bc80abfa53c5f6))
* **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))



# 0.10.0 (2019-12-04)


### Bug Fixes

* use ERC20 default network ([#623](https://github.com/RequestNetwork/requestNetwork/issues/623)) ([772dd37](https://github.com/RequestNetwork/requestNetwork/commit/772dd37877497a38b9cc74a08c70a6c5aecefa2d))


### Features

* **request-client.js:** add an explanation when request not found ([#609](https://github.com/RequestNetwork/requestNetwork/issues/609)) ([3909958](https://github.com/RequestNetwork/requestNetwork/commit/39099580b65b86282d19a71ffad77f1b89767cca))
* add ETH paymentNetwork to request-client  ([#617](https://github.com/RequestNetwork/requestNetwork/issues/617)) ([84ed64e](https://github.com/RequestNetwork/requestNetwork/commit/84ed64ebf96a296155dc2d4d5e6c538344fb881b))
* ETH payment detection in request-client.js ([#626](https://github.com/RequestNetwork/requestNetwork/issues/626)) ([dc3b238](https://github.com/RequestNetwork/requestNetwork/commit/dc3b23827cff7d5466c27d5575515887c461c3b4))
* exposes currency utilities and list of all supported currencies ([#625](https://github.com/RequestNetwork/requestNetwork/issues/625)) ([eeac838](https://github.com/RequestNetwork/requestNetwork/commit/eeac8385025274fdada39ca3fb2182fc54d470d5))





# [0.20.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.9.0...@requestnetwork/request-client.js@0.20.0) (2020-08-27)


### Bug Fixes

* clone the array topics to avoid modification of parameters ([#215](https://github.com/RequestNetwork/requestNetwork/issues/215)) ([7447c0b](https://github.com/RequestNetwork/requestNetwork/commit/7447c0be26b645ab54e1c82b1451570e88618861))
* don't remove failed transactions from data-access ([#236](https://github.com/RequestNetwork/requestNetwork/issues/236)) ([74835f0](https://github.com/RequestNetwork/requestNetwork/commit/74835f0890de5816d0d29c43c1c253ecd756bd6e))


### Features

* add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
* add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
* amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
* replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))



# 0.16.0 (2020-04-21)


### Features

* **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))
* add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
* add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))



# 0.15.0 (2020-04-06)


### Bug Fixes

* reduce number of call to btc providers in the tests ([#153](https://github.com/RequestNetwork/requestNetwork/issues/153)) ([469161b](https://github.com/RequestNetwork/requestNetwork/commit/469161b0a26b43c8bdf8ff7ceb7524dfd3d2029f))
* stateful currency network for ETH and BTC ([#161](https://github.com/RequestNetwork/requestNetwork/issues/161)) ([20ec53e](https://github.com/RequestNetwork/requestNetwork/commit/20ec53ea3be6b98252bdb3dc106eb4eedccd90c1))


### Features

* add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
* emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))



# 0.13.0 (2020-02-20)


### Bug Fixes

* ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))


### Features

* add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
* buffered ethereum storage  ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
* confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
* merge eth-proxy-contract into eth-input-data  ([#139](https://github.com/RequestNetwork/requestNetwork/issues/139)) ([380bfb9](https://github.com/RequestNetwork/requestNetwork/commit/380bfb9d036b04c5bb63d7dfef5f360bc40af985))
* persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))



# 0.12.0 (2020-01-16)


### Bug Fixes

* create an ETH request without refund address ([#82](https://github.com/RequestNetwork/requestNetwork/issues/82)) ([61664cd](https://github.com/RequestNetwork/requestNetwork/commit/61664cd41eef5341678b357a153379dfe2aae14e))
* mock BTC provider on tests ([#103](https://github.com/RequestNetwork/requestNetwork/issues/103)) ([d17f5bd](https://github.com/RequestNetwork/requestNetwork/commit/d17f5bd841690dcbb2615af126e66116685ee3be))
* use lowercase for payment reference ([#83](https://github.com/RequestNetwork/requestNetwork/issues/83)) ([6cbedeb](https://github.com/RequestNetwork/requestNetwork/commit/6cbedeb4d2e130d7ece1ba526cea9c17d6e545e0))


### Features

* balance event timestamps ([#78](https://github.com/RequestNetwork/requestNetwork/issues/78)) ([ee2a78f](https://github.com/RequestNetwork/requestNetwork/commit/ee2a78ff5ba83d84739b743db283bb8abfca6b63))
* **request-client.js:** add erc20 proxy contract PN in request-client.js ([#80](https://github.com/RequestNetwork/requestNetwork/issues/80)) ([53e8839](https://github.com/RequestNetwork/requestNetwork/commit/53e8839fad5a369257b4ba7908bc80abfa53c5f6))
* **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))



# 0.10.0 (2019-12-04)


### Bug Fixes

* use ERC20 default network ([#623](https://github.com/RequestNetwork/requestNetwork/issues/623)) ([772dd37](https://github.com/RequestNetwork/requestNetwork/commit/772dd37877497a38b9cc74a08c70a6c5aecefa2d))


### Features

* **request-client.js:** add an explanation when request not found ([#609](https://github.com/RequestNetwork/requestNetwork/issues/609)) ([3909958](https://github.com/RequestNetwork/requestNetwork/commit/39099580b65b86282d19a71ffad77f1b89767cca))
* add ETH paymentNetwork to request-client  ([#617](https://github.com/RequestNetwork/requestNetwork/issues/617)) ([84ed64e](https://github.com/RequestNetwork/requestNetwork/commit/84ed64ebf96a296155dc2d4d5e6c538344fb881b))
* ETH payment detection in request-client.js ([#626](https://github.com/RequestNetwork/requestNetwork/issues/626)) ([dc3b238](https://github.com/RequestNetwork/requestNetwork/commit/dc3b23827cff7d5466c27d5575515887c461c3b4))
* exposes currency utilities and list of all supported currencies ([#625](https://github.com/RequestNetwork/requestNetwork/issues/625)) ([eeac838](https://github.com/RequestNetwork/requestNetwork/commit/eeac8385025274fdada39ca3fb2182fc54d470d5))





# [0.19.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.9.0...@requestnetwork/request-client.js@0.19.0) (2020-08-13)


### Bug Fixes

* clone the array topics to avoid modification of parameters ([#215](https://github.com/RequestNetwork/requestNetwork/issues/215)) ([7447c0b](https://github.com/RequestNetwork/requestNetwork/commit/7447c0be26b645ab54e1c82b1451570e88618861))
* don't remove failed transactions from data-access ([#236](https://github.com/RequestNetwork/requestNetwork/issues/236)) ([74835f0](https://github.com/RequestNetwork/requestNetwork/commit/74835f0890de5816d0d29c43c1c253ecd756bd6e))


### Features

* add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
* add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
* amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
* replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))



# 0.16.0 (2020-04-21)


### Features

* **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))
* add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
* add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))



# 0.15.0 (2020-04-06)


### Bug Fixes

* reduce number of call to btc providers in the tests ([#153](https://github.com/RequestNetwork/requestNetwork/issues/153)) ([469161b](https://github.com/RequestNetwork/requestNetwork/commit/469161b0a26b43c8bdf8ff7ceb7524dfd3d2029f))
* stateful currency network for ETH and BTC ([#161](https://github.com/RequestNetwork/requestNetwork/issues/161)) ([20ec53e](https://github.com/RequestNetwork/requestNetwork/commit/20ec53ea3be6b98252bdb3dc106eb4eedccd90c1))


### Features

* add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
* emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))



# 0.13.0 (2020-02-20)


### Bug Fixes

* ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))


### Features

* add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
* buffered ethereum storage  ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
* confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
* merge eth-proxy-contract into eth-input-data  ([#139](https://github.com/RequestNetwork/requestNetwork/issues/139)) ([380bfb9](https://github.com/RequestNetwork/requestNetwork/commit/380bfb9d036b04c5bb63d7dfef5f360bc40af985))
* persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))



# 0.12.0 (2020-01-16)


### Bug Fixes

* create an ETH request without refund address ([#82](https://github.com/RequestNetwork/requestNetwork/issues/82)) ([61664cd](https://github.com/RequestNetwork/requestNetwork/commit/61664cd41eef5341678b357a153379dfe2aae14e))
* mock BTC provider on tests ([#103](https://github.com/RequestNetwork/requestNetwork/issues/103)) ([d17f5bd](https://github.com/RequestNetwork/requestNetwork/commit/d17f5bd841690dcbb2615af126e66116685ee3be))
* use lowercase for payment reference ([#83](https://github.com/RequestNetwork/requestNetwork/issues/83)) ([6cbedeb](https://github.com/RequestNetwork/requestNetwork/commit/6cbedeb4d2e130d7ece1ba526cea9c17d6e545e0))


### Features

* balance event timestamps ([#78](https://github.com/RequestNetwork/requestNetwork/issues/78)) ([ee2a78f](https://github.com/RequestNetwork/requestNetwork/commit/ee2a78ff5ba83d84739b743db283bb8abfca6b63))
* **request-client.js:** add erc20 proxy contract PN in request-client.js ([#80](https://github.com/RequestNetwork/requestNetwork/issues/80)) ([53e8839](https://github.com/RequestNetwork/requestNetwork/commit/53e8839fad5a369257b4ba7908bc80abfa53c5f6))
* **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))



# 0.10.0 (2019-12-04)


### Bug Fixes

* use ERC20 default network ([#623](https://github.com/RequestNetwork/requestNetwork/issues/623)) ([772dd37](https://github.com/RequestNetwork/requestNetwork/commit/772dd37877497a38b9cc74a08c70a6c5aecefa2d))


### Features

* **request-client.js:** add an explanation when request not found ([#609](https://github.com/RequestNetwork/requestNetwork/issues/609)) ([3909958](https://github.com/RequestNetwork/requestNetwork/commit/39099580b65b86282d19a71ffad77f1b89767cca))
* add ETH paymentNetwork to request-client  ([#617](https://github.com/RequestNetwork/requestNetwork/issues/617)) ([84ed64e](https://github.com/RequestNetwork/requestNetwork/commit/84ed64ebf96a296155dc2d4d5e6c538344fb881b))
* ETH payment detection in request-client.js ([#626](https://github.com/RequestNetwork/requestNetwork/issues/626)) ([dc3b238](https://github.com/RequestNetwork/requestNetwork/commit/dc3b23827cff7d5466c27d5575515887c461c3b4))
* exposes currency utilities and list of all supported currencies ([#625](https://github.com/RequestNetwork/requestNetwork/issues/625)) ([eeac838](https://github.com/RequestNetwork/requestNetwork/commit/eeac8385025274fdada39ca3fb2182fc54d470d5))





# [0.18.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.9.0...@requestnetwork/request-client.js@0.18.0) (2020-06-29)


### Bug Fixes

* clone the array topics to avoid modification of parameters ([#215](https://github.com/RequestNetwork/requestNetwork/issues/215)) ([7447c0b](https://github.com/RequestNetwork/requestNetwork/commit/7447c0be26b645ab54e1c82b1451570e88618861))
* don't remove failed transactions from data-access ([#236](https://github.com/RequestNetwork/requestNetwork/issues/236)) ([74835f0](https://github.com/RequestNetwork/requestNetwork/commit/74835f0890de5816d0d29c43c1c253ecd756bd6e))


### Features

* add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
* add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
* amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
* replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))



# 0.16.0 (2020-04-21)


### Features

* **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))
* add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
* add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))



# 0.15.0 (2020-04-06)


### Bug Fixes

* reduce number of call to btc providers in the tests ([#153](https://github.com/RequestNetwork/requestNetwork/issues/153)) ([469161b](https://github.com/RequestNetwork/requestNetwork/commit/469161b0a26b43c8bdf8ff7ceb7524dfd3d2029f))
* stateful currency network for ETH and BTC ([#161](https://github.com/RequestNetwork/requestNetwork/issues/161)) ([20ec53e](https://github.com/RequestNetwork/requestNetwork/commit/20ec53ea3be6b98252bdb3dc106eb4eedccd90c1))


### Features

* add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
* emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))



# 0.13.0 (2020-02-20)


### Bug Fixes

* ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))


### Features

* add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
* buffered ethereum storage  ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
* confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
* merge eth-proxy-contract into eth-input-data  ([#139](https://github.com/RequestNetwork/requestNetwork/issues/139)) ([380bfb9](https://github.com/RequestNetwork/requestNetwork/commit/380bfb9d036b04c5bb63d7dfef5f360bc40af985))
* persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))



# 0.12.0 (2020-01-16)


### Bug Fixes

* create an ETH request without refund address ([#82](https://github.com/RequestNetwork/requestNetwork/issues/82)) ([61664cd](https://github.com/RequestNetwork/requestNetwork/commit/61664cd41eef5341678b357a153379dfe2aae14e))
* mock BTC provider on tests ([#103](https://github.com/RequestNetwork/requestNetwork/issues/103)) ([d17f5bd](https://github.com/RequestNetwork/requestNetwork/commit/d17f5bd841690dcbb2615af126e66116685ee3be))
* use lowercase for payment reference ([#83](https://github.com/RequestNetwork/requestNetwork/issues/83)) ([6cbedeb](https://github.com/RequestNetwork/requestNetwork/commit/6cbedeb4d2e130d7ece1ba526cea9c17d6e545e0))


### Features

* balance event timestamps ([#78](https://github.com/RequestNetwork/requestNetwork/issues/78)) ([ee2a78f](https://github.com/RequestNetwork/requestNetwork/commit/ee2a78ff5ba83d84739b743db283bb8abfca6b63))
* **request-client.js:** add erc20 proxy contract PN in request-client.js ([#80](https://github.com/RequestNetwork/requestNetwork/issues/80)) ([53e8839](https://github.com/RequestNetwork/requestNetwork/commit/53e8839fad5a369257b4ba7908bc80abfa53c5f6))
* **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))



# 0.10.0 (2019-12-04)


### Bug Fixes

* use ERC20 default network ([#623](https://github.com/RequestNetwork/requestNetwork/issues/623)) ([772dd37](https://github.com/RequestNetwork/requestNetwork/commit/772dd37877497a38b9cc74a08c70a6c5aecefa2d))


### Features

* **request-client.js:** add an explanation when request not found ([#609](https://github.com/RequestNetwork/requestNetwork/issues/609)) ([3909958](https://github.com/RequestNetwork/requestNetwork/commit/39099580b65b86282d19a71ffad77f1b89767cca))
* add ETH paymentNetwork to request-client  ([#617](https://github.com/RequestNetwork/requestNetwork/issues/617)) ([84ed64e](https://github.com/RequestNetwork/requestNetwork/commit/84ed64ebf96a296155dc2d4d5e6c538344fb881b))
* ETH payment detection in request-client.js ([#626](https://github.com/RequestNetwork/requestNetwork/issues/626)) ([dc3b238](https://github.com/RequestNetwork/requestNetwork/commit/dc3b23827cff7d5466c27d5575515887c461c3b4))
* exposes currency utilities and list of all supported currencies ([#625](https://github.com/RequestNetwork/requestNetwork/issues/625)) ([eeac838](https://github.com/RequestNetwork/requestNetwork/commit/eeac8385025274fdada39ca3fb2182fc54d470d5))





# [0.17.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.9.0...@requestnetwork/request-client.js@0.17.0) (2020-05-04)


### Features

* add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))



# 0.16.0 (2020-04-21)


### Features

* **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))
* add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
* add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))



# 0.15.0 (2020-04-06)


### Bug Fixes

* reduce number of call to btc providers in the tests ([#153](https://github.com/RequestNetwork/requestNetwork/issues/153)) ([469161b](https://github.com/RequestNetwork/requestNetwork/commit/469161b0a26b43c8bdf8ff7ceb7524dfd3d2029f))
* stateful currency network for ETH and BTC ([#161](https://github.com/RequestNetwork/requestNetwork/issues/161)) ([20ec53e](https://github.com/RequestNetwork/requestNetwork/commit/20ec53ea3be6b98252bdb3dc106eb4eedccd90c1))


### Features

* add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
* emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))



# 0.13.0 (2020-02-20)


### Bug Fixes

* ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))


### Features

* add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
* buffered ethereum storage  ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
* confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
* merge eth-proxy-contract into eth-input-data  ([#139](https://github.com/RequestNetwork/requestNetwork/issues/139)) ([380bfb9](https://github.com/RequestNetwork/requestNetwork/commit/380bfb9d036b04c5bb63d7dfef5f360bc40af985))
* persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))



# 0.12.0 (2020-01-16)


### Bug Fixes

* create an ETH request without refund address ([#82](https://github.com/RequestNetwork/requestNetwork/issues/82)) ([61664cd](https://github.com/RequestNetwork/requestNetwork/commit/61664cd41eef5341678b357a153379dfe2aae14e))
* mock BTC provider on tests ([#103](https://github.com/RequestNetwork/requestNetwork/issues/103)) ([d17f5bd](https://github.com/RequestNetwork/requestNetwork/commit/d17f5bd841690dcbb2615af126e66116685ee3be))
* use lowercase for payment reference ([#83](https://github.com/RequestNetwork/requestNetwork/issues/83)) ([6cbedeb](https://github.com/RequestNetwork/requestNetwork/commit/6cbedeb4d2e130d7ece1ba526cea9c17d6e545e0))


### Features

* balance event timestamps ([#78](https://github.com/RequestNetwork/requestNetwork/issues/78)) ([ee2a78f](https://github.com/RequestNetwork/requestNetwork/commit/ee2a78ff5ba83d84739b743db283bb8abfca6b63))
* **request-client.js:** add erc20 proxy contract PN in request-client.js ([#80](https://github.com/RequestNetwork/requestNetwork/issues/80)) ([53e8839](https://github.com/RequestNetwork/requestNetwork/commit/53e8839fad5a369257b4ba7908bc80abfa53c5f6))
* **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))



# 0.10.0 (2019-12-04)


### Bug Fixes

* use ERC20 default network ([#623](https://github.com/RequestNetwork/requestNetwork/issues/623)) ([772dd37](https://github.com/RequestNetwork/requestNetwork/commit/772dd37877497a38b9cc74a08c70a6c5aecefa2d))


### Features

* **request-client.js:** add an explanation when request not found ([#609](https://github.com/RequestNetwork/requestNetwork/issues/609)) ([3909958](https://github.com/RequestNetwork/requestNetwork/commit/39099580b65b86282d19a71ffad77f1b89767cca))
* add ETH paymentNetwork to request-client  ([#617](https://github.com/RequestNetwork/requestNetwork/issues/617)) ([84ed64e](https://github.com/RequestNetwork/requestNetwork/commit/84ed64ebf96a296155dc2d4d5e6c538344fb881b))
* ETH payment detection in request-client.js ([#626](https://github.com/RequestNetwork/requestNetwork/issues/626)) ([dc3b238](https://github.com/RequestNetwork/requestNetwork/commit/dc3b23827cff7d5466c27d5575515887c461c3b4))
* exposes currency utilities and list of all supported currencies ([#625](https://github.com/RequestNetwork/requestNetwork/issues/625)) ([eeac838](https://github.com/RequestNetwork/requestNetwork/commit/eeac8385025274fdada39ca3fb2182fc54d470d5))





# [0.16.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.9.0...@requestnetwork/request-client.js@0.16.0) (2020-04-21)


### Features

* **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))
* add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
* add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))



# 0.15.0 (2020-04-06)


### Bug Fixes

* reduce number of call to btc providers in the tests ([#153](https://github.com/RequestNetwork/requestNetwork/issues/153)) ([469161b](https://github.com/RequestNetwork/requestNetwork/commit/469161b0a26b43c8bdf8ff7ceb7524dfd3d2029f))
* stateful currency network for ETH and BTC ([#161](https://github.com/RequestNetwork/requestNetwork/issues/161)) ([20ec53e](https://github.com/RequestNetwork/requestNetwork/commit/20ec53ea3be6b98252bdb3dc106eb4eedccd90c1))


### Features

* add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
* emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))



# 0.13.0 (2020-02-20)


### Bug Fixes

* ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))


### Features

* add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
* buffered ethereum storage  ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
* confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
* merge eth-proxy-contract into eth-input-data  ([#139](https://github.com/RequestNetwork/requestNetwork/issues/139)) ([380bfb9](https://github.com/RequestNetwork/requestNetwork/commit/380bfb9d036b04c5bb63d7dfef5f360bc40af985))
* persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))



# 0.12.0 (2020-01-16)


### Bug Fixes

* create an ETH request without refund address ([#82](https://github.com/RequestNetwork/requestNetwork/issues/82)) ([61664cd](https://github.com/RequestNetwork/requestNetwork/commit/61664cd41eef5341678b357a153379dfe2aae14e))
* mock BTC provider on tests ([#103](https://github.com/RequestNetwork/requestNetwork/issues/103)) ([d17f5bd](https://github.com/RequestNetwork/requestNetwork/commit/d17f5bd841690dcbb2615af126e66116685ee3be))
* use lowercase for payment reference ([#83](https://github.com/RequestNetwork/requestNetwork/issues/83)) ([6cbedeb](https://github.com/RequestNetwork/requestNetwork/commit/6cbedeb4d2e130d7ece1ba526cea9c17d6e545e0))


### Features

* balance event timestamps ([#78](https://github.com/RequestNetwork/requestNetwork/issues/78)) ([ee2a78f](https://github.com/RequestNetwork/requestNetwork/commit/ee2a78ff5ba83d84739b743db283bb8abfca6b63))
* **request-client.js:** add erc20 proxy contract PN in request-client.js ([#80](https://github.com/RequestNetwork/requestNetwork/issues/80)) ([53e8839](https://github.com/RequestNetwork/requestNetwork/commit/53e8839fad5a369257b4ba7908bc80abfa53c5f6))
* **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))



# 0.10.0 (2019-12-04)


### Bug Fixes

* use ERC20 default network ([#623](https://github.com/RequestNetwork/requestNetwork/issues/623)) ([772dd37](https://github.com/RequestNetwork/requestNetwork/commit/772dd37877497a38b9cc74a08c70a6c5aecefa2d))


### Features

* **request-client.js:** add an explanation when request not found ([#609](https://github.com/RequestNetwork/requestNetwork/issues/609)) ([3909958](https://github.com/RequestNetwork/requestNetwork/commit/39099580b65b86282d19a71ffad77f1b89767cca))
* add ETH paymentNetwork to request-client  ([#617](https://github.com/RequestNetwork/requestNetwork/issues/617)) ([84ed64e](https://github.com/RequestNetwork/requestNetwork/commit/84ed64ebf96a296155dc2d4d5e6c538344fb881b))
* ETH payment detection in request-client.js ([#626](https://github.com/RequestNetwork/requestNetwork/issues/626)) ([dc3b238](https://github.com/RequestNetwork/requestNetwork/commit/dc3b23827cff7d5466c27d5575515887c461c3b4))
* exposes currency utilities and list of all supported currencies ([#625](https://github.com/RequestNetwork/requestNetwork/issues/625)) ([eeac838](https://github.com/RequestNetwork/requestNetwork/commit/eeac8385025274fdada39ca3fb2182fc54d470d5))





# [0.15.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.9.0...@requestnetwork/request-client.js@0.15.0) (2020-04-06)


### Bug Fixes

* reduce number of call to btc providers in the tests ([#153](https://github.com/RequestNetwork/requestNetwork/issues/153)) ([469161b](https://github.com/RequestNetwork/requestNetwork/commit/469161b0a26b43c8bdf8ff7ceb7524dfd3d2029f))
* stateful currency network for ETH and BTC ([#161](https://github.com/RequestNetwork/requestNetwork/issues/161)) ([20ec53e](https://github.com/RequestNetwork/requestNetwork/commit/20ec53ea3be6b98252bdb3dc106eb4eedccd90c1))


### Features

* add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
* emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))



# 0.13.0 (2020-02-20)


### Bug Fixes

* ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))


### Features

* add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
* buffered ethereum storage  ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
* confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
* merge eth-proxy-contract into eth-input-data  ([#139](https://github.com/RequestNetwork/requestNetwork/issues/139)) ([380bfb9](https://github.com/RequestNetwork/requestNetwork/commit/380bfb9d036b04c5bb63d7dfef5f360bc40af985))
* persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))



# 0.12.0 (2020-01-16)


### Bug Fixes

* create an ETH request without refund address ([#82](https://github.com/RequestNetwork/requestNetwork/issues/82)) ([61664cd](https://github.com/RequestNetwork/requestNetwork/commit/61664cd41eef5341678b357a153379dfe2aae14e))
* mock BTC provider on tests ([#103](https://github.com/RequestNetwork/requestNetwork/issues/103)) ([d17f5bd](https://github.com/RequestNetwork/requestNetwork/commit/d17f5bd841690dcbb2615af126e66116685ee3be))
* use lowercase for payment reference ([#83](https://github.com/RequestNetwork/requestNetwork/issues/83)) ([6cbedeb](https://github.com/RequestNetwork/requestNetwork/commit/6cbedeb4d2e130d7ece1ba526cea9c17d6e545e0))


### Features

* balance event timestamps ([#78](https://github.com/RequestNetwork/requestNetwork/issues/78)) ([ee2a78f](https://github.com/RequestNetwork/requestNetwork/commit/ee2a78ff5ba83d84739b743db283bb8abfca6b63))
* **request-client.js:** add erc20 proxy contract PN in request-client.js ([#80](https://github.com/RequestNetwork/requestNetwork/issues/80)) ([53e8839](https://github.com/RequestNetwork/requestNetwork/commit/53e8839fad5a369257b4ba7908bc80abfa53c5f6))
* **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))



# 0.10.0 (2019-12-04)


### Bug Fixes

* use ERC20 default network ([#623](https://github.com/RequestNetwork/requestNetwork/issues/623)) ([772dd37](https://github.com/RequestNetwork/requestNetwork/commit/772dd37877497a38b9cc74a08c70a6c5aecefa2d))


### Features

* **request-client.js:** add an explanation when request not found ([#609](https://github.com/RequestNetwork/requestNetwork/issues/609)) ([3909958](https://github.com/RequestNetwork/requestNetwork/commit/39099580b65b86282d19a71ffad77f1b89767cca))
* add ETH paymentNetwork to request-client  ([#617](https://github.com/RequestNetwork/requestNetwork/issues/617)) ([84ed64e](https://github.com/RequestNetwork/requestNetwork/commit/84ed64ebf96a296155dc2d4d5e6c538344fb881b))
* ETH payment detection in request-client.js ([#626](https://github.com/RequestNetwork/requestNetwork/issues/626)) ([dc3b238](https://github.com/RequestNetwork/requestNetwork/commit/dc3b23827cff7d5466c27d5575515887c461c3b4))
* exposes currency utilities and list of all supported currencies ([#625](https://github.com/RequestNetwork/requestNetwork/issues/625)) ([eeac838](https://github.com/RequestNetwork/requestNetwork/commit/eeac8385025274fdada39ca3fb2182fc54d470d5))





# [0.14.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.9.0...@requestnetwork/request-client.js@0.14.0) (2020-03-23)


### Bug Fixes

* reduce number of call to btc providers in the tests ([#153](https://github.com/RequestNetwork/requestNetwork/issues/153)) ([469161b](https://github.com/RequestNetwork/requestNetwork/commit/469161b0a26b43c8bdf8ff7ceb7524dfd3d2029f))
* stateful currency network for ETH and BTC ([#161](https://github.com/RequestNetwork/requestNetwork/issues/161)) ([20ec53e](https://github.com/RequestNetwork/requestNetwork/commit/20ec53ea3be6b98252bdb3dc106eb4eedccd90c1))


### Features

* add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))



# 0.13.0 (2020-02-20)


### Bug Fixes

* ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))


### Features

* add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
* buffered ethereum storage  ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
* confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
* merge eth-proxy-contract into eth-input-data  ([#139](https://github.com/RequestNetwork/requestNetwork/issues/139)) ([380bfb9](https://github.com/RequestNetwork/requestNetwork/commit/380bfb9d036b04c5bb63d7dfef5f360bc40af985))
* persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))



# 0.12.0 (2020-01-16)


### Bug Fixes

* create an ETH request without refund address ([#82](https://github.com/RequestNetwork/requestNetwork/issues/82)) ([61664cd](https://github.com/RequestNetwork/requestNetwork/commit/61664cd41eef5341678b357a153379dfe2aae14e))
* mock BTC provider on tests ([#103](https://github.com/RequestNetwork/requestNetwork/issues/103)) ([d17f5bd](https://github.com/RequestNetwork/requestNetwork/commit/d17f5bd841690dcbb2615af126e66116685ee3be))
* use lowercase for payment reference ([#83](https://github.com/RequestNetwork/requestNetwork/issues/83)) ([6cbedeb](https://github.com/RequestNetwork/requestNetwork/commit/6cbedeb4d2e130d7ece1ba526cea9c17d6e545e0))


### Features

* balance event timestamps ([#78](https://github.com/RequestNetwork/requestNetwork/issues/78)) ([ee2a78f](https://github.com/RequestNetwork/requestNetwork/commit/ee2a78ff5ba83d84739b743db283bb8abfca6b63))
* **request-client.js:** add erc20 proxy contract PN in request-client.js ([#80](https://github.com/RequestNetwork/requestNetwork/issues/80)) ([53e8839](https://github.com/RequestNetwork/requestNetwork/commit/53e8839fad5a369257b4ba7908bc80abfa53c5f6))
* **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))



# 0.10.0 (2019-12-04)


### Bug Fixes

* use ERC20 default network ([#623](https://github.com/RequestNetwork/requestNetwork/issues/623)) ([772dd37](https://github.com/RequestNetwork/requestNetwork/commit/772dd37877497a38b9cc74a08c70a6c5aecefa2d))


### Features

* **request-client.js:** add an explanation when request not found ([#609](https://github.com/RequestNetwork/requestNetwork/issues/609)) ([3909958](https://github.com/RequestNetwork/requestNetwork/commit/39099580b65b86282d19a71ffad77f1b89767cca))
* add ETH paymentNetwork to request-client  ([#617](https://github.com/RequestNetwork/requestNetwork/issues/617)) ([84ed64e](https://github.com/RequestNetwork/requestNetwork/commit/84ed64ebf96a296155dc2d4d5e6c538344fb881b))
* ETH payment detection in request-client.js ([#626](https://github.com/RequestNetwork/requestNetwork/issues/626)) ([dc3b238](https://github.com/RequestNetwork/requestNetwork/commit/dc3b23827cff7d5466c27d5575515887c461c3b4))
* exposes currency utilities and list of all supported currencies ([#625](https://github.com/RequestNetwork/requestNetwork/issues/625)) ([eeac838](https://github.com/RequestNetwork/requestNetwork/commit/eeac8385025274fdada39ca3fb2182fc54d470d5))





# [0.13.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.9.0...@requestnetwork/request-client.js@0.13.0) (2020-02-20)


### Bug Fixes

* ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))


### Features

* add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
* buffered ethereum storage  ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
* confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
* merge eth-proxy-contract into eth-input-data  ([#139](https://github.com/RequestNetwork/requestNetwork/issues/139)) ([380bfb9](https://github.com/RequestNetwork/requestNetwork/commit/380bfb9d036b04c5bb63d7dfef5f360bc40af985))
* persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))



# 0.12.0 (2020-01-16)


### Bug Fixes

* create an ETH request without refund address ([#82](https://github.com/RequestNetwork/requestNetwork/issues/82)) ([61664cd](https://github.com/RequestNetwork/requestNetwork/commit/61664cd41eef5341678b357a153379dfe2aae14e))
* mock BTC provider on tests ([#103](https://github.com/RequestNetwork/requestNetwork/issues/103)) ([d17f5bd](https://github.com/RequestNetwork/requestNetwork/commit/d17f5bd841690dcbb2615af126e66116685ee3be))
* use lowercase for payment reference ([#83](https://github.com/RequestNetwork/requestNetwork/issues/83)) ([6cbedeb](https://github.com/RequestNetwork/requestNetwork/commit/6cbedeb4d2e130d7ece1ba526cea9c17d6e545e0))


### Features

* balance event timestamps ([#78](https://github.com/RequestNetwork/requestNetwork/issues/78)) ([ee2a78f](https://github.com/RequestNetwork/requestNetwork/commit/ee2a78ff5ba83d84739b743db283bb8abfca6b63))
* **request-client.js:** add erc20 proxy contract PN in request-client.js ([#80](https://github.com/RequestNetwork/requestNetwork/issues/80)) ([53e8839](https://github.com/RequestNetwork/requestNetwork/commit/53e8839fad5a369257b4ba7908bc80abfa53c5f6))
* **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))



# 0.10.0 (2019-12-04)


### Bug Fixes

* use ERC20 default network ([#623](https://github.com/RequestNetwork/requestNetwork/issues/623)) ([772dd37](https://github.com/RequestNetwork/requestNetwork/commit/772dd37877497a38b9cc74a08c70a6c5aecefa2d))


### Features

* **request-client.js:** add an explanation when request not found ([#609](https://github.com/RequestNetwork/requestNetwork/issues/609)) ([3909958](https://github.com/RequestNetwork/requestNetwork/commit/39099580b65b86282d19a71ffad77f1b89767cca))
* add ETH paymentNetwork to request-client  ([#617](https://github.com/RequestNetwork/requestNetwork/issues/617)) ([84ed64e](https://github.com/RequestNetwork/requestNetwork/commit/84ed64ebf96a296155dc2d4d5e6c538344fb881b))
* ETH payment detection in request-client.js ([#626](https://github.com/RequestNetwork/requestNetwork/issues/626)) ([dc3b238](https://github.com/RequestNetwork/requestNetwork/commit/dc3b23827cff7d5466c27d5575515887c461c3b4))
* exposes currency utilities and list of all supported currencies ([#625](https://github.com/RequestNetwork/requestNetwork/issues/625)) ([eeac838](https://github.com/RequestNetwork/requestNetwork/commit/eeac8385025274fdada39ca3fb2182fc54d470d5))





# [0.12.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.9.0...@requestnetwork/request-client.js@0.12.0) (2020-01-16)


### Bug Fixes

* create an ETH request without refund address ([#82](https://github.com/RequestNetwork/requestNetwork/issues/82)) ([61664cd](https://github.com/RequestNetwork/requestNetwork/commit/61664cd41eef5341678b357a153379dfe2aae14e))
* mock BTC provider on tests ([#103](https://github.com/RequestNetwork/requestNetwork/issues/103)) ([d17f5bd](https://github.com/RequestNetwork/requestNetwork/commit/d17f5bd841690dcbb2615af126e66116685ee3be))
* use lowercase for payment reference ([#83](https://github.com/RequestNetwork/requestNetwork/issues/83)) ([6cbedeb](https://github.com/RequestNetwork/requestNetwork/commit/6cbedeb4d2e130d7ece1ba526cea9c17d6e545e0))


### Features

* balance event timestamps ([#78](https://github.com/RequestNetwork/requestNetwork/issues/78)) ([ee2a78f](https://github.com/RequestNetwork/requestNetwork/commit/ee2a78ff5ba83d84739b743db283bb8abfca6b63))
* **request-client.js:** add erc20 proxy contract PN in request-client.js ([#80](https://github.com/RequestNetwork/requestNetwork/issues/80)) ([53e8839](https://github.com/RequestNetwork/requestNetwork/commit/53e8839fad5a369257b4ba7908bc80abfa53c5f6))
* **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))



# 0.10.0 (2019-12-04)


### Bug Fixes

* use ERC20 default network ([#623](https://github.com/RequestNetwork/requestNetwork/issues/623)) ([772dd37](https://github.com/RequestNetwork/requestNetwork/commit/772dd37877497a38b9cc74a08c70a6c5aecefa2d))


### Features

* **request-client.js:** add an explanation when request not found ([#609](https://github.com/RequestNetwork/requestNetwork/issues/609)) ([3909958](https://github.com/RequestNetwork/requestNetwork/commit/39099580b65b86282d19a71ffad77f1b89767cca))
* add ETH paymentNetwork to request-client  ([#617](https://github.com/RequestNetwork/requestNetwork/issues/617)) ([84ed64e](https://github.com/RequestNetwork/requestNetwork/commit/84ed64ebf96a296155dc2d4d5e6c538344fb881b))
* ETH payment detection in request-client.js ([#626](https://github.com/RequestNetwork/requestNetwork/issues/626)) ([dc3b238](https://github.com/RequestNetwork/requestNetwork/commit/dc3b23827cff7d5466c27d5575515887c461c3b4))
* exposes currency utilities and list of all supported currencies ([#625](https://github.com/RequestNetwork/requestNetwork/issues/625)) ([eeac838](https://github.com/RequestNetwork/requestNetwork/commit/eeac8385025274fdada39ca3fb2182fc54d470d5))





# [0.11.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.9.0...@requestnetwork/request-client.js@0.11.0) (2019-12-18)


### Bug Fixes

* create an ETH request without refund address ([#82](https://github.com/RequestNetwork/requestNetwork/issues/82)) ([61664cd](https://github.com/RequestNetwork/requestNetwork/commit/61664cd41eef5341678b357a153379dfe2aae14e))
* use lowercase for payment reference ([#83](https://github.com/RequestNetwork/requestNetwork/issues/83)) ([6cbedeb](https://github.com/RequestNetwork/requestNetwork/commit/6cbedeb4d2e130d7ece1ba526cea9c17d6e545e0))


### Features

* balance event timestamps ([#78](https://github.com/RequestNetwork/requestNetwork/issues/78)) ([ee2a78f](https://github.com/RequestNetwork/requestNetwork/commit/ee2a78ff5ba83d84739b743db283bb8abfca6b63))
* **request-client.js:** add erc20 proxy contract PN in request-client.js ([#80](https://github.com/RequestNetwork/requestNetwork/issues/80)) ([53e8839](https://github.com/RequestNetwork/requestNetwork/commit/53e8839fad5a369257b4ba7908bc80abfa53c5f6))
* **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))



# 0.10.0 (2019-12-04)


### Bug Fixes

* use ERC20 default network ([#623](https://github.com/RequestNetwork/requestNetwork/issues/623)) ([772dd37](https://github.com/RequestNetwork/requestNetwork/commit/772dd37877497a38b9cc74a08c70a6c5aecefa2d))


### Features

* **request-client.js:** add an explanation when request not found ([#609](https://github.com/RequestNetwork/requestNetwork/issues/609)) ([3909958](https://github.com/RequestNetwork/requestNetwork/commit/39099580b65b86282d19a71ffad77f1b89767cca))
* add ETH paymentNetwork to request-client  ([#617](https://github.com/RequestNetwork/requestNetwork/issues/617)) ([84ed64e](https://github.com/RequestNetwork/requestNetwork/commit/84ed64ebf96a296155dc2d4d5e6c538344fb881b))
* ETH payment detection in request-client.js ([#626](https://github.com/RequestNetwork/requestNetwork/issues/626)) ([dc3b238](https://github.com/RequestNetwork/requestNetwork/commit/dc3b23827cff7d5466c27d5575515887c461c3b4))
* exposes currency utilities and list of all supported currencies ([#625](https://github.com/RequestNetwork/requestNetwork/issues/625)) ([eeac838](https://github.com/RequestNetwork/requestNetwork/commit/eeac8385025274fdada39ca3fb2182fc54d470d5))





# [0.10.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.9.0...@requestnetwork/request-client.js@0.10.0) (2019-12-04)


### Bug Fixes

* use ERC20 default network ([#623](https://github.com/RequestNetwork/requestNetwork/issues/623)) ([772dd37](https://github.com/RequestNetwork/requestNetwork/commit/772dd37877497a38b9cc74a08c70a6c5aecefa2d))


### Features

* **request-client.js:** add an explanation when request not found ([#609](https://github.com/RequestNetwork/requestNetwork/issues/609)) ([3909958](https://github.com/RequestNetwork/requestNetwork/commit/39099580b65b86282d19a71ffad77f1b89767cca))
* add ETH paymentNetwork to request-client  ([#617](https://github.com/RequestNetwork/requestNetwork/issues/617)) ([84ed64e](https://github.com/RequestNetwork/requestNetwork/commit/84ed64ebf96a296155dc2d4d5e6c538344fb881b))
* ETH payment detection in request-client.js ([#626](https://github.com/RequestNetwork/requestNetwork/issues/626)) ([dc3b238](https://github.com/RequestNetwork/requestNetwork/commit/dc3b23827cff7d5466c27d5575515887c461c3b4))
* exposes currency utilities and list of all supported currencies ([#625](https://github.com/RequestNetwork/requestNetwork/issues/625)) ([eeac838](https://github.com/RequestNetwork/requestNetwork/commit/eeac8385025274fdada39ca3fb2182fc54d470d5))





# [0.9.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.8.0...@requestnetwork/request-client.js@0.9.0) (2019-11-20)


### Bug Fixes

* throw when no encryption parameters is given to create an encrypted request ([#593](https://github.com/RequestNetwork/requestNetwork/issues/593)) ([d18a894](https://github.com/RequestNetwork/requestNetwork/commit/d18a8946085920f13a43e269814fba857f24039a))


### Features

* add DAI payment detection ([#574](https://github.com/RequestNetwork/requestNetwork/issues/574)) ([8d56e00](https://github.com/RequestNetwork/requestNetwork/commit/8d56e0058e40e75700e981ab3525bbefe2f05c6d))
* add ERC20 currency list ([#584](https://github.com/RequestNetwork/requestNetwork/issues/584)) ([6e0ed87](https://github.com/RequestNetwork/requestNetwork/commit/6e0ed8758ffd5edcd9a498028c2b6873c26d49ca))
* custom bitcoin detection provider ([#591](https://github.com/RequestNetwork/requestNetwork/issues/591)) ([e7bde06](https://github.com/RequestNetwork/requestNetwork/commit/e7bde06d664edbb175b6e4774beab8d4415007e0))
* request-client read currency as string ([#601](https://github.com/RequestNetwork/requestNetwork/issues/601)) ([efacfb2](https://github.com/RequestNetwork/requestNetwork/commit/efacfb2b91eb006464d4808c37fee827df2c5862))
* translate currency string to object ([#581](https://github.com/RequestNetwork/requestNetwork/issues/581)) ([b220d20](https://github.com/RequestNetwork/requestNetwork/commit/b220d20ae1866e8db076718989726334b91c0f44))
* validate role for increase & decrease ([#590](https://github.com/RequestNetwork/requestNetwork/issues/590)) ([4793782](https://github.com/RequestNetwork/requestNetwork/commit/47937828a0f42e912eda440be4e277f26aa51bdb))
* Validation of accept, cancel and add extension data ([#599](https://github.com/RequestNetwork/requestNetwork/issues/599)) ([8f7798e](https://github.com/RequestNetwork/requestNetwork/commit/8f7798e6e71819e5201efaf73678ff5b71b52503))





# [0.8.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-client.js@0.7.0...@requestnetwork/request-client.js@0.8.0) (2019-10-21)


### Features

* add ERC20 payment network ([#568](https://github.com/RequestNetwork/requestNetwork/issues/568)) ([8d820d4](https://github.com/RequestNetwork/requestNetwork/commit/8d820d4))
* add ERC20 paymentNetwork to request-client ([#569](https://github.com/RequestNetwork/requestNetwork/issues/569)) ([21ebc48](https://github.com/RequestNetwork/requestNetwork/commit/21ebc48))
* create encrypted request through request-client.js ([#536](https://github.com/RequestNetwork/requestNetwork/issues/536)) ([35678dd](https://github.com/RequestNetwork/requestNetwork/commit/35678dd))






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
