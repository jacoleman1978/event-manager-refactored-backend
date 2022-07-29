import Group from '../models/groupSchema.js';
import User from '../models/userSchema.js';
import Event from '../models/eventSchema.js';

export default class GroupController {
    // Create group
    static async NewGroup(req, res) {
        try {
            const ownerId = req.session._id;
            const groupName = req.body.groupName;

            const newGroup = {
                ownerId: ownerId,
                name: groupName
            }

            // Create new group document via mongoose
            const groupDoc = await Group.create(newGroup);

            // Add group to owner's user account
            await User.updateOne({_id: ownerId}, {$set: {groupIds: groupDoc._id}});

            // // Add group to invitees user account
            // for (let userId of newGroup.inviteeIds) {
            //     await User.updateOne({_id: userId}, {$addToSet: {groupInviteIds: groupDoc._id}})
            // }

            res.json({message: "Created new group", group: groupDoc})

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Invite new member to group
    static async InviteMember(req, res) {
        try {
            const groupId = req.body.groupId;
            const userId = req.session._id;
            const invitedUserId = req.body.invitedUserId;
            let alreadyInvited = false;
            let inviteFlag = false;

            // Get the group document ownerId
            const groupDoc = await Group.findOne({_id: groupId}, {ownerId: 1});

            const userDoc = await User.findOne({_id: invitedUserId}, {groupIds: 1, groupInviteIds: 1});

            const invitedUserGroups = [...userDoc.groupIds, ...userDoc.groupInviteIds];

            for (let userGroupId of invitedUserGroups) {
                if (groupId == userGroupId) {
                    alreadyInvited = true;
                }
            }

            // If invited user is already a member of the group, don't invite
            if (alreadyInvited == true) {
                res.json({message: "Already invited",invited: false});

            } else {
                // Check if the member doing the inviting is the group owner
                if (userId == groupDoc.ownerId) {
                    // Add the invitedUserID to the group doc
                    await Group.updateOne({_id: groupId}, {$addToSet: {inviteeIds: invitedUserId}});

                    // Add the groupId to the user doc
                    await User.updateOne({_id: invitedUserId}, {$addToSet: {groupInviteIds: groupId}});

                    inviteFlag = true
                }

                res.json({invited: inviteFlag});
            }

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Remove member from group
    static async RemoveMember(req, res) {
        try {
            const groupId = req.body.groupId;
            const userId = req.session._id;
            const removedUserId = req.body.removedUserId;
            let removeFlag = false;

            // Get the group document
            const groupDoc = await Group.findOne({_id: groupId});

            // Check if the member doing the removing is the group owner
            if (userId == groupDoc.ownerId && groupDoc.ownerId != removedUserId) {
                // Remove the removedUserId from the group doc
                await Group.updateOne({_id: groupId}, {$pull: {inviteeIds: removedUserId, editorIds: removedUserId, viewerIds: removedUserId}});

                // Remove the groupId from the user doc
                await User.updateOne({_id: removedUserId}, {$pull: {groupInviteIds: groupId, groupIds: groupId}});

                // If other groups listed in userDoc, combine each group's eventIds list into a Set and replace groupEventIds
                const userDoc = await User.findOne({_id: removedUserId}, {groupIds: 1});

                if (userDoc.groupIds.length > 0) {
                    let groupEventIds = []
                    for (let userGroupId of userDoc.groupIds) {
                        let { eventIds } = await Group.findOne({_id: userGroupId}, {eventIds: 1});

                        groupEventIds = [...groupEventIds, ...eventIds];
                    }

                    const groupEventIdSet = new Set(groupEventIds);

                    await User.updateOne({_id: removedUserId}, {$set: {groupEventIds: [...groupEventIdSet]}});
                }

                for (let groupEventId of groupDoc.eventIds) {
                    let eventDoc = await Event.findOne({_id: groupEventId}, {groupIds: 1})
                    
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
                }

                removeFlag = true
                }            

            res.json({removed: removeFlag})

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Accept group invitation
    static async AcceptInvitation(req, res) {
        try {
            const groupId = req.body.groupId;
            const userId = req.session._id;
            let acceptedFlag = false

            // Get the group document
            const groupDoc = await Group.findOne({_id: groupId}, {inviteeIds: 1, eventIds: 1});

            // Check if the member accepting the invite is on the inviteeIds list from the group doc
            for (let inviteeId of groupDoc.inviteeIds) {
                if (inviteeId == userId) {
                    // Accept the invitedUserID to the group doc
                    await Group.updateOne({_id: groupId}, {
                        $addToSet: {viewerIds: userId}, 
                        $pull: {inviteeIds: userId}
                    });

                    // Get groupEventIds from the user
                    const userDoc = await User.findOne({_id: inviteeId}, {groupEventIds: 1})

                    // Combine group eventIds and user groupEventIds as a set
                    const eventIds = new Set([...groupDoc.eventIds, ...userDoc.groupEventIds])

                    // Add the groupId to the user doc and add eventIds from the group to the user document
                    await User.updateOne({_id: userId}, {
                        $addToSet: {groupIds: groupId}, 
                        $pull: {groupInviteIds: groupId}, 
                        $set: {groupEventIds: [...eventIds]}}
                    );

                    acceptedFlag = true;
                    break;
                }
            }

            res.json({accepted: acceptedFlag});

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Change member type
    static async ChangeEditPrivilege(req, res) {
        try {
            const userId = req.session._id;
            const groupId = req.body.groupId;
            const userIdPrivChange = req.body.userIdPrivChange;
            const newEditPrivilege = req.body.newEditPrivilege;
            let changePrivFlag = false;

            // Get the group document
            const groupDoc = await Group.findOne({_id: groupId});

            // Verifying that owner is making the change and not changing their own privilege
            if (groupDoc.ownerId == userId && groupDoc.ownerId != userIdPrivChange) {
                // If changing to "Editor", look through viewerIds
                if (newEditPrivilege == "Editor") {
                    for (let viewerId of groupDoc.viewerIds) {
                        // If viewerId found, change to editor and remove from viewer list
                        if (viewerId == userIdPrivChange) {
                            await Group.updateOne({_id: groupId}, {$addToSet: {editorIds: viewerId}, $pull: {viewerIds: viewerId}});

                            changePrivFlag = true;
                            break;
                        }
                    }
                } else if (newEditPrivilege == "Viewer") {
                    // Look through editorIds
                    for (let editId of groupDoc.editorIds) {
                        // If editId found, change to viewer and remove from editor list
                        if (editId == userIdPrivChange) {
                            await Group.updateOne({_id: groupId}, {$addToSet: {viewerIds: editId}, $pull: {editorIds: editId}});

                            changePrivFlag = true;
                            break;
                        }
                    }
                }
                res.json({changedEditPrivilege: changePrivFlag});

            } else {
                res.json({message: "Group owner can not change"});

            }
        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Change group name
    static async ChangeGroupName(req, res) {
        try {
            const userId = req.session._id;
            const groupId = req.body.groupId;
            const groupName = req.body.groupName.trim();

            // Ensure that the new groupName exists
            if (groupName.length > 0) {
                const groupDoc = await Group.findOne({_id: groupId});

                // Check that the member is the owner of the group
                if (groupDoc.ownerId == userId) {
                    groupDoc.name = groupName;
                    await groupDoc.save();
    
                    res.json({message: "Changed name of group"});

                } else {
                    res.json({message: "Not the owner of the group"});
                }

            } else {
                res.json({message: "Invalid group name"});
            }

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    static async DeleteGroup(req, res) {
        try {
            const groupId = req.params.groupId;
            const userId = req.body.userId;

            const groupDoc = await Group.findOne({_id: groupId});

            // Check if the member doing the deleting is the owner of the group
            if (userId == groupDoc.ownerId) {
                // If any member are on the group's inviteeIds, remove the invite from the user document
                if (groupDoc.inviteeIds.length > 0) {
                    for (let inviteeId of groupDoc.inviteeIds) {
                        await User.updateOne({_id: inviteeId}, {$pull: {groupInviteIds: groupId}});
                    }
                }
                
                // Make Set of all viewer and editor users associated with the group
                const groupUserIds = new Set([...groupDoc.viewerIds, ...groupDoc.editorIds, groupDoc.ownerId]);

                for (let groupUserId of groupUserIds) {
                    // Remove the groupId from the user's document
                    let userDoc = await User.findOneAndUpdate({_id: groupUserId}, {$pull: {groupIds: groupId}}, {new: true});

                    // Check for remaining user groupIds and rebuild groupEventIds 
                    let groupEventIds = new Set();

                    if (userDoc.groupIds.length > 0) {
                        for (let userGroupId of userDoc.groupIds) {
                            let { eventIds } = await Group.findOne({_id: userGroupId}, {eventIds: 1});

                            groupEventIds = new Set([...groupEventIds, ...eventIds]);
                        } 
                    }

                    await User.updateOne({_id: groupUserId}, {$set: {groupEventIds: [...groupEventIds]}});
                }

                for (let groupEventId of groupDoc.eventIds) {
                    // Remove the groupId from the event's document
                    let eventDoc = await Event.findOneAndUpdate({_id: groupEventId}, {$pull: {groupIds: groupId}}, {new: true});

                    // Check for remaining event groupIds and rebuild viewerIds and editorIds
                    let groupEditorUserIds = new Set();
                    let groupViewerUserIds = new Set();

                    for (let eventGroupId of eventDoc.groupIds) {
                        let eventGroupDoc = await Group.findOne({_id: eventGroupId});

                        groupEditorUserIds = new Set([...groupEditorUserIds, eventGroupDoc.ownerId, ...eventGroupDoc.editorIds]);

                        groupViewerUserIds = new Set([...groupViewerUserIds, ...eventGroupDoc.viewerIds]);
                    }

                    // Add userIds from groups to event with appropriate edit privilege
                    await Event.updateOne({_id: groupEventId}, {$set: {editorIds: [...groupEditorUserIds], viewerIds: [...groupViewerUserIds]}});
                }

                await Group.deleteOne({_id: groupId});

                res.json({message: "Group deleted"});

            } else {
                res.json({message: "Only the group owner can delete the group"})
            }

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Get group document by groupId
    static async GetGroupById(req, res) {
        try {
            const userId = req.session._id;
            const groupId = req.params.groupId;

            const groupDoc = await Group.findOne({_id: groupId}).populate('viewerIds').populate('editorIds').populate('inviteeIds');

            if (groupDoc.ownerId == userId) {
                res.json({groupDoc: groupDoc});

            } else {
                res.json({message: "You do not own this group", groupDoc: null})
            }

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Get all groups owned by a user
    static async GetOwnedGroups(req, res) {
        try {
            const userId = req.session._id;

            const ownedGroups = await Group.find({ownerId: userId}).populate('ownerId').populate('viewerIds').populate('editorIds').populate('inviteeIds');

            res.json({ownedGroups: ownedGroups});

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Get all groups that have membershp in
    static async GetGroupMemberships(req, res) {
        try {
            const userId = req.session._id;

            const groupMemberships = await Group.find({$or:[{editorIds: userId}, {viewerIds: userId}]}).populate('ownerId').populate('viewerIds').populate('editorIds').populate('inviteeIds');

            res.json({groupMemberships: groupMemberships});

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Get all groups that user has invitations
    static async GetGroupInvitations(req, res) {
        try {
            const userId = req.session._id;

            const groupInvitations = await Group.find({inviteeIds: userId}).populate('ownerId');

            res.json({groupInvitations: groupInvitations});

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }
}