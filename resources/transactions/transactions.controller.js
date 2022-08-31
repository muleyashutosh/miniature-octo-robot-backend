import { create } from "ipfs-http-client";
import { contract, userId } from "../auth/auth.controller";
import { encryptAES, decryptAES } from "../auth/cryptography";
import {SECRETS} from '../../util/config'
import crypto from "crypto";

import fs from "fs";
// import { json } from "express/lib/response";

async function ipfsClient() {
  const projectId = SECRETS.INFURA_IPFS_PROJECT_ID;
  const projectSecret = SECRETS.INFURA_IPFS_API_KEY_SECRET;
  const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');
  const ipfs = await create({
    host: SECRETS.INFURA_API_ENDPOINT,
    port: SECRETS.INFURA_API_PORT,
    protocol: "https",
    headers: {
      authorization: auth
    }
  });
  return ipfs;
}

function prettyJSONString(inputString) {
  return JSON.stringify(JSON.parse(inputString), null, 2);
}

// const secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';

// dummy api.
const getAllTransaction = async (req, res) => {
  const docs = [];
  console.log(
    "\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger"
  );
  let ledger = await contract.evaluateTransaction("GetAllAssets");
  ledger = JSON.parse(ledger.toString());
  for (var asset of ledger) {
    if (asset.Owner == req.user._id && asset.OwnerDocHash === asset.ID) {
      docs.push({
        hash: asset["ID"],
        name: asset["Name"],
        timestamp: asset["TimeStamp"],
      });
    }
  }
  res.json(docs);
};

const getSharedDocuments = async (req, res) => {
  const docs = [];
  console.log(
    "\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger"
  );
  let ledger = await contract.evaluateTransaction("GetAllAssets");
  ledger = JSON.parse(ledger.toString());
  console.log("ASHU", req.user);
  // console.log("NEW", req.user._id, typeof req.user._id)
  for (var asset of ledger) {
    console.log("**************ASSET.getSharedDocuments*******************");
    console.log("ASSET", asset);
    console.log("*****************ASSET.getSharedDocuments****************");
    if (asset.ID != asset.OwnerDocHash) {
      var list = await getSharedWith(asset.OwnerDocHash);
      console.log(asset.Broadcast);
      for (var share of list) {
        if (share === req.user._id.toString())
          docs.push({
            hash: asset.ID,
            name: asset.Name,
            timestamp: asset.TimeStamp,
          });
      }
    }

    console.log("****************************")
    console.log(req.user._id.toString(), asset.Owner, asset.Owner !== req.user._id.toString())
    console.log(asset.Broadcast === req.user.role);
    console.log("****************************")

    if (
      asset.Owner !== req.user._id.toString() &&
      asset.Broadcast === req.user.role
    ) {
      console.log("BABABABABABABABA")
      docs.push({
        hash: asset.ID,
        name: asset.Name,
        timestamp: asset.TimeStamp,
      });
    }
  }
  return res.json(docs);
};

const addTransaction = async (req, res) => {
  try {
    console.log("###########", req.files, "##################");

    let ipfs = await ipfsClient();

    const secretKey = crypto.randomBytes(32).toString("hex").slice(0, 32);

    let buff = Buffer.from(req.files.doc.data, "base64");
    let encrypted = encryptAES(buff, secretKey).toString("base64");

    console.log("***************beforeEncryption***************");
    // console.log("Eencrypted)
    console.log(secretKey);
    console.log(req.files.doc.data.toString("base64"));
    console.log("***************beforeEncryption***************");

    console.log("***************afterEncryption***************");
    console.log(encrypted);
    console.log("***************afterEncryption***************");

    let options = {
      warpWithDirectory: false,
      progress: (prog) => console.log(`Saved :${prog}`),
    };

    const result = await ipfs.add(encrypted + secretKey, options);

    console.log(
      "\n--> Submit Transaction: CreateAsset, creates new asset with ID, color, owner, size, and appraisedValue arguments"
    );
    let asset = await contract.submitTransaction(
      "CreateAsset",
      result.path,
      req.files.doc.name,
      result.path,
      new Date(),
      req.user._id.toString(),
      ""
    );
    console.log("*** Result: committed");
    if (`${asset}` !== "") {
      console.log(`*** Result: ${prettyJSONString(asset.toString())}`);
    }

    return res.json("ok");
  } catch (e) {
    console.log(e);
    return res.status(400).json("ERROR");
  }
};

const deleteTransaction = async (req, res) => {
  console.log(req.params);
  const result = await contract.submitTransaction("DeleteAsset", req.params.id);
  console.log(`*** Result: ${prettyJSONString(result.toString())}`);
  return res.json(`Deleted ${req.params.id}`);
};

