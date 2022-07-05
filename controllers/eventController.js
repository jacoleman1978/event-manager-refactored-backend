import Event from '../models/eventSchema.js';
import User from '../models/userSchema.js';
import Group from '../models/groupSchema.js';

export default class EventController {
    static async AddEvent(req, res) {
        // Make the newEvent object
        const newEvent = req.body;
        newEvent["dateCreated"] = new Date();
        newEvent["lastUpdated"] = new Date();

        try {
            const eventDoc = await Event.create(newEvent);

            let userIds = [eventDoc.ownerId, ...eventDoc.editorIds, ...eventDoc.viewerIds];

            if (eventDoc.groupIds.length > 0) {
                for (let groupId of eventDoc.groupIds) {
                    let groupDoc = await Group.findOne({_id: groupId});
                    userIds = [...userIds, groupDoc.ownerId, ...groupDoc.editorIds, ...groupDoc.viewerIds];
                }
            }

            let userIdSet = new Set(userIds);

            if (eventDoc.task.isIt == true) {
                for (let userId of userIdSet) {
                    await User.updateOne({_id: userId}, {$addToSet: {taskIds: eventDoc._id}});
                }
            } else {
                for (let userId of userIdSet) {
                    await User.updateOne({_id: userId}, {$addToSet: {eventIds: eventDoc._id}});
                }
            }

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

            // Check that the user requesting the update has the permission to do so
            if ( userType == 'Owner' || userType == 'Edit') {
                const fieldsToUpdate = body.fieldsToUpdate;
                
                // Update the lastUpdated field
                fieldsToUpdate["lastUpdated"] = new Date();
    
                // Update the event document by eventId
                await Event.updateOne({_id: eventId}, {$set: fieldsToUpdate});
    
                // Retrieve the newly edited file and respond with it
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

            // If the user is already assigned, skip assignment
            if (userAssigned == true) {
                res.json({message: "User already assigned"})

            } else {
                const userType = await getUserType(eventId, body.userId);

                // Check that the user requesting the update has the permission to do so
                if (userType == 'Owner' || userType == 'Edit') {
                    const userToAssign = body.userToAssign;
        
                    // Push the userToAssign object to the peopleAssigned list
                    await Event.updateOne({_id: eventId}, {$push: {peopleAssigned: [userToAssign]}});
        
                    // Retrieve the newly edited file and respond with it
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
            const removedUserId = body.userToRemove.userId;
            const userAssigned = await isUserAssigned(eventId, removedUserId);

            // If the user is not on the peopleAssigned list, skip removal
            if (userAssigned == false) {
                res.json({message: "User not assigned"})

            } else {
                const removedUserType = await getUserType(eventId, removedUserId);

                // Check if the user to be removed is the owner, and skip removal if it is
                if (removedUserType == 'Owner') {
                    res.json({message: "Can not remove the owner of an event", updatedEvent: null});

                } else {
                    const userType = await getUserType(eventId, body.userId);

                    // Check that the user requesting the update has the permission to do so
                    if (userType == 'Owner' || userType == 'Edit') {
                        // Remove the user object from the peopleAssigned list
                        await Event.updateOne({_id: eventId}, {$pull: {peopleAssigned: body.userToRemove}});
        
                        // Retrieve the newly edited file and respond with it
                        const updatedEvent = await Event.findOne({_id: eventId});
            
                        res.json({message: "Removed assigned user", updatedEvent: updatedEvent});

                    } else {
                        res.json({message: "User is not the owner or an editor", updatedEvent: null})
                    }
                }     
            }
            
        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    static async EditAssignedGroup(req, res) {
        try {
            const body = req.body;
            const eventId = req.params.eventId;
            const groupIds = body.groupIds;

            const userType = await getUserType(eventId, body.userId);

            // Check that the user requesting the update has the permission to do so
            if (userType == 'Owner' || userType == 'Edit') {
                let newGroupsAssigned = {
                    areThey: true,
                    groupIds: groupIds
                };

                if (groupIds.length == 0) {
                    newGroupsAssigned.areThey = false;
                }             
    
                // Push groupsAssigned object to the event
                await Event.updateOne({_id: eventId}, {$set: {groupsAssigned: newGroupsAssigned}});
    
                // Retrieve the newly edited file and respond with it
                const updatedEvent = await Event.findOne({_id: eventId});
    
                res.json({message: "Assigned new group", updatedEvent: updatedEvent});

            } else {
                res.json({message: "User is not the owner or an editor", updatedEvent: null})
            }    
            
        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    static async DeleteEvent(req, res) {
        try {
            const userId = req.body.userId;
            const eventId = req.params.eventId;

            const userType = await getUserType(eventId, userId);

            if (userType == 'Owner') {
                await Event.deleteOne({_id: eventId});

                res.json({message: "Event deleted"})
            } else {
                res.json({message: "Only the owner of an event can delete it"})
            }
        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    static async GetEvent(req, res) {

    }

    static async GetEvents(req, res) {

    }
}