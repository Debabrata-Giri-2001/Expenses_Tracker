// src/validators/chatValidator.ts
import validator from 'validator';
import mongoose from 'mongoose';
import ErrorHandler from './errorHnadeler';

interface MessageData {
  groupId: string;
  sender?: string;
  message: string;
  attachments?: string[];
}

export const validateMessageData = (data: any): { error?: ErrorHandler, data?: MessageData } => {
  // Validate required fields exist
  if (!data.groupId || !data.message) {
    return { error: new ErrorHandler('Group ID and message are required', 400) };
  }

  // Validate groupId format
  if (!mongoose.Types.ObjectId.isValid(data.groupId)) {
    return { error: new ErrorHandler('Invalid Group ID format', 400) };
  }

  // Validate message content
  const message = validator.trim(data.message);
  if (validator.isEmpty(message)) {
    return { error: new ErrorHandler('Message cannot be empty', 400) };
  }

  if (!validator.isLength(message, { min: 1, max: 1000 })) {
    return { error: new ErrorHandler('Message must be between 1-1000 characters', 400) };
  }

  // Validate attachments if provided
  if (data.attachments) {
    if (!Array.isArray(data.attachments)) {
      return { error: new ErrorHandler('Attachments must be an array', 400) };
    }

    for (const url of data.attachments) {
      if (!validator.isURL(url, { protocols: ['http', 'https'], require_protocol: true })) {
        return { error: new ErrorHandler(`Invalid attachment URL: ${url}`, 400) };
      }
    }
  }

  // Return validated data
  return {
    data: {
      groupId: data.groupId,
      message: message,
      attachments: data.attachments || undefined
    }
  };
};

// Validation for joining a group
export const validateJoinGroupData = (groupId: any): { error?: ErrorHandler, groupId?: string } => {
  if (!groupId) {
    return { error: new ErrorHandler('Group ID is required', 400) };
  }

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return { error: new ErrorHandler('Invalid Group ID format', 400) };
  }

  return { groupId: groupId.toString() };
};