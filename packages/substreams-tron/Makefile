.PHONY: build
build:
	cargo build --target wasm32-unknown-unknown --release

.PHONY: protogen
protogen:
	substreams protogen ./substreams.yaml --exclude-paths="sf/substreams,google"

.PHONY: package
package: build
	substreams pack ./substreams.yaml

.PHONY: gui
gui: build
	substreams gui ./substreams.yaml map_erc20_fee_proxy_payments -e tron.substreams.pinax.network:443

.PHONY: run
run: build
	substreams run ./substreams.yaml map_erc20_fee_proxy_payments -e tron.substreams.pinax.network:443 --start-block 63208782 --stop-block +100

.PHONY: clean
clean:
	cargo clean
	rm -f *.spkg

.PHONY: test
test:
	cargo test
