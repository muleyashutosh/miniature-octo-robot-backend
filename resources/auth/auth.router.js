import {Router} from 'express';
import {logout, refresh, reject, signin, signup} from './auth.controller'

const router = Router();

router.post("/signin", signin);
router.post("/signup", signup);
router.get('/refresh', refresh)
router.get('/refreshToken/revoke', reject)
router.get('/logout', logout)

export default router;