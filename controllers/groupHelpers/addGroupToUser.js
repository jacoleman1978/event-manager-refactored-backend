import User from '../../models/userSchema.js';

// Add a group to owner's user account
const addGroupToUser = async (userId, groupId) => {
    const userDoc = await User.findOne({_id: userId});
    userDoc.groups.push(groupId);
    userDoc.lastUpdated = new Date();
    await userDoc.save();
}

export default addGroupToUser;