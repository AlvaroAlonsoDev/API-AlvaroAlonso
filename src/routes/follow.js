import { Router } from "express";

import { checkJwt } from "../middleware/checkJwt.js";
import { followUserCtrl, getFollowStatusCtrl, getMyFollowersCtrl, getMyFollowingCtrl, getPublicFollowersCtrl, getPublicFollowingCtrl, unfollowUserCtrl } from "../controllers/followController.js";

const router = Router();

router.post("/:userId", checkJwt, followUserCtrl);
router.delete("/:userId", checkJwt, unfollowUserCtrl);

router.get("/status/:userId", checkJwt, getFollowStatusCtrl);

router.get("/following/me", checkJwt, getMyFollowingCtrl);
router.get("/followers/me", checkJwt, getMyFollowersCtrl);

router.get("/following/:userId", getPublicFollowingCtrl);
router.get("/followers/:userId", getPublicFollowersCtrl);

export { router };