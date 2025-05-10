import express from "express";
import { login, otpVerify } from "../controller/authController";

const router = express.Router();

router.route("/login").post(login);
router.route("/verifyOtp").post(otpVerify);

export default router;
