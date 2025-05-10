import mongoose, { Document, Schema } from "mongoose";

interface Invitation {
  user : mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "ignored";
}

interface IGroupSchema extends Document {
  name: string;
  groupDescription: string;
  groupPicture: string;
  createdBy: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  invitations: Invitation[];
  createdAt: Date;
  updatedAt: Date;
}

// Group Schema
const GroupSchema = new mongoose.Schema<IGroupSchema>({
  name: { type: String, required: true },
  groupDescription: { type: String },
  groupPicture: { type: String },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserModel" }],
  invitations: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel" },
      status: {
        type: String,
        enum: ["pending", "accepted", "ignored"],
        default: "pending",
      },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Group = mongoose.model<IGroupSchema>("Group", GroupSchema);
export default Group;
