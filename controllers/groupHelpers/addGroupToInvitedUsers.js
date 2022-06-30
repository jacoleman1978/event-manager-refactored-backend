import User from '../../models/userSchema.js';

// Add group to invitees user account
const addGroupToInvitedUsers = async (newInviteesList, ownerId, groupId) => {
    for (let userId of newInviteesList) {
        let invitedUser = await User.findOne({_id: userId});

        let newGroupInvite = {
            fromUserId: ownerId,
            groupId: groupId
        };

        invitedUser.groupInvites.didReceive = true;
        invitedUser.groupInvites.inviteList.push(newGroupInvite);
        invitedUser.lastUpdated = new Date();

        await invitedUser.save();
    };
}

export default addGroupToInvitedUsers;