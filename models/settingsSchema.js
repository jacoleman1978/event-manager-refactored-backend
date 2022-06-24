import pkg from 'mongoose';
const { Schema, model } = pkg;

const SettingsSchema = new Schema({
    isDefault: {type: Boolean, required: true},
    views: {
        view: {type: String, required: true},
        subView: {type: String, required: true},
        startOfWeek: {type: String, required: true},
        expandedDaysByList: {type: String, required: true},
        defaultUser: {type: Schema.Types.ObjectId, ref: 'User', required: true}
    },
    task: {
        isIt: {type: Boolean, required: true},
        priority: {type: String, required: true}
    },
    allDay: {
        isIt: {type: Boolean, required: true},
        startDate: {type: Date, required: true},
        endDate: {type: Date, required: true},
        startTime: {type: Date, required: true},
        endTime: {type: Date, required: true}
    },
    recurring: {
        isIt: {type: Boolean, required: true},
        everyNum: {type: Number, required: true},
        everyUnit: {type: String, required: true},
        startDate: {type: Date, required: true},
        endDate: {type: Date, required: true}
    },
    peopleAssigned: [{type: Schema.Types.ObjectId, ref: 'User', required: true}],
    groupsAssigned: [{type: Schema.Types.ObjectId, ref: 'Group', required: true}]
}, {collection: 'settings'});

export default model('Settings', SettingsSchema);