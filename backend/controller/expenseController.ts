import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/auth";
import { Request, Response, NextFunction } from "express";
import { uploadFile } from "../middleware/uploadFile";
import ErrorHandler from "../utils/errorHnadeler";
import GroupExpense, { ISplitDetail } from "../model/GroupExpenseSchema";
import { Group } from "../model";

// Create Group Expense 👌
export const createExpense = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      groupId,
      paidBy,
      amount,
      title,
      categoty,
      timestamp,
      splitDetails: splitDetailsString,
    } = req.body;

    // Parse splitDetails if it's a JSON string
    let splitDetails: ISplitDetail[] = [];
    try {
      splitDetails = JSON.parse(splitDetailsString);
    } catch (error) {
      return next(new ErrorHandler("Invalid splitDetails format", 400));
    }

    // Validate required fields
    if (!groupId || !paidBy || !amount || !title || !categoty) {
      return next(
        new ErrorHandler("All required fields must be provided", 400)
      );
    }

    // Validate split details
    if (!Array.isArray(splitDetails) || splitDetails.length === 0) {
      return next(new ErrorHandler("Split details are required", 400));
    }

    // Validate that the split amounts match the total amount
    const totalSplitAmount = splitDetails.reduce(
      (sum, detail) => sum + detail.amount,
      0
    );
    if (totalSplitAmount !== parseFloat(amount)) {
      return next(
        new ErrorHandler(
          "The split amounts must equal the total expense amount",
          400
        )
      );
    }

    // Handle attachments (if provided)
    let attachments: string[] = [];
    if (req.files && req.files.attachments) {
      const attachmentFiles = Array.isArray(req.files.attachments)
        ? req.files.attachments
        : [req.files.attachments];

      // Upload each file and store the URLs
      for (const file of attachmentFiles) {
        const uploadedFileUrl = await uploadFile(file);
        attachments.push(uploadedFileUrl);
      }
    }

    // Create new expense
    const newExpense = new GroupExpense({
      groupId,
      paidBy,
      amount: parseFloat(amount), // Ensure amount is stored as a number
      title,
      categoty,
      attachments,
      splitDetails,
      timestamp: timestamp || new Date(), // Use provided timestamp or current date
    });

    // Save the expense to the database
    await newExpense.save();

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expense: newExpense,
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

