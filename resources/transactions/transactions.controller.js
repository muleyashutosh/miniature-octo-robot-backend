import randToken from 'rand-token'
import { create } from "ipfs-http-client";
import { Gateway, Wallets } from 'fabric-network';
import { ccp, caClient, wallet } from '../../server'
import { contract, userId } from '../auth/auth.controller'
import { json } from 'express';
import { encryptAES, decryptAES } from '../auth/cryptography'
import crypto from 'crypto'
import fs from 'fs'

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
const algorithm = 'aes-256-ctr';
const secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';
const iv = 'vOVH6sdmpNWjRRIq'
const encrypt = crypto.createCipheriv(algorithm, secretKey, iv);
const decrypt = crypto.createDecipheriv(algorithm, secretKey, iv);

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

const getSharedDocuments = async (req, res) => {
  const docs = [];
  console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
  let ledger = await contract.evaluateTransaction('GetAllAssets');
  ledger = JSON.parse(ledger.toString())
  for (var asset of ledger) {
    if (asset["ID"] != asset["OwnerDocHash"]) {
      var list = await getSharedWith(asset["OwnerDocHash"])
      console.log(list)
      for (var share of list) {
        if (share == userId)
          docs.push({ hash: asset["ID"], name: asset["Name"], timestamp: asset["TimeStamp"] })
      }
    }
  }
  res.json(docs)
}

const addTransaction = async (req, res) => {
  try {
    console.log('###########', req.files, "##################")

    let ipfs = await ipfsClient();
    let buff = Buffer.from(req.files.doc.data, 'base64')
    let encrypted = encryptAES(buff, secretKey).toString('base64');

    let options = {
      warpWithDirectory: false,
      progress: (prog) => console.log(`Saved :${prog}`)
    }
    let result = await ipfs.add(encrypted, options);

    console.log('\n--> Submit Transaction: CreateAsset, creates new asset with ID, color, owner, size, and appraisedValue arguments');
    let asset = await contract.submitTransaction('CreateAsset', result.path, req.files.doc.name, result.path, new Date(), userId);
    console.log('*** Result: committed');
    if (`${asset}` !== '') {
      console.log(`*** Result: ${prettyJSONString(asset.toString())}`);
    }

    return res.json("ok")
  }
  catch (e) {
    console.log(e)
    return res.status(400).json("ERROR")
  }

}

const deleteTransaction = async (req, res) => {
  console.log(req.params);
  const result = await contract.submitTransaction('DeleteAsset', req.params.id);
  console.log(`*** Result: ${prettyJSONString(result.toString())}`);
  return res.json(`Deleted ${req.params.id}`)
}

const shareDocument = async (req, res) => {
  try {
    /*
    1.update owners sharedwith
    2.decrypt doc
    3.encrypt doc
    4.create new asset
     */
    let ipfs = await ipfsClient();
    var result = await contract.evaluateTransaction('ReadAsset', req.body.hash);
    const share = JSON.parse(result);
    var list = await getSharedWith(req.body.hash)
    list.push(req.body.sharedWith)


    await contract.submitTransaction('UpdateAsset', req.body.hash, list);
    result = await contract.evaluateTransaction('ReadAsset', 'QmPd5B8VLmFD11qZnKJ2rRrMT2GYVkbUo6uL9qsyBYa4oj');
    console.log(JSON.parse(result));

    let buff = await decryptDocument(share["ID"]).toString('base64');
    let encrypted = encryptAES(buff, secretKey).toString('base64');
    let options = {
      warpWithDirectory: false,
      progress: (prog) => console.log(`Saved :${prog}`)
    }
    result = await ipfs.add(encrypted, options);

    let asset = await contract.submitTransaction('CreateAsset', result.path, req.body.file, share["ID"], new Date(), userId);
    console.log('*** Result: committed');
    if (`${asset}` !== '') {
      console.log(`*** Result: ${prettyJSONString(asset.toString())}`);
    }
    console.log('******* Success');
  } catch (error) {
    console.log(`*** Successfully caught the error: \n    ${error}`);
  }
}


const getDocument = async (req, res) => {

  let doc = await decryptDocument(req.params.hash)
  fs.writeFile("dec.pdf", doc, 'base64', function (err) {
    console.log(err);
  });
}

async function decryptDocument(hash) {
  try {
    let ipfs = await ipfsClient();
    console.log(hash)
    let asyncitr = ipfs.cat(hash)
    var data = "";
    for await (const itr of asyncitr) {

      data += Buffer.from(itr).toString()
    }

    var temp = Buffer.from(data, 'base64');

    var dw = decryptAES(temp, secretKey)
    return dw;
  }
  catch (e) {
    console.log(e)
  }
}

async function getSharedWith(hash) {
  var result = await contract.evaluateTransaction('ReadAsset', hash);
  const share = JSON.parse(result);
  console.log(share)
  var list = share["Sharedwith"].split(",");
  return list
}

export { getAllTransaction, addTransaction, deleteTransaction, shareDocument, getDocument, getSharedDocuments };