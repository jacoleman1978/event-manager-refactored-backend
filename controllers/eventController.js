import Event from '../models/eventSchema.js';
import getUserType from './eventHelpers/getUserType.js';
import isUserAssigned from './eventHelpers/isUserAssigned.js';

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
        try {
            const body = req.body;
            const eventId = req.params.eventId;
            const userType = await getUserType(eventId, body.userId);

            if ( userType == 'Owner' || userType == 'Edit') {
                const fieldsToUpdate = body.fieldsToUpdate;
                
                fieldsToUpdate["lastUpdated"] = new Date();
    
                await Event.updateOne({_id: eventId}, {$set: fieldsToUpdate});
    
                const updatedEvent = await Event.findOne({_id: eventId});
    
                res.json({message: "Update successful", updatedEvent: updatedEvent});

            } else {
                res.json({message: "User is not the owner or an editor", updatedEvent: userType})
            }

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    static async AddAssignedUser(req, res) {
        try {
            const body = req.body;
            const eventId = req.params.eventId;
            const userAssigned = await isUserAssigned(eventId, body.userToAssign.userId);

            if (userAssigned == true) {
                res.json({message: "User already assigned"})
            } else {
                const userType = await getUserType(eventId, body.userId);

                if (userType == 'Owner' || userType == 'Edit') {
                    const userToAssign = body.userToAssign;
        
                    await Event.updateOne({_id: eventId}, {$push: {peopleAssigned: [userToAssign]}});
        
                    const updatedEvent = await Event.findOne({_id: eventId});
        
                    res.json({message: "Assigned new user", updatedEvent: updatedEvent});
    
                } else {
                    res.json({message: "User is not the owner or an editor", updatedEvent: null})
                }    
            }
            
        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    static async RemoveAssignedUser(req, res) {
        try {
            const body = req.body;
            const eventId = req.params.eventId;
            const userAssigned = await isUserAssigned(eventId, body.userToRemove.userId);

            if (userAssigned == false) {
                res.json({message: "User not assigned"})

            } else {
                const userType = await getUserType(eventId, body.userId);

                if (userType == 'Owner' || userType == 'Edit') {
                    await Event.updateOne({_id: eventId}, {$pull: {peopleAssigned: body.userToRemove}});
        
                    const updatedEvent = await Event.findOne({_id: eventId});
        
                    res.json({message: "Removed assigned user", updatedEvent: updatedEvent});
    
                } else {
                    res.json({message: "User is not the owner or an editor", updatedEvent: null})
                }    
            }
            
        } catch(error) {
            res.status(500).json({error: error.message});
        }
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