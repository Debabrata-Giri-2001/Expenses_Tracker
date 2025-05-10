import mongoose, { Schema, Document } from "mongoose";

export interface ISplitDetail {
  user: Schema.Types.ObjectId; // User who owes money
  amount: number;
  status: "pending" | "settled";
}

interface IGroupExpenseSchema extends Document {
  groupId: Schema.Types.ObjectId;
  paidBy: Schema.Types.ObjectId;
  amount: number;
  title: string;
  attachments: string[];
  splitDetails: ISplitDetail[];
  categoty: string;
  timestamp: Date;
}

const GroupExpenseSchema = new Schema<IGroupExpenseSchema>({
  groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
  paidBy: { type: Schema.Types.ObjectId, ref: "UserModel", required: true },
  amount: { type: Number, required: true, min: 0.01 },
  title: { type: String, trim: true },
  attachments: [{ type: String }],
  splitDetails: [
    {
      user: { type: Schema.Types.ObjectId, ref: "UserModel", required: true },
      amount: { type: Number, required: true, min: 0.01 },
      status: {
        type: String,
        enum: ["pending", "paid"],
        default: "pending",
      },
    },
  ],
  categoty: {
    type: String,
    enum: ["food", "travel", "entertainment", "shoping","other"],
    default: "other",
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
});

const GroupExpense = mongoose.model<IGroupExpenseSchema>(
  "GroupExpenseModel",
  GroupExpenseSchema
);
export default GroupExpense;
