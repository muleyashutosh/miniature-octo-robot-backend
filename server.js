import express, { urlencoded, json } from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import { SECRETS } from "./util/config";
import { connect } from "./util/db";
import { protect } from "./util/protect";
import AuthRouter from './resources/auth/auth.router'
import TransactionRouter from './resources/transactions/transactions.router'
import corsOptions from "./util/corsOptions";
import credentials from "./util/credentials";
import { Gateway, Wallets } from 'fabric-network';
import FabricCAServices from 'fabric-ca-client';
import path from 'path';
import { buildCAClient, registerAndEnrollUser, enrollAdmin } from '../../test-application/javascript/CAUtil.js';
import { buildCCPOrg1, buildWallet } from '../../test-application/javascript/AppUtil.js';
import { fileURLToPath } from 'url';

const mspOrg1 = 'Org1MSP';
const channelName = 'mychannel';
const chaincodeName = 'basic';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const walletPath = path.join(__dirname, 'wallet');
let ccp, caClient, wallet;
export { ccp, caClient, wallet };


const app = express();
const PORT = SECRETS.PORT || 3000;

app.use(credentials);

app.use(cors(corsOptions));

app.use(morgan("dev"));
app.use(urlencoded({ extended: true }));
app.use(json());
app.use(cookieParser())

app.use('/auth', AuthRouter)

app.use('/transactions', protect, TransactionRouter)

app.get("/", (req, res) => {
  res.json({
    message: "Hello World!",
    user: req.user,
  });
});

export const start = async () => {
  try {
    await connect();
    ccp = buildCCPOrg1();

    caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
    wallet = await buildWallet(Wallets, walletPath);

    await enrollAdmin(caClient, wallet, mspOrg1);
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: 'admin',
      discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
    });
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    const contract = network.getContract(chaincodeName);

    // Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
    // This type of transaction would only be run once by an application the first time it was started after it
    // deployed the first time. Any updates to the chaincode deployed later would likely not need to run
    // an "init" type function.
    console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');
    await contract.submitTransaction('InitLedger');

    app.listen(PORT, () => {
      console.log(`App is listening on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.log(e);
  }
};

export default start