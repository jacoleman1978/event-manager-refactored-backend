import Group from '../models/groupSchema.js';
import User from '../models/userSchema.js';
import addGroupToUser from './groupHelpers/addGroupToUser.js';
import addGroupToInvitedUsers from './groupHelpers/addGroupToInvitedUsers.js';
import groupMemberType from './groupHelpers/groupMemberType.js';
import updatedOpenInvitations from './groupHelpers/updatedOpenInvitations.js';
import updatedMembersList from './groupHelpers/updatedMembersList.js';
import updatedGroupInvites from './groupHelpers/updatedGroupInvites.js';

export default class GroupController {
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

    // Create group
    static async NewGroup(req, res) {
        try {
            const body = req.body;

            // Create newGroup object
            const newGroup = {
                name: body.groupName,
                memberData: [...body.memberData],
                openInvitations: [...body.invitedUserIds]
            }

            // Create new group document via mongoose
            const groupDoc = await Group.create(newGroup);

            // Add group to owner's user account
            addGroupToUser(body.ownerId, groupDoc._id);

            // Add group to invitees user account
            addGroupToInvitedUsers(body.invitedUserIds, body.ownerId, groupDoc._id);

            res.json({message: "Created new group", group: groupDoc})

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Invite new member to group
    static async InviteMember(req, res) {
        try {
            const body = req.body;

            // Get the group document
            const groupDoc = await Group.findOne({_id: body.groupId});

            // Check if the member doing the inviting is the owner of the group
            if (groupMemberType(groupDoc.memberData, body.userId) === "Owner") {
                // If the invitedUserId isn't already on the invited list, add them
                if (groupDoc.openInvitations.includes(body.invitedUserId) == false) {
                    groupDoc.openInvitations.push(body.invitedUserId);

                    await groupDoc.save();
        
                    // Add group to invitees user account
                    addGroupToInvitedUsers([body.invitedUserId], body.userId, body.groupId);

                    res.json({message: "Invite successful"});
                } else {
                    res.json({message: "Duplicate invite"});
                }
            } else {
                res.json({message: "Not the group owner"})
            }

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
            const body = req.body;

            const groupDoc = await Group.findOne({_id: body.groupId});

            // Check if the group has invited the user before proceeding
            if (groupDoc.openInvitations.includes(body.userId) == true) {
                // Make the member object and add member to the group with "View" access
                const member = {
                    id: body.userId,
                    memberType: "View"
                };

                groupDoc.memberData.push(member);
                
                // Remove the userId from openInvitations
                groupDoc.openInvitations = [updatedOpenInvitations(groupDoc.openInvitations, [body.userId])];

                await groupDoc.save();

                const userDoc = await User.findOne({_id: body.userId});

                // Add the group in the user file
                userDoc.groups.push(body.groupId);

                // Remove the groupId from the groupInvites
                const inviteList = userDoc.groupInvites.inviteList
                inviteList = [updatedGroupInvites(userDoc.groupInvites, body.groupId)];

                // Update the didReceive flag, if no group invites remaining
                if (inviteList.length == 0) {
                    userDoc.groupInvites.didReceive = false;
                };

                await userDoc.save();
            }

            res.json({message: "Accepted group invite"});

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
}