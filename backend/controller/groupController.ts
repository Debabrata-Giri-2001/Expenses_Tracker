import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/auth";
import { Request, Response, NextFunction } from "express";
import { uploadFile } from "../middleware/uploadFile";
import ErrorHandler from "../utils/errorHnadeler";
import User from "../model/UserSchema";
import Group from "../model/GroupSchema";
import { Chat, Expense } from "../model";

// Get group by ID
export const getGroupById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return next(new ErrorHandler("Invalid group ID", 400));
    }

    // Fetch the group details
    const group = await Group.findById(groupId)
      .populate({
        path: "members",
        select: "name email profilePicture",
        model: User,
      })
      .populate({
        path: "invitations.user",
        select: "name email profilePicture",
        model: User,
      });

    if (!group) {
      return next(new ErrorHandler("Group not found", 404));
    }
    res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    next(new ErrorHandler("Failed to fetch group", 500));
  }
};

//get group user details
export const getGroupUserDetailsById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return next(new ErrorHandler("Invalid group ID", 400));
    }

    // Fetch only the members of the group
    const group = await Group.findById(groupId)
      .select("members") // Select only the members field
      .populate({
        path: "members",
        select: "name email profilePicture", // Populate member details
        model: User,
      });

    if (!group) {
      return next(new ErrorHandler("Group not found", 404));
    }

    res.status(200).json({
      success: true,
      members: group.members, // Return only the members
    });
  } catch (error) {
    console.error("Error fetching group members:", error);
    next(new ErrorHandler("Failed to fetch group members", 500));
  }
};

// Create group
export const createGroup = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, groupDescription, invitations = [] } = req.body;
    const createdBy = req.user?._id;

    if (!createdBy) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    let groupPicture;
    // Handle profile picture upload
    if (req.files && req.files.groupPicture) {
      const groupPictureFile = Array.isArray(req.files.groupPicture)
        ? req.files.groupPicture[0]
        : req.files.groupPicture;

      const groupPictureURL = await uploadFile(groupPictureFile);
      groupPicture = groupPictureURL;
    }

    // Validate invitations are emails
    if (invitations.length < 1) {
      return next(new ErrorHandler(`More then 1 user needed `, 400));
    }

    const newGroup = new Group({
      name,
      groupDescription,
      groupPicture,
      createdBy,
      members: [createdBy],
      invitations: invitations.map((_id: string) => ({
        user: _id,
        status: "pending",
      })),
    });

    await newGroup.save();

    // Add group to user's groups list
    await User.findByIdAndUpdate(createdBy, {
      $addToSet: { groups: newGroup._id },
    });

    res.status(201).json({
      success: true,
      group: newGroup,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    next(new ErrorHandler("Failed to create group", 500));
  }
};

// Update group image or name
export const updateGroup = async (
  req: AuthenticatedRequest, // Changed to AuthenticatedRequest
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupId } = req.params;
    const { name } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return next(new ErrorHandler("Group not found", 404));
    }

    // Check if user is group creator
    if (group.createdBy.toString() !== req.user?._id.toString()) {
      return next(new ErrorHandler("Not authorized to update this group", 403));
    }

    let updateData: { name?: string; groupPicture?: string } = { name };

    // Handle file upload if present
    if (req.files && req.files.groupPicture) {
      const groupPictureFile = Array.isArray(req.files.groupPicture)
        ? req.files.groupPicture[0]
        : req.files.groupPicture;
      updateData.groupPicture = await uploadFile(groupPictureFile);
    }

    const updatedGroup = await Group.findByIdAndUpdate(groupId, updateData, {
      new: true,
    });

    res.status(200).json({
      success: true,
      group: updatedGroup,
    });
  } catch (error) {
    next(new ErrorHandler("Failed to update group", 500));
  }
};

// Add/Remove users in group
export const manageGroupMembers = async (
  req: AuthenticatedRequest, // Changed to AuthenticatedRequest
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupId } = req.params;
    const { userId, action } = req.body;

    if (!["add", "remove"].includes(action)) {
      return next(
        new ErrorHandler("Invalid action. Must be 'add' or 'remove'", 400)
      );
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return next(new ErrorHandler("Group not found", 404));
    }

    // Check if user is group creator
    if (group.createdBy.toString() !== req.user?._id.toString()) {
      return next(new ErrorHandler("Not authorized to manage this group", 403));
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    if (action === "add") {
      if (!group.members.includes(userId)) {
        group.members.push(userId);
        // Add group to user's groups list
        await User.findByIdAndUpdate(userId, {
          $addToSet: { groups: group._id },
        });
      }
    } else {
      group.members = group.members.filter((id) => id.toString() !== userId);
      // Remove group from user's groups list
      await User.findByIdAndUpdate(userId, {
        $pull: { groups: group._id },
      });
    }

    await group.save();
    res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    next(new ErrorHandler("Failed to manage group members", 500));
  }
};

