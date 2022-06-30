import { Router } from 'express';
import GroupController from './groupController.js';

// Express Router
const groupRouter = Router();

// Create new group
groupRouter.route('/new').post(GroupController.NewGroup);

// Invite new member to group
groupRouter.route('/invite').post(GroupController.InviteMember);

export default groupRouter;