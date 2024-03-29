import Event from '../models/eventSchema.js';
import User from '../models/userSchema.js';
import Group from '../models/groupSchema.js';

export default class EventController {
    // Make the newEvent object
    static async AddEvent(req, res) {
        const newEvent = req.body;
        newEvent["ownerId"] = req.session.userId;

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

    // Users with edit privilege can update fields in and event or task
    static async UpdateEventInfo(req, res) {
        try {
            const userId = req.session.userId;
            const fieldsToUpdate = req.body;
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

    // The owner of an event can assign a group to the event
    static async AddAssignedGroup(req, res) {
        try {
            const eventId = req.params.eventId;
            const groupIdToAdd = req.body.groupIdToAdd;
            const userId = req.session.userId;

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
                    const groupEditorIds = groupDoc.editorIds.map((editorId) => {
                        return editorId.toString()
                    })

                    const eventEditorIds = eventDoc.editorIds.map((editorId) => {
                        return editorId.toString()
                    })

                    const eventEditors = new Set([groupDoc.ownerId, ...groupEditorIds, ...eventEditorIds]);

                    const groupViewerIds = groupDoc.viewerIds.map((viewerId) => {
                        return viewerId.toString()
                    })

                    const eventViewerIds = eventDoc.viewerIds.map((viewerId) => {
                        return viewerId.toString()
                    })

                    const eventViewers = new Set([...groupViewerIds, ...eventViewerIds]);

                    // Add groupId to event document and set the editorIds and viewerIds with the new Sets
                    await Event.updateOne({_id: eventId}, {$addToSet: {groupIds: groupIdToAdd}, $set: {editorIds: [...eventEditors], viewerIds: [...eventViewers]}});

                    // Add eventId to the group member's groupEventIds field of user's document
                    const newUserIds = new Set([groupDoc.ownerId, ...groupEditorIds, ...groupViewerIds]);

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
            res.status(500).json({error: error.message});
        }
    }

    // The owner of a group can remove a group from the event
    static async RemoveAssignedGroup(req, res) {
        try {
            const eventId = req.params.eventId;
            const groupIdToRemove = req.body.groupIdToRemove;
            const userId = req.session.userId;

            // Retrieve the event document
            let eventDoc = await Event.findOne({_id: eventId});

            // Only the owner of the event can remove a group
            if (userId == eventDoc.ownerId) {
                // Check if the group to remove is assigned to the event
                let canRemoveGroup = false;

                for (let eventGroupId of eventDoc.groupIds) {
                    if (groupIdToRemove == eventGroupId) {
                        canRemoveGroup = true;
                        break;
                    }
                }

                // Remove the group from the event, if it is assigned
                if (canRemoveGroup == true) {
                    // Remove the eventId from the group
                    await Group.updateOne({_id: groupIdToRemove}, {$pull: {eventIds: eventId}});

                    // Retrieve the groupDoc
                    const groupDoc = await Group.findOne({_id: groupIdToRemove});

                    // Remove eventId from group member's groupEventIds field of user's document
                    const groupUserIds = new Set([groupDoc.ownerId, ...groupDoc.editorIds, ...groupDoc.viewerIds]);

                    for (let groupUserId of groupUserIds) {
                        await User.updateOne({_id: groupUserId}, {$pull: {groupEventIds: eventId}});
                    }

                    // Remove the groupId from the event and update the eventDoc
                    eventDoc = await Event.findOneAndUpdate({_id: eventId}, {$pull: {groupIds: groupIdToRemove}}, {new: true});

                    // Check to see if the event has any assigned groups
                    if (eventDoc.groupIds.length > 0) {
                        // Make a list of userIds from assigned groups
                        let groupEditorUserIds = new Set();
                        let groupViewerUserIds = new Set();

                        for (let groupId of eventDoc.groupIds) {
                            let groupDoc = await Group.findOne({_id: groupId});

                            groupEditorUserIds = new Set([...groupEditorUserIds, groupDoc.ownerId, ...groupDoc.editorIds]);

                            groupViewerUserIds = new Set([...groupViewerUserIds, ...groupDoc.viewerIds]);
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

                    eventDoc = await Event.findOne({_id: eventId});

                    res.json({message: "Group Removed", eventDoc: eventDoc});

                } else {
                    res.json({message: "Unable to remove a group that has not been assigned", eventDoc: eventDoc})
                }

            } else {
                res.json({message: "Only the owner of the event can remove a group", eventDoc: eventDoc})
            }

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // The owner of an event can delete the event
    static async DeleteEvent(req, res) {
        try {
            const userId = req.session.userId;
            const eventId = req.params.eventId;

            const eventDoc = await Event.findOne({_id: eventId});

            if (userId == eventDoc.ownerId) {
                // Remove the eventId from the owner's user doc
                await User.updateOne({_id: eventDoc.ownerId}, {$pull: {eventIds: eventId}});
                
                // Collect all userIds from the event as a Set
                let userIdSet = new Set([...eventDoc.editorIds, ...eventDoc.viewerIds]);
    
                // Remove the event from the user's document in the groupEventIds field
                for (let userId of userIdSet) {
                    await User.updateOne({_id: userId}, {$pull: {groupEventIds: eventDoc._id}});
                }
    
                // Check to see if the event has any assigned groups
                if (eventDoc.groupIds.length > 0) {
                    for (let groupId of eventDoc.groupIds) {   
                        // Remove the eventId from the group document
                        await Group.updateOne({_id: groupId}, {$pull: {eventIds: eventDoc._id}});
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

    // Gets all events associated with the current user
    static async GetEvents(req, res) {
        try {
            const userId = req.session.userId;

            const userDoc = await User.findOne({_id: userId}, {eventIds: 1, groupEventIds: 1, task: 1});

            let eventIds = [];

            // Get the ids as strings for all events in the user document, removing duplicates
            for (let event of userDoc.eventIds) {
                eventIds = [...eventIds, event._id.toString()]
            }

            for (let event of userDoc.groupEventIds) {
                eventIds = [...eventIds, event._id.toString()]
            }

            eventIds = new Set([...eventIds])

            let events = []

            // Get the event documents to return
            for (let eventId of eventIds) {
                let eventDoc = await Event.findOne({_id: eventId}).populate('groupIds').populate('editorIds').populate('viewerIds').populate('ownerId');

                if (eventDoc.task.isIt === false) {
                    events = [...events, eventDoc]
                } 
            }

            res.json({events: events});
        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Returns an object that sorts events associated with a user into personal events and individual group events
    static async GetUserGroupsEvents(req, res) {
        try {
            const userId = req.session.userId;

            const userDoc = await User.findOne({_id: userId});

            let events = {groups: {}};

            events[userDoc._id] = {
                events: [],
                userName: userDoc.userName,
                userId: userDoc._id,
                fullName: `${userDoc.firstName} ${userDoc.lastName}`
            }

            // Get all personal events for a user
            for (let eventId of userDoc.eventIds) {
                let eventDoc = await Event.findOne({_id: eventId}).populate('groupIds').populate('editorIds').populate('viewerIds').populate('ownerId');

                if (eventDoc.task.isIt === false && eventDoc.groupIds.length === 0) {
                    events[userDoc._id].events = [...events[userDoc._id].events, eventDoc];
                } 
            }

            // Get all groups for a user with their associated group name and eventIds
            for (let groupId of userDoc.groupIds) {
                let groupDoc = await Group.findOne({_id: groupId}, {name: 1, eventIds: 1});

                events.groups[groupId] = {
                    events: [],
                    groupName: groupDoc.name,
                    groupId: groupId
                }

                // Populate group events and add to the events object
                for (let groupEventId of groupDoc.eventIds) {
                    let groupEventDoc = await Event.findOne({_id: groupEventId}).populate('groupIds').populate('editorIds').populate('viewerIds').populate('ownerId');

                    if (groupEventDoc.task.isIt === false) {
                        events.groups[groupId].events = [...events.groups[groupId].events, groupEventDoc];
                    } 
                }
            }

            res.json({events: events});

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Return an individual event document, if the current user is associated with the event
    static async GetEventById(req, res) {
        try {
            const eventId = req.params.eventId;
            const userId = req.session.userId;

            let validUser = false;

            const eventDoc = await Event.findOne({_id: eventId});

            // Make a set of all userIds associated with an event
            const eventUserList = new Set([eventDoc.ownerId, ...eventDoc.editorIds, ...eventDoc.viewerIds]);

            // Check if the current user is associated with the event
            // If they are, return the eventDoc, otherwise return null
            for (let eventUserId of eventUserList) {
                if (userId == eventUserId) {
                    validUser = true;
                    break;
                }
            }

            if (validUser == true) {
                res.json({eventDoc: eventDoc});

            } else {
                res.json({eventDoc: null});

            }
            
        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Get and return all taks for the current user that are not completed
    static async GetTasks(req, res) {
        try {
            const userId = req.session.userId;

            const taskDocs = await Event.find({$and: [{ownerId: userId}, {"task.isIt": true}, {"task.taskCompleted": {$ne: true}}]}).populate('editorIds').populate('viewerIds').populate('groupIds').populate('tagIds').populate('ownerId');

            res.json({tasks: [...taskDocs]});
        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // The owner of a task can complete the task
    static async CompleteTask(req,res) {
        try {
            const userId = req.session.userId;
            const eventId = req.params.eventId;

            const taskDoc = await Event.findOne({_id: eventId});

            // If the current user is the owner of the task, set the fields to complete it
            if (taskDoc.ownerId.toString() === userId) {
                const updatedDoc = {
                    task: {
                        isIt: true,
                        priority: "Low",
                        taskCompleted: true,
                        dateCompleted: new Date()
                    },
                    lastUpdated: new Date()
                }

                await Event.updateOne({_id: eventId}, {$set: updatedDoc});

                return res.json({message: "Successfully completed task"})
            } else {
                return res.json({message: "You are not the owner"})
            }

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Gets all task for the current user that have been marked completed
    static async GetCompletedTasks(req, res) {
        try {
            const userId = req.session.userId;

            const taskDocs = await Event.find({$and: [{ownerId: userId}, {"task.isIt": true}, {"task.taskCompleted": true}]});

            res.json({tasks: [...taskDocs]});

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }
}