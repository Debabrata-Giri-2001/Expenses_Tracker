import express from "express";
import {
  createExpense,
  getAllActivity,
  getUserActivity,
  getExpensePaidBill,
  getAllExpenseAmount,
  getExpenseUnpaidBill,
  getExpenseDataDetails,
  getExpenseWithGroupId,
  updateExpenseDataStatus,
  getTotalExpensesByUserId,
  getExpenseDataDetailsWithID,
  getExpenseDataWhoPaidBill,
} from "../controller/expenseController";
import { isAuthenticatedUser } from "../middleware/auth";

const router = express.Router();

router.route("/create-expense").post(isAuthenticatedUser, createExpense);
router.route("/group/:groupId/expenses").get(isAuthenticatedUser, getExpenseWithGroupId);
router.route("/expense/:expenseId").get(isAuthenticatedUser, getExpenseDataDetailsWithID);
router.route("/group/:groupId/total-amount").get(isAuthenticatedUser, getAllExpenseAmount);
router.route("/group/:groupId/total-details").get(isAuthenticatedUser, getExpenseDataDetails);
router.route("/group/:groupId/paid-users").get(isAuthenticatedUser, getExpenseDataWhoPaidBill);
router.route("/user/:userId/total-paid").get(isAuthenticatedUser, getExpensePaidBill);
router.route("/user/:userId/total-unpaid").get(isAuthenticatedUser, getExpenseUnpaidBill);
router
  .route("/expense/:expenseId/user/:userId/status")
  .patch(isAuthenticatedUser, updateExpenseDataStatus);

router.route("/user/total-expenses").get(isAuthenticatedUser, getTotalExpensesByUserId);
router.route("/group/activity").get(isAuthenticatedUser, getAllActivity);
router.route("/user/activity").get(isAuthenticatedUser, getUserActivity);

export default router;
