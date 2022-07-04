import Event from '../../models/eventSchema.js';

const isUserAssigned = async (eventId, userId) => {
    const eventDoc = await Event.findOne({_id: eventId});

    for (let user of eventDoc.peopleAssigned) {
        if (user.userId == userId) {
            return true;
        } 
    }

    return false
}

export default isUserAssigned;