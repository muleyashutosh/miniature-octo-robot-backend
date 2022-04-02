import randToken from 'rand-token'
import { create } from "ipfs-http-client";

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

const sampleData = [];

// dummy api.
const getAllTransaction = (req, res) => {

  res.json(sampleData)
}

const addTransaction = async (req, res) => {
  console.log("########################")
  console.log(req.headers)
  res.json("ok")
  let ipfs = await ipfsClient();

  let data = req.files.doc.data
  let options = {
    warpWithDirectory: false,
    progress: (prog) => console.log(`Saved :${prog}`)
  }
  let result = await ipfs.add(data, options);

  console.log(result.path)
  sampleData.push({ hash: result.path, name: req.files.doc.name, timestamp: new Date() })
}
export { getAllTransaction, addTransaction };