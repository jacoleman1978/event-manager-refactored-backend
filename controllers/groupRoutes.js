import { Router } from 'express';
import GroupController from './groupController.js';

// Express Router
const groupRouter = Router();

// Create new group
groupRouter.route('/new').post(GroupController.NewGroup);

// Invite new member to group
groupRouter.route('/:groupId/invite').put(GroupController.InviteMember);

// Remove a group member
groupRouter.route('/:groupId/removemember').put(GroupController.RemoveMember);

// Accept a group invitation
groupRouter.route('/:groupId/acceptinvite').put(GroupController.AcceptInvitation);

// Change a group member's member type
groupRouter.route('/:groupId/membertype').put(GroupController.ChangeEditPrivilege);

// Change name of the group
groupRouter.route('/:groupId/name').post(GroupController.ChangeGroupName);

// Delete group
groupRouter.route('/:groupId').delete(GroupController.DeleteGroup);

// Get all groups where user is the owner
groupRouter.route('/owner').get(GroupController.GetOwnedGroups);

export default groupRouter;