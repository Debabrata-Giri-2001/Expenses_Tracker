import mongoose, { Document, Schema, Types } from "mongoose";
import validator from "validator";
import JWT from "jsonwebtoken";
import "dotenv/config";

interface IUserSchema extends Document {
  _id: Types.ObjectId;
  email: String;
  name: String;
  profilePicture: String;
  groups: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  otp?: number;
  otpExpires?: Date;
  emailOtp?: number;
  getJWTToken: () => string;
  isVerify: boolean;
  password: string;
}

const userSchema = new Schema<IUserSchema>({
  email: {
    type: String,
    unique: true,
    validate: [validator.isEmail, "Please enter a valid email"],
  },
  name: { type: String, default: "Unknown" },
  profilePicture: { type: String },
  groups: [{ type: Schema.Types.ObjectId, ref: "GroupModel" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  otp: {
    type: Number,
    minlength: [6, "OTP must be 6 digits"],
  },
  otpExpires: { type: Date },
  emailOtp: {
    type: Number,
    minlength: [6, "OTP must be 6 digits"],
  },
  isVerify: { type: Boolean, default: false },
  password: {
    type: String,
    required: true,
    minlength: [6, "Password must be at least 6 characters"],
  },
});

// JWT token generation method
userSchema.methods.getJWTToken = function (): string {
  return JWT.sign({ id: this._id }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIER as string | any,
  });
};

const User = mongoose.model<IUserSchema>("UserModel", userSchema);
export default User;
