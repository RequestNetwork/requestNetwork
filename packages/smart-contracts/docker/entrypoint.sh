#! /bin/bash

wait-for-it localhost:8545 -- truffle --contracts_directory=/app/build/contracts deploy &

MNEMONIC=${MNEMONIC:="candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"}

node /app/ganache-core.docker.cli.js -l 90000000 -m "$MNEMONIC"
