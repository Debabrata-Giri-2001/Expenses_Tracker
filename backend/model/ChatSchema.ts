import mongoose, { Document, Schema } from "mongoose";

interface IChatSchema extends Document {
  groupId: Schema.Types.ObjectId;
  sender: Schema.Types.ObjectId;
  message: string;
  attachments: string;
  timestamp: Date;
}

const ChatSchema = new Schema<IChatSchema>({
  groupId: { type: Schema.Types.ObjectId, ref: "GroupModel", required: true },
  sender: { type: Schema.Types.ObjectId, ref: "UserModel", required: true },  
  message: { type: String, trim: true },
  attachments: [{ type: String }],
  timestamp: { type: Date, default: Date.now },
});


const Chat = mongoose.model<IChatSchema>("ChatModel", ChatSchema);
export default Chat;

