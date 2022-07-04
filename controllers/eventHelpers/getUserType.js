import Event from '../../models/eventSchema.js';

const getUserType = async (eventId, userId) => {
    const eventDoc = await Event.findOne({_id: eventId});

    for (let user of eventDoc.peopleAssigned) {
        if (user.userId == userId) {
            return user.userType;
        }
    }

    return null
}

export default getUserType;