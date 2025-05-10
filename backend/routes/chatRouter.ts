import express from "express";
import { getGroupMessages } from "../controller/chatController";
import { isAuthenticatedUser } from "../middleware/auth";

const router = express.Router();

router.get("/chat/:groupId", isAuthenticatedUser, getGroupMessages);

export default router;
