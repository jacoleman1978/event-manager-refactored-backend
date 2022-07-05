import { Router } from 'express';
import GroupController from './groupController.js';

// Express Router
const groupRouter = Router();

// Create new group
groupRouter.route('/new').post(GroupController.NewGroup);

// Invite new member to group
groupRouter.route('/:groupId/invite').put(GroupController.InviteMember);

// Remove a group member
groupRouter.route('/member/remove').post(GroupController.RemoveMember);

// Accept a group invitation
groupRouter.route('/:groupId/acceptinvite').put(GroupController.AcceptInvitation);

// Change a group member's member type
groupRouter.route('/member/type').post(GroupController.ChangeMemberType);

// Change name of the group
groupRouter.route('/name').post(GroupController.ChangeGroupName);

export default groupRouter;