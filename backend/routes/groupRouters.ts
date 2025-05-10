import express from "express";
import {
  getGroupById,
  createGroup,
  manageGroupMembers,
  updateGroup,
  inviteUser,
  getGroupsByStatus,
  updateInvitationStatus,
  getYourGroups,
  getJoinedGroups,
  getInviteGroups,
  getIgnoredGroups,
  getGroupUserDetailsById
} from "../controller/groupController";
import { isAuthenticatedUser } from "../middleware/auth";

const router = express.Router();

router.route("/get-groupBy/:groupId").get(isAuthenticatedUser, getGroupById);
router.route("/get-groupUsersBy/:groupId").get(isAuthenticatedUser, getGroupUserDetailsById);
router.route("/create-group").post(isAuthenticatedUser, createGroup);
router.route("/add-remove-member").patch(isAuthenticatedUser, manageGroupMembers);
router.route("/update-group/:groupId").patch(isAuthenticatedUser, updateGroup);
router.route("/invite-user").put(isAuthenticatedUser, inviteUser);
router.route("/groups").get(isAuthenticatedUser, getGroupsByStatus);

router.route("/groups/yourGroups").get(isAuthenticatedUser, getYourGroups);
router.route("/groups/joinedGroups").get(isAuthenticatedUser, getJoinedGroups);
router.route("/groups/inviteGroups").get(isAuthenticatedUser, getInviteGroups);
router.route("/groups/ignoredGroups").get(isAuthenticatedUser, getIgnoredGroups);

router.route("/groups/:groupId/invitation").patch(isAuthenticatedUser, updateInvitationStatus);


export default router;
