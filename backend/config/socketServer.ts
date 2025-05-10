import { Server } from "socket.io";
import ChatModel from "../model/ChatSchema";

export const setupSocketServer = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ New client connected:", socket.id);

    // Join a group room
    socket.on("joinGroup", (groupId) => {
      if (!groupId) {
        console.log("❌ Group ID is required to join a group");
        return;
      }

      socket.join(groupId); // Join the group room
      console.log(`🔗 User ${socket.id} joined group ${groupId}`);

      // Notify other users in the group
      socket.to(groupId).emit("userJoined", {
        message: `A new user has joined the group: ${groupId}`,
        userId: socket.id,
      });
    });

    // Handle incoming messages
    socket.on("message", async (data) => {
      try {
        const parsedData = typeof data === "string" ? JSON.parse(data) : data;

        // Validate required fields
        if (!parsedData.groupId || !parsedData.sender || !parsedData.message) {
          console.log("❌ Missing required fields in message data:", {
            groupId: parsedData.groupId,
            sender: parsedData.sender,
            message: parsedData.message,
          });
          return;
        }
    
        console.log("📩 New message received:", parsedData);
    
        // Save the message to the database
        const newMessage = new ChatModel({
          groupId: parsedData.groupId,
          sender: parsedData.sender,
          message: parsedData.message,
          attachments: parsedData.attachments || [],
          timestamp: new Date(),
        });
    
        // await newMessage.save();
        // console.log("✅ Message saved to database:", newMessage);
    
        // Emit the message to all clients in the group
        io.to(parsedData.groupId).emit("newMessage", parsedData);
      } catch (error) {
        console.error("❌ Error processing message:", error);
      }
    });

    // Leave a group room
    socket.on("leaveGroup", (groupId) => {
      if (!groupId) {
        console.log("❌ Group ID is required to leave a group");
        return;
      }

      socket.leave(groupId);
      console.log(`🔗 User ${socket.id} left group ${groupId}`);

      // Notify other users in the group
      socket.to(groupId).emit("userLeft", {
        message: `A user has left the group: ${groupId}`,
        userId: socket.id,
      });
    });


    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });

  return io;
};
