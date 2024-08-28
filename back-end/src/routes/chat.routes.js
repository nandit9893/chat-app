import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { dataOfFriendWithLoggedInUserChatting, messageFromCurrentChatUser, sendMessages, startChat, loginUserFriendList, toggleMessageSeen, friendDataForRightSide } from "../controllers/user.controller.js";
import { upload } from "../middleware/upload.middleware.js";


const router = Router();
router.route("/start-chat").post(verifyJWT, startChat);
router.route("/login-user-getting-friend-list").get(verifyJWT, loginUserFriendList);
router.route("/friend-data-with-loggedin-user-profile").get(verifyJWT, dataOfFriendWithLoggedInUserChatting);
router.route("/message-by-current-chat-user").get(verifyJWT, messageFromCurrentChatUser);
router.route("/send-messagesby-loggedinuser").post(verifyJWT, upload.single("imageUrl"), sendMessages);
router.route("/toggle/last/seen/logged/user").post(verifyJWT, toggleMessageSeen);
router.route("/friend/data/for/right/side").get(verifyJWT, friendDataForRightSide);
export default router;