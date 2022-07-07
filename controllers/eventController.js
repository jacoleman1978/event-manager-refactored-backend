import Event from '../models/eventSchema.js';
import User from '../models/userSchema.js';
import Group from '../models/groupSchema.js';
import canEditEvent from './canEditEvent.js';

export default class EventController {
    static async AddEvent(req, res) {
        // Make the newEvent object
        const newEvent = req.body;
        newEvent["dateCreated"] = new Date();
        newEvent["lastUpdated"] = new Date();

        try {
            const eventDoc = await Event.create(newEvent);

            // Collect all userIds from the event
            let userIds = [eventDoc.ownerId, ...eventDoc.editorIds, ...eventDoc.viewerIds];
            
            // Make userId list into a Set to remove duplicates
            let userIdSet = new Set(userIds);

            // Add the event to the user's document in the eventIds field
            for (let userId of userIdSet) {
                await User.updateOne({_id: userId}, {$addToSet: {eventIds: eventDoc._id}});
            }

            // Check to see if the event has any assigned groups
            if (eventDoc.groupIds.length > 0) {
                // Make a list of userIds from assigned groups
                let groupUserIds = [];
                for (let groupId of eventDoc.groupIds) {
                    let groupDoc = await Group.findOne({_id: groupId});
                    groupUserIds = [...groupUserIds, groupDoc.ownerId, ...groupDoc.editorIds, ...groupDoc.viewerIds];

                    // Add the eventId to the group document
                    await Group.updateOne({_id: groupId}, {$addToSet: {eventIds: eventDoc._id}});
                }

                // Make the userIds from assigned groups into a Set to remove duplicates
                let groupUserIdSet = new Set(groupUserIds);

                // Add the eventId to the user's document in the groupEventIds field
                for (let userId of groupUserIdSet) {
                    await User.updateOne({_id: userId}, {$addToSet: {groupEventIds: eventDoc._id}});
                }
            }

            res.json({event: eventDoc});

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    static async UpdateEventInfo(req, res) {
        try {
            const userId = req.body.userId;
            const fieldsToUpdate = req.body.fieldsToUpdate;
            const eventId = req.params.eventId;
            let canEdit = await canEditEvent(eventId, userId);

            
            if (canEdit == true) {
                // Update the lastUpdated field
                fieldsToUpdate["lastUpdated"] = new Date();
    
                // Update the event document by eventId
                await Event.updateOne({_id: eventId}, {$set: fieldsToUpdate});
    
                // Retrieve the newly edited file and respond with it
                const updatedEvent = await Event.findOne({_id: eventId});
    
                res.json({message: "Update successful", updatedEvent: updatedEvent});

            } else {
                res.json({message: "User is not the owner or an editor", updatedEvent: null})
            }

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    static async AddAssignedUser(req, res) {
        try {
            const userId = req.body.userId;
            const userToAssign = req.body.userToAssign;
            const newUserEditPrivilege = req.body.newUserEditPrivilege;
            const eventId = req.params.eventId;
            let userAlreadyAssigned = false;

            const userDoc = await User.findOne({_id: userToAssign}, {eventIds: 1});

            for (let userEventId of userDoc.eventIds) {
                if (eventId == userEventId) {
                    userAlreadyAssigned = true;
                }
            }

            if (userAlreadyAssigned == true) {
                res.json({message: "User is already assigned to the event", updatedEvent: null})
            } else {
                let canEdit = await canEditEvent(eventId, userId);

                // Check that the user requesting the update has the permission to do so
                if (canEdit == true) {
                    // Push the userToAssign object to the peopleAssigned list
                    if (newUserEditPrivilege == "Viewer") {
                        await Event.updateOne({_id: eventId}, {$addToSet: {viewerIds: userToAssign}});
    
                    } else if (newUserEditPrivilege == "Editor") {
                        await Event.updateOne({_id: eventId}, {$addToSet: {editorIds: userToAssign}});
                    }
                    
                    // Add the event to the user document
                    await User.updateOne({_id: userToAssign}, {$addToSet: {eventIds: eventId}});
        
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
            const userId = req.body.userId;
            const eventId = req.params.eventId;
            const userToRemove = req.body.userToRemove;
            let isRemoverOwner = false;
            let isRemoverEditor = false;
            let isRemovedEditor = false;
            let isRemovedViewer = false;
            let canUserBeRemoved = false;

            const eventDoc = await Event.findOne({_id: eventId}, {ownerId: 1, editorIds:1, viewerIds: 1});

            // Check if the user requesting the removal is the event owner
            if (userId == eventDoc.ownerId) {
                isRemoverOwner = true;
            }

            // Check if the user to be removed is an event editor
            if (eventDoc.editorIds.length > 0) {
                for (let editorId of eventDoc.editorIds) {
                    if (userToRemove == editorId) {
                        isRemovedEditor = true;
                    }
                    if (userId == editorId) {
                        isRemoverEditor = true;
                    }
                }
            } 

            // Check if the user to be removed is an event user
            if (eventDoc.viewerIds.length > 0) {
                for (let viewerId of eventDoc.viewerIds) {
                    if (userToRemove == viewerId) {
                        isRemovedViewer = true;
                    }
                }
            }

            // Only the owner of an event can remove an editor
            if (isRemovedEditor == true && isRemoverOwner == true) {
                canUserBeRemoved = true;

            } else if (isRemovedViewer == true && (isRemoverOwner || isRemoverEditor)) {
                // A viewer can be removed by the event owner or an event editor
                canUserBeRemoved = true;
            }

            if (canUserBeRemoved == true) {
                // Remove the user id from the event editorIds field
                await Event.updateOne({_id: eventId}, {$pull: {editorIds: userToRemove, viewerIds: userToRemove}});

                // Remove the event id from the user's eventIds field
                await User.updateOne({_id: userToRemove}, {$pull: {eventIds: eventId}});

                res.json({message: "Removed assigned user", updatedEvent: true});

            } else {
                res.json({message: "User was not removed", updatedEvent: false})
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

            const eventDoc = await Event.findOne({_id: eventId});

            if (userId == eventDoc.ownerId) {
                // Collect all userIds from the event
                let userIds = [eventDoc.ownerId, ...eventDoc.editorIds, ...eventDoc.viewerIds];
                
                // Make userId list into a Set to remove duplicates
                let userIdSet = new Set(userIds);
    
                // Remove the event to the user's document in the eventIds field
                for (let userId of userIdSet) {
                    await User.updateOne({_id: userId}, {$pull: {eventIds: eventDoc._id}});
                }
    
                // Check to see if the event has any assigned groups
                if (eventDoc.groupIds.length > 0) {
                    // Make a list of userIds from assigned groups
                    let groupUserIds = [];
                    for (let groupId of eventDoc.groupIds) {
                        let groupDoc = await Group.findOne({_id: groupId});
                        groupUserIds = [...groupUserIds, groupDoc.ownerId, ...groupDoc.editorIds, ...groupDoc.viewerIds];
    
                        // Remove the eventId from the group document
                        await Group.updateOne({_id: groupId}, {$pull: {eventIds: eventDoc._id}});
                    }
    
                    // Make the userIds from assigned groups into a Set to remove duplicates
                    let groupUserIdSet = new Set(groupUserIds);
    
                    // Remove the eventId from the user's document in the groupEventIds field
                    for (let userId of groupUserIdSet) {
                        await User.updateOne({_id: userId}, {$pull: {groupEventIds: eventDoc._id}});
                    }
                }

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