import pkg from 'mongoose';
const { Schema, model } = pkg;

const EventSchema = new Schema({
    title: {type: String, required: true},
    ownerId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    task: {
        isIt: {type: Boolean, required: true},
        priority: {type: String},
        taskCompleted: {type: Boolean},
        dateCompleted: {type: Date}
    },
    allDay: {
        isIt: {type: Boolean, requied: true},
        startDate: {type: Date, required: true},
        endDate: {type: Date, required: true},
        startTime: {type: Date},
        endTime: {type: Date}
    },
    recurring: {
        isIt: {type: Boolean, required: true},
        everyNum: {type: Number},
        everyUnit: {type: String},
        dateRange: {
            isIt: {type: Boolean},
            start: {type: Date},
            end: {type: Date},
            numTimesRecur: {type: Number}
        },
        eventIds: [{type: Schema.Types.ObjectId, ref: 'Event'}]
    },
    editorIds: [{type: Schema.Types.ObjectId, ref: 'User'}],
    viewerIds: [{type: Schema.Types.ObjectId, ref: 'User'}],
    groupIds: [{type: Schema.Types.ObjectId, ref: 'Group'}],
    tagIds: [{type: Schema.Types.ObjectId, ref: 'Tag'}],
    notes: {type: String},
    dateCreated: {type: Date, required: true},
    lastUpdated: {type: Date, required: true}
}, {collection: 'events'});

export default model('Event', EventSchema);