// Get expenses by group ID - GET-ALL [LIST] 👌
export const getExpenseWithGroupId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return next(new ErrorHandler("Invalid group ID", 400));
    }

    const expenses = await GroupExpense.find({ groupId })
      .select("-attachments -splitDetails")
      .populate("paidBy", "name email ")
      .populate("splitDetails.user", "name email");

    res.status(200).json({
      success: true,
      expenses,
    });
  } catch (error) {
    console.error("Error fetching expenses by group ID:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

// Get expense details by ID - GET-DATA {OBJECT} 👌
export const getExpenseDataDetailsWithID = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { expenseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return next(new ErrorHandler("Invalid expense ID", 400));
    }

    const expense = await GroupExpense.findById(expenseId)
      .populate("paidBy", "name email profilePicture")
      .populate("splitDetails.user", "name email profilePicture");

    if (!expense) {
      return next(new ErrorHandler("Expense not found", 404));
    }

    res.status(200).json({
      success: true,
      expense,
    });
  } catch (error) {
    console.error("Error fetching expense details:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

// Get total expense amount for a group - GET-AMOUNT 👌
export const getAllExpenseAmount = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return next(new ErrorHandler("Invalid group ID", 400));
    }

    const totalAmount = await GroupExpense.aggregate([
      { $match: { groupId: new mongoose.Types.ObjectId(groupId) } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalMember = await Group.findById(groupId).populate("members");

    res.status(200).json({
      success: true,
      totalAmount: totalAmount[0]?.total || 0,
      totalMember: totalMember?.members.length || 0,
    });
  } catch (error) {
    console.error("Error calculating total expense amount:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

// Get total amount details in a group - GET-ALL [LIST,ALL USER EXPENSES, TOTAL EXPENSES,WHO PAID,WHO UNPAID, WHO PAID BY ME] 👌
export const getExpenseDataDetails = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.user; // Assuming `req.user` contains the authenticated user's ID.

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return next(new ErrorHandler("Invalid group ID", 400));
    }

    // Fetch all expenses for the group
    const expenses = await GroupExpense.find({ groupId })
      .populate("paidBy", "name email profilePicture")
      .populate("splitDetails.user", "name email profilePicture");

    // Calculate total split amount
    const totalSplitAmount = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    // Calculate "You Owe" and "You Are Owed" for the current user
    let youOwe = 0;
    let youAreOwed = 0;
    const whoGets: any = [];
    const whoPaid: any = [];

    expenses.forEach((expense: any) => {
      expense.splitDetails.forEach((split: any) => {
        if (split.user._id.toString() === userId) {
          if (split.status === "pending") {
            youOwe += split.amount;
          }
        } else if (split.status === "pending") {
          whoGets.push({
            user: split.user,
            amount: split.amount,
            status: split.status,
          });
        }
      });

      if (expense.paidBy._id.toString() === userId) {
        youAreOwed += expense.amount;
      }

      whoPaid.push({
        user: expense.paidBy,
        amount: expense.amount,
        timestamp: expense.timestamp,
      });
    });

    // Get group members and calculate per person amount
    const group = await Group.findById(groupId).populate(
      "members",
      "name email profilePicture"
    );
    const members = group?.members || [];
    const perPersonAmount = totalSplitAmount / members.length;

    res.status(200).json({
      success: true,
      data: {
        totalSplitAmount,
        youOwe,
        youAreOwed,
        members: members.map((member: any) => ({
          _id: member._id,
          name: member.name,
          email: member.email,
          profilePicture: member.profilePicture,
          perPersonAmount,
        })),
        whoPaid,
        whoGets,
      },
    });
  } catch (error) {
    console.error("Error fetching expense data details:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

// Get users who paid bills - GET-[LIST] -⛔-
export const getExpenseDataWhoPaidBill = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return next(new ErrorHandler("Invalid group ID", 400));
    }

    const expenses = await GroupExpense.find({ groupId }).populate(
      "paidBy",
      "name email"
    );

    const usersWhoPaid = expenses.map((expense) => expense.paidBy);

    res.status(200).json({
      success: true,
      users: usersWhoPaid,
    });
  } catch (error) {
    console.error("Error fetching users who paid bills:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

// Get total paid amount by a user - GET-{AMOUNT} -⛔-
export const getExpensePaidBill = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    const totalPaid = await GroupExpense.aggregate([
      { $match: { paidBy: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.status(200).json({
      success: true,
      totalPaid: totalPaid[0]?.total || 0,
    });
  } catch (error) {
    console.error("Error calculating total paid amount:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

// Get total unpaid amount for a user - GET-{AMOUNT} -⛔-
export const getExpenseUnpaidBill = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    const unpaidAmount = await GroupExpense.aggregate([
      { $unwind: "$splitDetails" },
      {
        $match: {
          "splitDetails.user": new mongoose.Types.ObjectId(userId),
          "splitDetails.status": "pending",
        },
      },
      { $group: { _id: null, total: { $sum: "$splitDetails.amount" } } },
    ]);

    res.status(200).json({
      success: true,
      unpaidAmount: unpaidAmount[0]?.total || 0,
    });
  } catch (error) {
    console.error("Error calculating unpaid amount:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

// Update expense status - PATCH
export const updateExpenseDataStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { expenseId, userId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(expenseId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return next(new ErrorHandler("Invalid expense ID or user ID", 400));
    }

    const updatedExpense = await GroupExpense.updateOne(
      { _id: expenseId, "splitDetails.user": userId },
      { $set: { "splitDetails.$.status": "settled" } }
    );

    if (updatedExpense.modifiedCount === 0) {
      return next(new ErrorHandler("Expense or user not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Expense status updated successfully",
    });
  } catch (error) {
    console.error("Error updating expense status:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

//GET TOTAL EXPENSES BY USER ID -GET {AMOUNT, total invest,own paid, and you owned 👌}
export const getTotalExpensesByUserId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req?.user?.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    // Total amount of all expenses in all groups the user has joined
    const totalAmount = await GroupExpense.aggregate([
      { $unwind: "$splitDetails" },
      {
        $match: {
          "splitDetails.user": new mongoose.Types.ObjectId(userId),
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Total amount paid by the user
    const totalPaid = await GroupExpense.aggregate([
      { $match: { paidBy: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Total amount owed to the user by other members
    const totalOwed = await GroupExpense.aggregate([
      { $unwind: "$splitDetails" },
      {
        $match: {
          "splitDetails.user": new mongoose.Types.ObjectId(userId),
          "splitDetails.status": "pending",
        },
      },
      { $group: { _id: null, total: { $sum: "$splitDetails.amount" } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalAmount: totalAmount[0]?.total || 0,
        totalPaid: totalPaid[0]?.total || 0,
        totalOwed: totalOwed[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching total expenses by user ID:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

//GET ALL ACTIVITY BY EVERY THING [LIST , show all user activity like add new expense, ]
export const getAllActivity = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req?.user?.id; // Get the logged-in user's ID

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    // Fetch all groups the user is a member of
    const groups = await Group.find({
      members: userId,
    }).select("_id name");

    if (!groups || groups.length === 0) {
      res.status(200).json({
        success: true,
        activities: [],
      });
    }

    // Fetch all activities (expenses) for the user's groups
    const groupIds = groups.map((group) => group._id);
    const activities = await GroupExpense.find({ groupId: { $in: groupIds } })
      .populate("groupId", "name") // Populate group name
      .populate("paidBy", "name email") // Populate the user who created the activity
      .populate("splitDetails.user", "name email") // Populate splitDetails user
      .select("groupId title amount timestamp paidBy splitDetails categoty"); // Select relevant fields

    // Format the activities
    const formattedActivities = activities.map((activity: any) => ({
      _id: activity._id,
      groupName: activity.groupId,
      title: activity.title,
      amount: activity.amount,
      timestamp: activity.timestamp,
      createdBy: activity.paidBy,
      splitDetails: activity.splitDetails.map((split: any) => ({
        user: split.user,
        amount: split.amount,
        status: split.status,
      })),
      categoty: activity.categoty,
    }));

    res.status(200).json({
      success: true,
      activities: formattedActivities,
    });
  } catch (error) {
    console.error("Error fetching all activities:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

//GET USER GET ACTIVITY [LIST all add new expense user activity 👤]
export const getUserActivity = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req?.user?.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    const userActivities = await GroupExpense.find({ paidBy: userId })
      .populate("groupId", "name") // Populate the group name
      .populate("splitDetails.user", "name email") // Populate split details
      .select("groupId title amount timestamp splitDetails categoty"); // Select only relevant fields
    // Format the response

    const formattedActivities = userActivities.map((activity: any) => ({
      id: activity?._id,
      groupName: activity.groupId,
      purpose: activity.title,
      amount: activity.amount,
      timestamp: activity.timestamp,
      categoty:activity.categoty,
      splitDetails: activity.splitDetails.map((split: any) => ({
        user: split.user,
        amount: split.amount,
        status: split.status,
      })),
    }));

    res.status(200).json({
      success: true,
      userActivities: formattedActivities,
    });
  } catch (error) {
    console.error("Error fetching user activities:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};
