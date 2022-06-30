import Group from '../models/groupSchema.js';
import User from '../models/userSchema.js';

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
            const groupOwner = await User.findOne({_id: body.ownerId});
            groupOwner["groups"].push(groupDoc._id);
            groupOwner["lastUpdated"] = new Date();
            await groupOwner.save()

            // Add group to invitees user account
            for (let userId of body.invitedUserIds) {
                let invitedUser = await User.findOne({_id: userId});

                let newGroupInvite = {
                    fromUserId: body.ownerId,
                    groupId: groupDoc._id
                };

                invitedUser["groupInvites"].didReceive = true;
                invitedUser["groupInvites"].inviteList.push(newGroupInvite);
                invitedUser["lastUpdated"] = new Date();

                await invitedUser.save();
            };

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

            // If the invitedUserId isn't already on the invited list, add them
            if (groupDoc["openInvitations"].includes(body.invitedUserId) == false) {
                groupDoc["openInvitations"].push(body.invitedUserId);

                await groupDoc.save();
    
                const inviteFrom = {
                    fromUserId: body.ownerId,
                    groupId: body.groupId
                };
    
                const invitedUser = await User.findOne({_id: body.invitedUserId});
                invitedUser["groupInvites"].didReceive = true;
                invitedUser["groupInvites"].inviteList.push(inviteFrom);
    
                await invitedUser.save();

                res.json({message: "Invite successful"});
            } else {
                res.json({message: "Duplicate invite"});
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

            // Filter out passed in member from openInvitations
            let openInvitations = groupDoc["openInvitations"].filter(id => {
                return id != body.deletedUserId
            });
            groupDoc["openInvitations"] = [...openInvitations];

            // Filter out passed in member from memberData
            let memberData = groupDoc["memberData"].filter(member => {
                return member.id != body.deletedUserId
            });
            groupDoc["memberData"] = [...memberData];

            await groupDoc.save();

            res.json({message: "Group member removed"});

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // TODO Accept group invitation
    static async AcceptInvitation(req, res) {
        try {
            const body = req.body;

            const groupDoc = await Group.findOne({_id: body.groupId});

            // Check if the group has invited the user before proceeding
            if (groupDoc["openInvitations"].includes(body.userId) == true) {
                // Make the member object and add member to the group with "View" access
                const member = {
                    id: body.userId,
                    memberType: "View"
                };

                groupDoc["memberData"].push(member);
                
                // Remove the userId from openInvitations
                const openInvitations = groupDoc["openInvitations"].filter(userId => {
                    return userId != body.userId
                });
                groupDoc["openInvitations"] = [...openInvitations];

                await groupDoc.save();

                const userDoc = await User.findOne({_id: body.userId});

                // Add the group in the user file
                userDoc["groups"].push(body.groupId);

                // Remove the groupId from the groupInvites
                const inviteList = userDoc["groupInvites"].inviteList.filter(groupInvite => {
                    return groupInvite.groupId != body.groupId
                });
                userDoc["groupInvites"].inviteList = [...inviteList];

                // Update the didReceive flag, if no group invites remaining
                if (inviteList.length == 0) {
                    userDoc["groupInvites"].didReceive = false;
                };

                await userDoc.save();
            }

            res.json({message: "Accepted group invite"});

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // TODO Change member type
    static async ChangeMemberType(req, res) {
        try {
            const body = req.body;

            if (body.memberType === "View" || body.memberType === "Edit") {
                // Get the group document
                const groupDoc = await Group.findOne({_id: body.groupId});

                let memberData = groupDoc["memberData"];

                for (let i = 0; i < memberData.length; i++) {
                    if (memberData[i].id == body.memberId) {
                        memberData[i].memberType = boby.memberType;
                        break;
                    }
                }

                groupDoc["memberData"] = [...memberData];

                //await groupDoc.save();

                res.json({message: "Changed member type"});
            }

            res.json({message: "Member type could not be changed"});

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // TODO Change group name
    static async ChangeGroupName(req, res) {
        try {

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // TODO Delete group
    static async DeleteGroup(req, res) {
        try {

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }
}