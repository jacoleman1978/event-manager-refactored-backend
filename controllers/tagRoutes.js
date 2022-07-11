import { Router } from 'express';
import TagController from './tagController.js';

// Express Router
const tagRouter = Router();

// Create new tag
tagRouter.route('/new').post(TagController.NewTag);

// Get events by tagId
tagRouter.route('/:tagId').get(TagController.GetEventsByTag);

export default tagRouter;