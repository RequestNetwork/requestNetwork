#!/bin/sh

while ! nc -z 127.0.0.1 8545;
do
    echo sleeping;
    sleep 1;
done;

npm run --prefix ./packages/requestNetwork.js testdeploy

exec "$@"
