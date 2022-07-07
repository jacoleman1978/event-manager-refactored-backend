import Event from '../models/eventSchema.js';
import Group from '../models/groupSchema.js';
import User from '../models/userSchema.js';


const canEditEvent = async (eventId, userId) => {
    let canEdit = false;
    let groupEditUserIdSet = new Set();

    const {ownerId, editorIds, groupIds} = await Event.findOne({_id: eventId}, {ownerId: 1, editorIds: 1, groupIds: 1});

    // Collect userIds from the event with edit privilege
    let canEditIds = [ownerId, ...editorIds];

    for (let canEditId of canEditIds) {
        if (userId == canEditId) {
            canEdit = true;
            break;
        }
    }

    
    if (canEdit == false) {
        const userDoc = await User.findOne({_id: userId}, {groupIds: 1});

        for (let eventGroupId of groupIds) {

            for (let userGroupId of userDoc.groupIds) {
                if (userGroupId.valueOf() == eventGroupId.valueOf()) {
                    let groupDoc = await Group.findOne({_id: userGroupId}, {ownerId: 1, editorIds: 1})

                    groupEditUserIdSet = new Set([...groupEditUserIdSet, groupDoc.ownerId, ...groupDoc.editorIds])
                }
            }
        }

        for (let groupEditUserId of groupEditUserIdSet) {
            if (userId == groupEditUserId) {
                canEdit = true;
                break;
            }
        }
    }

    return canEdit
}

export default canEditEvent