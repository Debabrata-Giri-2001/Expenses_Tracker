// not used these code's
import { Server, Socket } from "socket.io";
import ChatModel from "../model/ChatSchema";
import {
  validateMessageData,
  validateJoinGroupData,
} from "../utils/chatValidator";

export const chatHandler = (io: Server, socket: Socket) => {
  console.log("⚡ Chat handler activated for:", socket.id);


  socket.on("joinGroup", async (data, callback) => {
    console.log("🔗 Received Raw Data:", data);
  
    // Extract groupId properly
    const groupId = data?.groupId;
  
    if (!groupId) {
      console.log("❌ Missing groupId!");
      return callback?.({ status: "error", message: "Group ID is missing" });
    }
  
    console.log("📝 Validating groupId:", groupId);
    const { error: validationError, groupId: validatedGroupId } =
      validateJoinGroupData(groupId);
  
    if (validationError) {
      console.log("❌ Validation Error:", validationError.message);
      return callback?.({ status: "error", message: validationError.message });
    }
  
    if (!validatedGroupId) {
      console.log("❌ Invalid Group ID");
      return callback?.({ status: "error", message: "Invalid group ID" });
    }
  
    socket.join(validatedGroupId);
    console.log(`🔗 User ${socket.data.user?._id || "unknown"} joined group: ${validatedGroupId}`);
  
    callback?.({ status: "success", groupId: validatedGroupId, history: [] });
  });
  
};

