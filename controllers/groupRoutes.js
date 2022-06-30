import { Router } from 'express';
import GroupController from './groupController.js';

// Express Router
const groupRouter = Router();

// Create new group
groupRouter.route('/new').post(GroupController.NewGroup);

// Invite new member to group
groupRouter.route('/invite').post(GroupController.InviteMember);

// Remove a group member
groupRouter.route('/remove').post(GroupController.RemoveMember);

// Accept a group invitation
groupRouter.route('/accept').post(GroupController.AcceptInvitation);

export default groupRouter;