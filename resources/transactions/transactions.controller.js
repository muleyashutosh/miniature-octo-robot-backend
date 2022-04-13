import randToken from 'rand-token'
import { create } from "ipfs-http-client";
import { Gateway, Wallets } from 'fabric-network';
import { ccp, caClient, wallet } from '../../server'
import { contract, userId } from '../auth/auth.controller'
import { json } from 'express';

async function ipfsClient() {
  const ipfs = await create(
    {
      host: "ipfs.infura.io",
      port: 5001,
      protocol: "https"
    }
  );
  return ipfs;
}

function prettyJSONString(inputString) {
  return JSON.stringify(JSON.parse(inputString), null, 2);
}

const channelName = 'mychannel';
const chaincodeName = 'basic';


// dummy api.
const getAllTransaction = async (req, res) => {
  const docs = [];
  console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
  let ledger = await contract.evaluateTransaction('GetAllAssets');
  ledger = JSON.parse(ledger.toString())
  for (var asset of ledger) {
    if (asset["Owner"] == userId) {
      docs.push({ hash: asset["ID"], name: asset["Name"], timestamp: asset["TimeStamp"] })
    }
  }
  res.json(docs)
}

const addTransaction = async (req, res) => {
  console.log(req.headers)
  res.json("ok")
  let ipfs = await ipfsClient();

  let data = req.files.doc.data
  let options = {
    warpWithDirectory: false,
    progress: (prog) => console.log(`Saved :${prog}`)
  }
  let result = await ipfs.add(data, options);

  console.log('\n--> Submit Transaction: CreateAsset, creates new asset with ID, color, owner, size, and appraisedValue arguments');
  let asset = await contract.submitTransaction('CreateAsset', result.path, req.files.doc.name, new Date(), userId);
  console.log('*** Result: committed');
  if (`${asset}` !== '') {
    console.log(`*** Result: ${prettyJSONString(asset.toString())}`);
  }
  // result = await contract.evaluateTransaction('ReadAsset', 'QmSxcM6u9ff45gb1cm7eZLX5A2NEHwfw');
  // console.log(typeof (JSON.parse(result)["Sharedwith"]));
  // return res.json("Asset Created")
}

const deleteTransaction = async (req, res) => {
  console.log(req.params);
  const result = await contract.submitTransaction('DeleteAsset', req.params.id);
  console.log(`*** Result: ${prettyJSONString(result.toString())}`);
  return res.json(`Deleted ${req.params.id}`)
}

const shareDocument = async (req, res) => {
  try {
    console.log('\n--> Submit Transaction: UpdateAsset asset70, asset70 does not exist and should return an error');
    await contract.submitTransaction('UpdateAsset', req.body.hash, req.body.sharedWith);
    var result = await contract.evaluateTransaction('ReadAsset', 'QmSxcM6u9ff45gb1cm7eZLX5A2NEHwfw');
    console.log(JSON.parse(result));
    console.log('******** FAILED to return an error');
  } catch (error) {
    console.log(`*** Successfully caught the error: \n    ${error}`);
  }
}


export { getAllTransaction, addTransaction, deleteTransaction, shareDocument };