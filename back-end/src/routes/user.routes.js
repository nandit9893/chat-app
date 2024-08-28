import { Router } from "express";
import { forgotPassword, getUserDataForRight, login, logout, profileUpdate, registerUser, userDataWithNameLeftSide } from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import updataeLastSeen from "../utils/updatelastseen.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(login, verifyJWT, updataeLastSeen);
router.route("/logout").post(verifyJWT, updataeLastSeen, logout);
router.route("/profileupdate").patch(verifyJWT, upload.single("avatar"), profileUpdate);
router.route("/getuserdataright").get(verifyJWT, getUserDataForRight);
router.route("/userdata/withname/leftside").get(verifyJWT, userDataWithNameLeftSide);
router.route("/forgot/password").post(forgotPassword);
export default router;