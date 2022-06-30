import Event from '../models/eventSchema.js';

export default class EventController {
    static async AddEvent(req, res) {
        const body = req.body;

        // Make the newEvent object to later save as an event
        const newEvent = {
            title: body.title,
            task: body.task,
            allDay: body.allDay,
            recurring: body.recurring,
            peopleAssigned: [...body.peopleAssigned],
            groupsAssigned: body.groupsAssigned,
            tags: [...body.tags],
            notes: body.notes,
            dateCreated: new Date(),
            lastUpdated: new Date()
        };

        try {
            const eventDoc = await Event.create(newEvent);

            res.json({event: eventDoc});

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    static async UpdateEventInfo(req, res) {

    }

    static async AddAssignedUser(req, res) {

    }

    static async RemoveAssignedUser(req, res) {

    }

    static async AddAssignedGroup(req, res) {

    }

    static async RemoveAssignedGroup(req, res) {

    }

    static async DeleteEvent(req, res) {

    }

    static async GetEvent(req, res) {

    }

    static async GetEvents(req, res) {

    }
}