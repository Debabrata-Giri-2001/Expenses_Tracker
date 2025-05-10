import { Request, Response, NextFunction } from "express";
import User from "../model/UserSchema";
import { uploadFile } from "../middleware/uploadFile";
import ErrorHandler from "../utils/errorHnadeler";
import { AuthenticatedRequest } from "../middleware/auth";

// Get Profile
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -otp -otpExpires -emailOtp -groups"
    );

    if (!user) return next(new ErrorHandler("User not found", 404));

    res.status(200).json(user);
  } catch (error) {
    console.error("Error during getProfile:", error);
    return next(new ErrorHandler("Internal server error", 500));
  }
};

// Update Profile
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name } = req.body;

    // Find user
    const user = await User.findById(req.user.id);
    if (!user) return next(new ErrorHandler("User not found", 404));

    // Update fields
    if (name) user.name = name;
    // Handle profile picture upload
    if (req.files && req.files.profilePicture) {
      const profilePicture = Array.isArray(req.files.profilePicture)
      ? req.files.profilePicture[0]
      : req.files.profilePicture;
      
      const profilePictureUrl = await uploadFile(profilePicture);
      user.profilePicture = profilePictureUrl;
    }

    user.updatedAt = new Date();
    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error during updateProfile:", error);
    return next(new ErrorHandler("Internal server error", 500));
  }
};

// Get All Users with Partial Name or Email Search
export const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let { search } = req.query;
    search = search?.toString().trim(); // Trim input

    let query: any = {
      isVerify: true, 
      _id: { $ne: req.user.id },
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).select(
      "-password -otp -otpExpires -emailOtp"
    );

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return next(new ErrorHandler("Internal server error", 500));
  }
};
