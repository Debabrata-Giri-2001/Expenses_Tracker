import express from "express";
import {
  getProfile,
  updateProfile,
  getAllUsers,
} from "../controller/profileController";
import { isAuthenticatedUser } from "../middleware/auth";

const router = express.Router();

router.route("/getProfile").get(isAuthenticatedUser, getProfile);
router.route("/updateProfile").patch(isAuthenticatedUser, updateProfile);

router.route("/get-users").get(isAuthenticatedUser, getAllUsers);

export default router;
