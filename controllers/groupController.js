import Group from '../models/groupSchema.js';
import User from '../models/userSchema.js';

export default class GroupController {
    // Create group
    static async NewGroup(req, res) {
        try {
            const ownerId = req.body.group.ownerId;
            const newGroup = req.body.group;

            // Create new group document via mongoose
            const groupDoc = await Group.create(newGroup);

            // Add group to owner's user account
            await User.updateOne({_id: ownerId}, {$set: {groupIds: groupDoc._id}});

            // Add group to invitees user account
            for (let userId of newGroup.inviteeIds) {
                await User.updateOne({_id: userId}, {$addToSet: {groupInviteIds: groupDoc._id}})
            }

            res.json({message: "Created new group", group: groupDoc})

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Invite new member to group
    static async InviteMember(req, res) {
        try {
            const groupId = req.params.groupId;
            const userId = req.body.userId;
            const invitedUserId = req.body.invitedUserId;
            let inviteFlag = false;

            // Get the group document
            const groupDoc = await Group.findOne({_id: groupId});

            // Make edit privilege list
            const canEditIds = [...groupDoc.editorIds, groupDoc.ownerId]; 

            // Check if the member doing the inviting has edit access for the group
            for (let canEditId of canEditIds) {
                if (canEditId == userId) {
                    // Add the invitedUserID to the group doc
                    await Group.updateOne({_id: groupId}, {$addToSet: {inviteeIds: invitedUserId}});

                    // Add the groupId to the user doc
                    await User.updateOne({_id: invitedUserId}, {$addToSet: {groupInviteIds: groupId}});

                    inviteFlag = true
                }
            }

            res.json({invited: inviteFlag});

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Remove member from group
    static async RemoveMember(req, res) {
        try {
            const groupId = req.params.groupId;
            const userId = req.body.userId;
            const removedUserId = req.body.removedUserId;
            let removeFlag = false;

            // Get the group document
            const groupDoc = await Group.findOne({_id: groupId});

            // Make edit privilege list
            const canEditIds = [...groupDoc.editorIds, groupDoc.ownerId]; 

            // Check if the member doing the removing has edit access for the group
            for (let canEditId of canEditIds) {
                if (canEditId == userId && groupDoc.ownerId != removedUserId) {
                    // Remove the removedUserId from the group doc
                    await Group.updateOne({_id: groupId}, {$pull: {inviteeIds: removedUserId, editorIds: removedUserId, viewerIds: removedUserId}});

                    // Remove the groupId from the user doc
                    await User.updateOne({_id: removedUserId}, {$pull: {groupInviteIds: groupId, groupIds: groupId}});

                    removeFlag = true
                }
            }

            res.json({removed: removeFlag})

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Accept group invitation
    static async AcceptInvitation(req, res) {
        try {
            const groupId = req.params.groupId;
            const userId = req.body.userId;
            let acceptedFlag = false

            // Get the group document
            const groupDoc = await Group.findOne({_id: groupId});

            // Make inviteeIds list
            const inviteeIds = [...groupDoc.inviteeIds]; 

            // Check if the member accepting the invite is on the inviteeIds list from the group doc
            for (let inviteeId of inviteeIds) {
                if (inviteeId == userId) {
                    // Accept the invitedUserID to the group doc
                    await Group.updateOne({_id: groupId}, {$addToSet: {viewerIds: userId}, $pull: {inviteeIds: userId}});

                    // Add the groupId to the user doc
                    await User.updateOne({_id: userId}, {$addToSet: {groupIds: groupId}, $pull: {groupInviteIds: groupId}});

                    acceptedFlag = true
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
            const groupId = req.params.groupId;
            const userId = req.body.userId;
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
            const body = req.body;
            const groupName = body.groupName.trim();

            // Ensure that the new groupName exists
            if (groupName.length > 0) {
                const groupDoc = await Group.findOne({_id: body.groupId});

                // Check that the member is the owner of the group
                if (groupDoc.memberData[0].id == body.memberId) {
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

    // TODO Delete group
    static async DeleteGroup(req, res) {
        try {
            const body = req.body;

            const groupDoc = await Group.findOne({_id: body.groupId});

            // Check if the member doing the deleting is the owner of the group


        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // TODO Get all groups from a user
    static async GetGroups(req, res) {
        try {

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // TODO Get one group by id
    static async GetGroup(req, res) {
        try {

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

}