// Invite users -- nor required
export const inviteUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;
    const userId = req.user?._id;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return next(new ErrorHandler("Invalid email address", 400));
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return next(new ErrorHandler("Group not found", 404));
    }

    // Check if user is group creator or admin
    if (group.createdBy.toString() !== req.user?._id.toString()) {
      return next(new ErrorHandler("Not authorized to invite users", 403));
    }

    // Check if email is already a member
    const isMember = await User.findOne({ email });
    if (isMember && group.members.includes(isMember._id)) {
      return next(
        new ErrorHandler("User is already a member of this group", 400)
      );
    }

    const existingInvitation = group.invitations.find(
      (invitation) => invitation.user === userId
    );

    if (existingInvitation) {
      return next(new ErrorHandler("User already invited", 400));
    }

    // Push the invitation
    group.invitations.push({
      user: isMember?._id ?? new mongoose.Types.ObjectId(),
      status: "pending",
    });

    await group.save();

    // TODO: Send actual invitation email here

    res.status(200).json({
      success: true,
      message: "Invitation sent",
      group,
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    next(new ErrorHandler("Failed to send invitation", 500));
  }
};

// Get groups by invitation status or created by user
export const getGroupsByStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    const userEmail = req.user?.email;
    const { status } = req.query;

    if (!userId || !userEmail) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    let groups;

    switch (status) {
      case "yourGroups":
        // Fetch groups created by the logged-in user
        groups = await Group.find({ createdBy: userId })
          .populate("members", "name email profilePicture")
          .populate("createdBy", "name email");
        break;

      case "joinedGroups":
        // Fetch groups the logged-in user has joined but not created
        groups = await Group.find({
          members: userId,
          createdBy: { $ne: userId },
        })
          .populate("members", "name email profilePicture")
          .populate("createdBy", "name email");
        break;

      case "inviteGroups":
        // Fetch groups where the logged-in user is invited with a pending status
        groups = await Group.find({
          "invitations.email": userEmail,
          "invitations.status": "pending",
        })
          .populate("members", "name email profilePicture")
          .populate("createdBy", "name email");
        break;

      case "ignoredGroups":
        // Fetch groups where the logged-in user has ignored the invitation
        groups = await Group.find({
          "invitations.email": userEmail,
          "invitations.status": "ignored",
        })
          .populate("members", "name email profilePicture")
          .populate("createdBy", "name email");
        break;

      default:
        return next(new ErrorHandler("Invalid status query parameter", 400));
    }

    // No additional filtering is needed here since the query already ensures
    // that only groups relevant to the logged-in user are fetched.

    res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error("Error fetching groups by status:", error);
    next(new ErrorHandler("Failed to get groups by status", 500));
  }
};

//get getYourGroups
export const getYourGroups = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const groups = await Group.find({ createdBy: userId })
      .populate("createdBy", "name email")
      .populate("members", "name email profilePicture");

    res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error("Error fetching your groups:", error);
    next(new ErrorHandler("Failed to fetch your groups", 500));
  }
};

//get getJoinedGroups
export const getJoinedGroups = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const groups = await Group.find({
      members: userId,
      createdBy: { $ne: userId },
    })
      .populate("members", "name email profilePicture")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error("Error fetching joined groups:", error);
    next(new ErrorHandler("Failed to fetch joined groups", 500));
  }
};

//get getInviteGroups
export const getInviteGroups = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const groups = await Group.find({
      createdBy: { $ne: userId },
      invitations: {
        $elemMatch: {
          _id: userId,
          status: "pending",
        },
      },
    })
      .populate("members", "name email profilePicture")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error("Error fetching invite groups:", error);
    next(new ErrorHandler("Failed to fetch invite groups", 500));
  }
};

//get getIgnoredGroups
export const getIgnoredGroups = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userID = req.user?._id;

    if (!userID) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const groups = await Group.find({
      createdBy: { $ne: userID },
      invitations: {
        $elemMatch: {
          email: userID,
          status: "ignored",
        },
      },
    })
      .populate("members", "name email profilePicture")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error("Error fetching ignored groups:", error);
    next(new ErrorHandler("Failed to fetch ignored groups", 500));
  }
};

// Update invitation status
export const updateInvitationStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupId } = req.params;
    const { status } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    if (!["accepted", "ignored"].includes(status)) {
      return next(new ErrorHandler("Invalid status", 400));
    }

    const group = await Group.findOne({
      _id: groupId,
      "invitations._id": userId,
    });

    if (!group) {
      return next(
        new ErrorHandler("Group not found or no invitation found", 404)
      );
    }

    // Find the invitation for the logged-in user
    const invitationIndex = group.invitations.findIndex((invitation: any) => {
      return invitation._id.toString() === userId.toString();
    });
    
    
    if (invitationIndex === -1) {
      return next(new ErrorHandler("Invitation not found", 404));
    }

    // Update the invitation status
    group.invitations[invitationIndex].status = status;

    // If the status is "accepted", add the user to the members array
    if (status === "accepted") {
      if (!group.members.includes(userId)) {
        group.members.push(userId);

        // Add the group to the user's groups list
        await User.findByIdAndUpdate(userId, {
          $addToSet: { groups: group._id },
        });
      }
    }

    // Save the updated group
    await group.save();

    res.status(200).json({
      success: true,
      message: `Invitation ${status}`,
      group,
    });
  } catch (error) {
    console.error("Error updating invitation status:", error);
    next(new ErrorHandler("Failed to update invitation status", 500));
  }
};
