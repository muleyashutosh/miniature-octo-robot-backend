#!/bin/bash

pushd test-network 

./network.sh down 
./network.sh up createChannel -ca
./network.sh deployCC -ccn basic -ccp ../chaincode-javascript/ -ccl javascript

popd 

rm -rf wallet
