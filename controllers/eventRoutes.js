import { Router } from 'express';
import EventController from './eventController.js';

//Express Router
const eventRouter = Router();

// Create new event
eventRouter.route('/new').post(EventController.AddEvent);

// Update event info
eventRouter.route('/:eventId/update/info').put(EventController.UpdateEventInfo);

export default eventRouter;