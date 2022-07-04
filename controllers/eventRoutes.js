import { Router } from 'express';
import EventController from './eventController.js';

//Express Router
const eventRouter = Router();

// Create new event
eventRouter.route('/new').post(EventController.AddEvent);

// Update event info
eventRouter.route('/:eventId/update/info').put(EventController.UpdateEventInfo);

// Add assigned user
eventRouter.route('/:eventId/update/adduser').put(EventController.AddAssignedUser);

// Remove assigned user
eventRouter.route('/:eventId/update/removeuser').put(EventController.RemoveAssignedUser);

// Add assigned group
eventRouter.route('/:eventId/update/addgroup').put(EventController.EditAssignedGroup);

// Delete an event
eventRouter.route('/:eventId').delete(EventController.DeleteEvent);

export default eventRouter;