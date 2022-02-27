import {Router} from 'express'
import {getAllTransaction} from './transactions.controller'

const router = Router();

router.route("/").get(getAllTransaction)

export default router;