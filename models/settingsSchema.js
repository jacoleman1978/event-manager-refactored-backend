import pkg from 'mongoose';
const { Schema, model } = pkg;

const SettingsSchema = new Schema({
    ownerId: {type: Schema.Types.ObjectId, ref: 'User'},
    views: {
        events: {
            type: String, 
            required: true,
            enum: ["By Day", "By List", "By Overview"],
            default: "By Day"
        },
        tasks: {
            type: String, 
            required: true,
            enum: ["By Priority", "By Due Date"],
            default: "By Priority"
        },
        login: {
            type: String, 
            required: true,
            enum: ["Events", "Tasks", "Groups", "Settings"],
            default: "Events"
        },
        startOfWeek: {
            type: String, 
            required: true,
            enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            default: "Sunday"
        },
        expandedDaysByList: {
            type: String, 
            required: true,
            enum: ["Today", "Tomorrow", "Yesterday", "All", "None"],
            default: "Today"
        },
        defaultUser: {type: Schema.Types.ObjectId, ref: 'User'}
    },
    task: {
        isIt: {type: Boolean, required: true, default: false},
        priority: {
            type: String, 
            required: true,
            enum: ["Critical", "High", "Medium", "Low"],
            default: "Medium"
        }
    },
    allDay: {
        isIt: {type: Boolean, required: true, default: true},
        startDate: {type: String, required: true, default: "Today"},
        endDate: {type: String, required: true, default: "Today"},
        startTime: {type: String, required: true, default: "Now"},
        endTime: {type: String, required: true, default: "+1 Hour"}
    },
    recurring: {
        isIt: {type: Boolean, required: true, default: false},
        everyNum: {type: Number, required: true, default: 1},
        everyUnit: {
            type: String, 
            required: true,
            enum: ["Hour(s)", "Day(s)", "Week(s)", "Month(s)", "Year(s)"],
            default: "Day(s)"
        },
        startDate: {type: String, required: true, default: "Today"},
        endDate: {type: String, required: true, default: "+1 Week"}
    },
    groupsAssigned: [{type: Schema.Types.ObjectId, ref: 'Group'}]
}, {collection: 'settings'});

export default model('Settings', SettingsSchema);