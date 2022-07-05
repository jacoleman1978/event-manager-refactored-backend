import Group from '../models/groupSchema.js';
import User from '../models/userSchema.js';
import addGroupToUser from './groupHelpers/addGroupToUser.js';
import addGroupToInvitedUsers from './groupHelpers/addGroupToInvitedUsers.js';
import groupMemberType from './groupHelpers/groupMemberType.js';
import updatedOpenInvitations from './groupHelpers/updatedOpenInvitations.js';
import updatedMembersList from './groupHelpers/updatedMembersList.js';
import updatedGroupInvites from './groupHelpers/updatedGroupInvites.js';

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
            const body = req.body;

            // Get the group document
            const groupDoc = await Group.findOne({_id: body.groupId});

            // Check if the member doing the deleting is the owner of the group
            if (groupMemberType(groupDoc.memberData, body.userId) === "Owner") {
                const usersToRemove = [body.deletedUserId]

                // Filter out passed in member from openInvitations
                groupDoc.openInvitations = [updatedOpenInvitations(groupDoc.openInvitations, usersToRemove)];

                // Filter out passed in member from memberData
                groupDoc.memberData = [updatedMembersList(groupDoc.memberData, usersToRemove)];

                await groupDoc.save();

                res.json({message: "Group member removed"});
            } else {
                res.json({message: "Not the group owner"})
            }

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
                    await Group.updateOne({_id: groupId}, {$addToSet: {editorIds: userId}, $pull: {inviteeIds: userId}});

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
    static async ChangeMemberType(req, res) {
        try {
            const body = req.body;

            if (body.memberType === "View" || body.memberType === "Edit") {
                // Get the group document
                const groupDoc = await Group.findOne({_id: body.groupId});

                // Find the correct object in the inviteList, change type and break loop
                let memberData = groupDoc.memberData;

                for (let i = 0; i < memberData.length; i++) {
                    if (memberData[i].id == body.memberId) {
                        memberData[i].memberType = body.memberType;
                        break;
                    }
                }

                // Update the groupDoc with the memberType change and save
                groupDoc.memberData = [...memberData];

                await groupDoc.save();

                res.json({message: "Changed member type"});

            } else {
                res.json({message: "Member type could not be changed"});
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
            if (groupMemberType(groupDoc.memberData, body.userId) === "Owner") {

                res.json({message: "Group deleted"});

            } else {
                res.json({message: "Not the owner of the group"});
            }

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