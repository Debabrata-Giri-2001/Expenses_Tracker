import "dotenv/config";
import { createKolkataTime } from "./../config/createKolkataTime";
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/errorHnadeler";
import { sendEmail } from "./../utils/sendEmail";
import User from "../model/UserSchema";
import bcrypt from "bcrypt";

// Login function
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new ErrorHandler("Email and password are required.", 400));

  try {
    let user = await User.findOne({ email });

    if (!user) {
      // New User: Create account and send OTP
      const hashedPassword = await bcrypt.hash(password, 10);
      const newOtp = Math.floor(100000 + Math.random() * 900000);

      user = new User({
        email,
        password: hashedPassword,
        otp: newOtp,
        otpExpires: createKolkataTime(10),
        isVerify: false,
      });

      await user.save();
      await sendEmail({
        email,
        subject: "Verification Code",
        message: `Your email verification code is: ${newOtp}`,
      });
      return next(new ErrorHandler("OTP sent to email. Please verify.", 201));
    }

    // Existing User: Check if OTP verification is needed
    if (
      !user.isVerify ||
      (user.otpExpires && new Date(user.otpExpires) < new Date())
    ) {
      const newOtp = Math.floor(100000 + Math.random() * 900000);

      user.otp = newOtp;
      user.otpExpires = new Date(createKolkataTime(10));
      await user.save();
      await sendEmail({
        email,
        subject: "Verification Code",
        message: `Your email verification code is: ${newOtp}`,
      });
      return next(new ErrorHandler("OTP sent to email. Please verify.", 201));
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new ErrorHandler("Invalid credentials.", 401));
    }

    const token = user.getJWTToken();
    res.status(200).json({ message: "Login successful", success: true, token });
  } catch (error) {
    console.error("Error during login:", error);
    return next(new ErrorHandler("Internal server error", 500));
  }
};

// OTP Verification function
export const otpVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return next(new ErrorHandler("Email and OTP are required.", 400));

  try {
    const user = await User.findOne({ email });
    if (!user) return next(new ErrorHandler("User not found", 404));

    // Verify OTP
    if (
      !user.otpExpires ||
      user.otp !== otp ||
      new Date(user.otpExpires).getTime() < Date.now()
    ) {
      return next(new ErrorHandler("Invalid or expired OTP.", 401));
    }

    user.isVerify = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = user.getJWTToken();
    res.status(200).json({
      message: "OTP verified successfully.",
      success: true,
      token,
    });
  } catch (error) {
    console.error("Error during OTP verification:", error);
    return next(new ErrorHandler("Internal server error", 500));
  }
};
