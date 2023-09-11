import { Router } from 'express'
import fileupload from 'express-fileupload'
import {getSharedDocuments } from './transactions.controller'

const router = Router();
router.use(fileupload());


router.route("/").get(getSharedDocuments)

export default router;