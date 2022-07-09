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
            const { ownerId, groupIds } = await Event.findOne({_id: eventId}, {ownerId: 1, groupIds: 1});

            // Check if the user updating the event is the owner of the event
            if (userId == ownerId) {
                canEdit = true;
            }

            // If the userId does not belong to the event owner, check if the user has edit permission from their group
            if (canEdit == false) {
                for (let groupId of groupIds) {
                    let groupDoc = await Group.findOne({_id: groupId}, )
                }
            }

            //let canEdit = await canEditEvent(eventId, userId);

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

    // static async AddAssignedUser(req, res) {
    //     try {
    //         const userId = req.body.userId;
    //         const userToAssign = req.body.userToAssign;
    //         const newUserEditPrivilege = req.body.newUserEditPrivilege;
    //         const eventId = req.params.eventId;
    //         let userAlreadyAssigned = false;

    //         const userDoc = await User.findOne({_id: userToAssign}, {eventIds: 1});

    //         for (let userEventId of userDoc.eventIds) {
    //             if (eventId == userEventId) {
    //                 userAlreadyAssigned = true;
    //             }
    //         }

    //         if (userAlreadyAssigned == true) {
    //             res.json({message: "User is already assigned to the event", updatedEvent: null})
    //         } else {
    //             let canEdit = await canEditEvent(eventId, userId);

    //             // Check that the user requesting the update has the permission to do so
    //             if (canEdit == true) {
    //                 // Push the userToAssign object to the peopleAssigned list
    //                 if (newUserEditPrivilege == "Viewer") {
    //                     await Event.updateOne({_id: eventId}, {$addToSet: {viewerIds: userToAssign}});
    
    //                 } else if (newUserEditPrivilege == "Editor") {
    //                     await Event.updateOne({_id: eventId}, {$addToSet: {editorIds: userToAssign}});
    //                 }
                    
    //                 // Add the event to the user document
    //                 await User.updateOne({_id: userToAssign}, {$addToSet: {eventIds: eventId}});
        
    //                 // Retrieve the newly edited file and respond with it
    //                 const updatedEvent = await Event.findOne({_id: eventId});
        
    //                 res.json({message: "Assigned new user", updatedEvent: updatedEvent});
    
    //             } else {
    //                 res.json({message: "User is not the owner or an editor", updatedEvent: null})
    //             }
    //         }    
            
    //     } catch(error) {
    //         res.status(500).json({error: error.message});
    //     }
    // }

    // static async RemoveAssignedUser(req, res) {
    //     try {
    //         const userId = req.body.userId;
    //         const eventId = req.params.eventId;
    //         const userToRemove = req.body.userToRemove;
    //         let isRemoverOwner = false;
    //         let isRemoverEditor = false;
    //         let isRemovedEditor = false;
    //         let isRemovedViewer = false;
    //         let canUserBeRemoved = false;

    //         const eventDoc = await Event.findOne({_id: eventId}, {ownerId: 1, editorIds:1, viewerIds: 1});

    //         // Check if the user requesting the removal is the event owner
    //         if (userId == eventDoc.ownerId) {
    //             isRemoverOwner = true;
    //         }

    //         // Check if the user to be removed is an event editor
    //         if (eventDoc.editorIds.length > 0) {
    //             for (let editorId of eventDoc.editorIds) {
    //                 if (userToRemove == editorId) {
    //                     isRemovedEditor = true;
    //                 }
    //                 if (userId == editorId) {
    //                     isRemoverEditor = true;
    //                 }
    //             }
    //         } 

    //         // Check if the user to be removed is an event viewer
    //         if (eventDoc.viewerIds.length > 0) {
    //             for (let viewerId of eventDoc.viewerIds) {
    //                 if (userToRemove == viewerId) {
    //                     isRemovedViewer = true;
    //                 }
    //             }
    //         }

    //         // Only the owner of an event can remove an editor
    //         if (isRemovedEditor == true && isRemoverOwner == true) {
    //             canUserBeRemoved = true;

    //         } else if (isRemovedViewer == true && (isRemoverOwner || isRemoverEditor)) {
    //             // A viewer can be removed by the event owner or an event editor
    //             canUserBeRemoved = true;
    //         }

    //         if (canUserBeRemoved == true) {
    //             // Remove the user id from the event editorIds field
    //             await Event.updateOne({_id: eventId}, {$pull: {editorIds: userToRemove, viewerIds: userToRemove}});

    //             // Remove the event id from the user's eventIds field
    //             await User.updateOne({_id: userToRemove}, {$pull: {eventIds: eventId}});

    //             res.json({message: "Removed assigned user", updatedEvent: true});

    //         } else {
    //             res.json({message: "User was not removed", updatedEvent: false})
    //         }
            
    //     } catch(error) {
    //         res.status(500).json({error: error.message});
    //     }
    // }

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