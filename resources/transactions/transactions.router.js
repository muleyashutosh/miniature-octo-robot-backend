import {Router} from 'express'
import fileupload from 'express-fileupload'
import {getAllTransaction, addTransaction} from './transactions.controller'

const router = Router();
router.use(fileupload());


router.route("/").get(getAllTransaction).post(addTransaction)

export default router;