import { Router } from 'express'
import fileupload from 'express-fileupload'
import { getAllTransaction, addTransaction, deleteTransaction, shareDocument, getDocument, broadCastDocument } from './transactions.controller'

const router = Router();
router.use(fileupload());


router.route("/").get(getAllTransaction).put(shareDocument).post(addTransaction)
router.route("/:id").delete(deleteTransaction)
router.route("/:hash").get(getDocument).put(broadCastDocument);

export default router;