const shareDocument = async (req, res) => {
  try {
    /*
    1.update owners sharedwith
    2.decrypt doc
    3.encrypt doc
    4.create new asset
     */
    const ipfs = await ipfsClient();
    const result = await contract.evaluateTransaction(
      "ReadAsset",
      req.body.hash
    );
    const share = JSON.parse(result);

    console.log("******************share_from_backend*****************")
    console.log(share)
    console.log("****************share_from_backend*******************");



    await contract.submitTransaction(
      "UpdateAsset",
      share.OwnerDocHash,
      req.body.receiver,
      share.Broadcast
    );

    const secretKey = crypto.randomBytes(32).toString("hex").slice(0, 32);

    let buff = await decryptDocument(share.ID);
    let encrypted = encryptAES(buff, secretKey).toString("base64");

    console.log("***************beforeEncryption***************");
    // console.log("Eencrypted)
    console.log(secretKey);
    console.log(buff);
    console.log("***************beforeEncryption***************");

    console.log("***************afterEncryption***************");
    console.log(encrypted);
    console.log("***************afterEncryption***************");

    let options = {
      warpWithDirectory: false,
      progress: (prog) => console.log(`Saved :${prog}`),
    };
    const result1 = await ipfs.add(encrypted + secretKey, options);

    let asset = await contract.submitTransaction(
      "CreateAsset",
      result1.path,
      req.body.file,
      share.ID,
      new Date(),
      req.user._id.toString(),
      ""
    );
    console.log("*** Result: committed");
    if (`${asset}` !== "") {
      console.log(`*** Result: ${prettyJSONString(asset.toString())}`);
    }
    console.log("******* Success");
    return res.json("Sending Successful");
  } catch (error) {
    console.log(`*** Successfully caught the error: \n    ${error}`);
    return res
      .status(400)
      .json({ message: "Errored out", error: error.message });
  }
};

const getDocument = async (req, res) => {
  const result = await contract.evaluateTransaction(
    "ReadAsset",
    req.params.hash
  );
  let doc = await decryptDocument(req.params.hash);
  const parsedResult = JSON.parse(result);
  console.log(parsedResult);
  const filename = `${crypto.randomBytes(32).toString("hex")}.${
    parsedResult.Name.split(".")[1]
  }`;
  console.log("****************doc*******************");
  console.log(doc.toString("base64"));
  console.log("****************doc*******************");
  fs.writeFileSync(`docs/${filename}`, doc, "base64", function (err) {
    console.log(err);
  });
  return res.download(`docs/${filename}`);
};

async function decryptDocument(hash) {
  try {
    let ipfs = await ipfsClient();
    console.log(hash);
    let asyncitr = ipfs.cat(hash);
    var data = "";
    for await (const itr of asyncitr) {
      data += Buffer.from(itr).toString();
    }

    console.log(
      "\n\n\n\n*************************data_before_split***************************"
    );
    console.log(data, typeof data);
    console.log(
      "*************************data_before_split***************************"
    );
    const secretKey = data.slice(data.length - 32);
    data = data.substring(0, data.length - 32);

    console.log(
      "\n\n\n\n*************************secretKey***************************"
    );
    console.log(secretKey, typeof secretKey);
    console.log(
      "*************************secretKey***************************"
    );

    console.log(
      "\n\n\n\n*************************data***************************"
    );
    console.log(data, typeof data);
    console.log("*************************data***************************");

    var temp = Buffer.from(data, "base64");

    var dw = decryptAES(temp, secretKey);
    return dw;
  } catch (e) {
    console.log(e);
  }
}

async function getSharedWith(hash) {
  var result = await contract.evaluateTransaction("ReadAsset", hash);
  const shared = JSON.parse(result);
  // console.log(shared)
  const list = shared.Sharedwith;
  return list;
}

async function broadCastAsset(hash, role) {
  var result = await contract.evaluateTransaction("ReadAsset", hash);
  const shared = JSON.parse(result);
  // console.log(shared)
  const list = shared.Sharedwith;
  await contract.submitTransaction(
    "UpdateAsset",
    hash,
    list,
    role
  );
}

const broadCastDocument = async (req, res) => {
  const result = await contract.evaluateTransaction(
    "ReadAsset",
    req.params.hash
  );
  const share = JSON.parse(result);
  const list = await broadCastAsset(req.params.hash, req.user.role);
  return res.json(`Broadcasted to all ${req.user.role}s`);
};

export {
  getAllTransaction,
  addTransaction,
  deleteTransaction,
  shareDocument,
  getDocument,
  getSharedDocuments,
  broadCastDocument,
};
