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

            const groupDoc = await Group.findOne({_id: body.groupId});

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

    // TODO Remove member from group
    static async RemoveMember(req, res) {
        try {

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // TODO Change member type
    static async ChangeMemberType(req, res) {
        try {

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // TODO Change group name
    static async ChangeName(req, res) {
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