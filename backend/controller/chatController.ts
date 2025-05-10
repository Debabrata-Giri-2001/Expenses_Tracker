import ChatModel from "../model/ChatSchema";
import { AuthenticatedRequest } from "../middleware/auth";
import { Request, Response, NextFunction } from "express";
import { uploadFile } from "../middleware/uploadFile";
import ErrorHandler from "../utils/errorHnadeler";

// Get chat messages by group ID
export const getGroupMessages = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      return next(new ErrorHandler("Group ID is required", 400));
    }

    // Fetch messages for the group
    const messages = await ChatModel.find({ groupId })
      .populate("sender", "name email profilePicture")
      .sort({ timestamp: 1 });

    // Group messages by groupId
    const groupedMessages = {
      groupId,
      messages: messages.map((message) => ({
        _id: message._id,
        sender: message.sender,
        message: message.message,
        attachments: message.attachments,
        timestamp: message.timestamp,
      })),
    };

    res.status(200).json({
      success: true,
      data: groupedMessages,
    });
  } catch (error) {
    console.error("Error fetching group messages:", error);
    next(new ErrorHandler("Failed to fetch group messages", 500));
  }
};
