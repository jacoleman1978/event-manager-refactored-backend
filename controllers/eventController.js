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
            let eventDoc = await Event.create(newEvent);

            // Add the event to the owner's user document in the eventIds field
            await User.updateOne({_id: newEvent.ownerId}, {$addToSet: {eventIds: eventDoc._id}});

            // Check to see if the event has any assigned groups
            if (eventDoc.groupIds.length > 0) {
                // Make a list of userIds from assigned groups
                let groupEditorUserIds = new Set();
                let groupViewerUserIds = new Set();

                for (let groupId of eventDoc.groupIds) {
                    let groupDoc = await Group.findOne({_id: groupId});

                    groupEditorUserIds = new Set([...groupEditorUserIds, groupDoc.ownerId, ...groupDoc.editorIds]);

                    groupViewerUserIds = new Set([...groupViewerUserIds, ...groupDoc.viewerIds]);

                    // Add the eventId to the group document
                    await Group.updateOne({_id: groupId}, {$addToSet: {eventIds: eventDoc._id}});
                }

                // Add userIds from groups to event with appropriate edit privilege
                await Event.updateOne({_id: eventDoc._id}, {$set: {editorIds: [...groupEditorUserIds], viewerIds: [...groupViewerUserIds]}});

                // Make Set of all users associated with event
                const eventUserList = new Set([...groupEditorUserIds, ...groupViewerUserIds]);

                // Add the eventId to the user's document in the groupEventIds field
                for (let userId of eventUserList) {
                    await User.updateOne({_id: userId}, {$addToSet: {groupEventIds: eventDoc._id}});
                }
            }

            eventDoc = await Event.findOne({_id: eventDoc._id});

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
            let canEdit = false;

            // Retrieve the ownerId of the event
            const { ownerId, editorIds } = await Event.findOne({_id: eventId}, {ownerId: 1, editorIds: 1});

            // Check if the user updating the event is the owner of the event
            if (userId == ownerId) {
                canEdit = true;
            }

            // If the userId does not belong to the event owner, check if the user has edit permission
            if (canEdit == false) {
                for (let editorId of editorIds) {
                    if (userId == editorId) {
                        canEdit = true;
                        break;
                    }
                }
            }

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

    static async AddAssignedGroup(req, res) {
        try {
            const eventId = req.params.eventId;
            const groupIdToAdd = req.body.groupIdToAdd;
            const userId = req.body.userId;

            // Retrieve the event document
            let eventDoc = await Event.findOne({_id: eventId});

            // Only the owner of the event can add a group
            if (userId == eventDoc.ownerId) {
                // Check if the group is already assigned to the event
                let canAddGroup = true;

                for (let eventGroupId of eventDoc.groupIds) {
                    if (groupIdToAdd == eventGroupId) {
                        canAddGroup = false;
                        break;
                    }
                }

                // Add the group to the event, if it hasn't already been assigned
                if (canAddGroup == true) {
                    // Add the eventId to the group
                    await Group.updateOne({_id: groupIdToAdd}, {$addToSet: {eventIds: eventId}});

                    // Retrieve the groupDoc
                    const groupDoc = await Group.findOne({_id: groupIdToAdd});

                    // Create new Sets of editorIds and viewerIds from current event and new group added
                    const eventEditors = new Set([groupDoc.ownerId, ...groupDoc.editorIds, ...eventDoc.editorIds]);

                    const eventViewers = new Set([...groupDoc.viewerIds, ...eventDoc.viewerIds]);

                    // Add groupId to event document and set the editorIds and viewerIds with the new Sets
                    await Event.updateOne({_id: eventId}, {$addToSet: {groupIds: groupIdToAdd}, $set: {editorIds: [...eventEditors], viewerIds: [...eventViewers]}});

                    // Add eventId to the group member's user's field of groupEventIds
                    const newUserIds = new Set([groupDoc.ownerId, ...groupDoc.editorIds, ...groupDoc.viewerIds]);

                    for (let newUserId of newUserIds) {
                        await User.updateOne({_id: newUserId}, {$addToSet: {groupEventIds: eventId}});
                    }

                    eventDoc = await Event.findOne({_id: eventId});

                    res.json({message: "Group Added", eventDoc: eventDoc});

                } else {
                    res.json({message: "Group is already assigned", eventDoc: eventDoc});
                }   
            } else {
                res.json({message: "Only the owner of the event can assign a new group", eventDoc: eventDoc});
            }

        } catch(error) {
            res.status(500).json({error: error.message})
        }
    }

    static async EditAssignedGroup(req, res) {
        try {
            const eventId = req.params.eventId;
            const groupIds = req.body.groupIds;
            const userId = req.body.userId;
            let canEdit = false;

            const eventDoc = await Event.findOne({_id: eventId}, {ownerId: 1, editorIds: 1, groupIds:1});

            let groupsToRemove = new Set(eventDoc.groupIds);
            let groupsToAdd = new Set(groupIds);

            for (let groupId of groupsToRemove) {
                if (groupsToAdd.has(groupId.valueOf())) {
                    console.log("Yup it has it")
                }
            }


            const editAccessUsers = [eventDoc.ownerId, ...eventDoc.editorIds];

            for (let editUserId of editAccessUsers) {
                if (userId == editUserId) {
                    canEdit == true;
                    break;
                }
            }

            let groupEditAccessUsers = new Set();

            if (canEdit == false) {
                for (let groupId of groupIds) {
                    let groupDoc = await Group.findOne({_id: groupId}, {ownerId: 1, editorIds: 1});

                    groupEditAccessUsers = new Set([...groupEditAccessUsers, groupDoc.ownerId, ...groupDoc.editorIds]);
                }

                for (let editUserId of groupEditAccessUsers) {
                    if (userId == editUserId) {
                        canEdit = true;
                        break;
                    }
                }
            }

            if (canEdit == true) {
                //await Event.updateOne({_id: eventId}, {$set: {groupIds: [...groupIds]}});
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