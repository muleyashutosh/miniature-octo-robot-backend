import {Router} from 'express';
import {refresh, reject, signin, signup} from './auth.controller'

const router = Router();

router.post("/signin", signin);
router.post("/signup", signup);
router.post('/token', refresh)
router.post('/token/revoke', reject)

export default router;