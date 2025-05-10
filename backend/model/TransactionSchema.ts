import mongoose, { Document, Schema } from "mongoose";

interface ITransactionSchema extends Document {
  expenseId: Schema.Types.ObjectId;
  payer: Schema.Types.ObjectId;
  receiver: Schema.Types.ObjectId;
  amount: number;
  status: string;
  timestamp: Date;
}

const TransactionSchema = new Schema<ITransactionSchema>({
  expenseId: { type: Schema.Types.ObjectId, ref: "ExpenseModel", required: true },
  payer: { type: Schema.Types.ObjectId, ref: "UserModel", required: true },
  receiver: { type: Schema.Types.ObjectId, ref: "UserModel", required: true },  
  amount: { type: Number, required: true, min: 0.01 },
  status: {
    type: String,
    enum: ["pending", "settled"],
    default: "pending",
  },
  timestamp: { type: Date, default: Date.now },
});


const Transaction = mongoose.model<ITransactionSchema>("TransactionModel",TransactionSchema);
export default Transaction;
