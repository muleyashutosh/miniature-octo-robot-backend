import {Router} from 'express'
import fileupload from 'express-fileupload'
import {getAllTransaction, addTransaction, deleteTransaction, shareDocument} from './transactions.controller'

const router = Router();
router.use(fileupload());


router.route("/").get(getAllTransaction).post(addTransaction).put(shareDocument)
router.route("/:id").delete(deleteTransaction)

export default router;