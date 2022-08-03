import { Router } from 'express';
import EventController from './eventController.js';

//Express Router
const eventRouter = Router();

// Get all tasks for a user
eventRouter.route('/tasks').get(EventController.GetTasks);

// Get all events for a user
eventRouter.route('/all').get(EventController.GetEvents);

// Create new event
eventRouter.route('/new').post(EventController.AddEvent);

// Update event info
eventRouter.route('/:eventId/update/info').put(EventController.UpdateEventInfo);

// Add assigned group
eventRouter.route('/:eventId/update/addgroup').put(EventController.AddAssignedGroup);

// Remove assigned group
eventRouter.route('/:eventId/update/removegroup').put(EventController.RemoveAssignedGroup);

// Delete an event
eventRouter.route('/:eventId').delete(EventController.DeleteEvent);

// Get all the events for a user
eventRouter.route('/').get(EventController.GetEvents);

// Get event by eventId
eventRouter.route('/:eventId').get(EventController.GetEventById);

export default eventRouter;