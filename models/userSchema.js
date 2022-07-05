import pkg from 'mongoose';
const { Schema, model } = pkg;

const UserSchema = new Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    userName: {type: String, unique: true, required: true},
    hashedPassword: {type: String, unique: true, required: true},
    tagIds: [{type: Schema.Types.ObjectId, ref: 'Tag'}],
    groups: [{type: Schema.Types.ObjectId, ref: 'Group'}],
    settingsId: {type: Schema.Types.ObjectId, ref: 'Settings'},
    groupInviteIds: [{groupId: {type: Schema.Types.ObjectId, ref: 'Group'}}],
    taskIds: {
        critical: [{type: Schema.Types.ObjectId, ref: 'Event'}],
        high: [{type: Schema.Types.ObjectId, ref: 'Event'}],
        medium: [{type: Schema.Types.ObjectId, ref: 'Event'}],
        low: [{type: Schema.Types.ObjectId, ref: 'Event'}]
    },
    eventIds: [{type: Schema.Types.ObjectId, ref: 'Event'}],
    dateCreated: {type: Date, required: true},
    lastUpdated: {type: Date, required: true}
}, {collection: 'users'});

export default model('User', UserSchema);