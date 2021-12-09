#! /bin/sh

if [ -z "$1" ]
  then
    echo "No argument supplied"
    exit 1
fi

yarn -s chainlinkPath $1 | jq ".$1"  > ../currency/src/aggregators/$1.json
