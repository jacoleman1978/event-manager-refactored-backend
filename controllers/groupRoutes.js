import { Router } from 'express';
import GroupController from './groupController.js';

// Express Router
const groupRouter = Router();

// Create new group
groupRouter.route('/new').post(GroupController.NewGroup);

// Invite new member to group
groupRouter.route('/invite').put(GroupController.InviteMember);

// Remove a group member
groupRouter.route('/removemember').put(GroupController.RemoveMember);

// Accept a group invitation
groupRouter.route('/acceptinvite').put(GroupController.AcceptInvitation);

// Change a group member's member type
groupRouter.route('/membertype').put(GroupController.ChangeEditPrivilege);

// Change name of the group
groupRouter.route('/name').put(GroupController.ChangeGroupName);

// Get all groups where user is the owner
groupRouter.route('/owner').get(GroupController.GetOwnedGroups);

// Get all groups where user is a member
groupRouter.route('/memberships').get(GroupController.GetGroupMemberships);

// Get all groups invited by
groupRouter.route('/invitations').get(GroupController.GetGroupInvitations);

// Get group by groupId or delete group
groupRouter.route('/:groupId')
    .get(GroupController.GetGroupById)
    .delete(GroupController.DeleteGroup);

export default groupRouter;