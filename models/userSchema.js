import pkg from 'mongoose';
const { Schema, model } = pkg;

const UserSchema = new Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    userName: {type: String, unique: true, required: true},
    hashedPassword: {type: String, unique: true, required: true},
    tagIds: [{type: Schema.Types.ObjectId, ref: 'Tag'}],
    groupIds: [{type: Schema.Types.ObjectId, ref: 'Group'}],
    settingsId: {type: Schema.Types.ObjectId, ref: 'Settings'},
    groupInviteIds: [{type: Schema.Types.ObjectId, ref: 'Group'}],
    eventIds: [{type: Schema.Types.ObjectId, ref: 'Event'}],
    groupEventIds: [{type: Schema.Types.ObjectId, ref: 'Event'}],
    archivedEventIds: [{type: Schema.Types.ObjectId, ref: 'Event'}],
    archivedGroupEventIds: [{type: Schema.Types.ObjectId, ref: 'Event'}],
    dateCreated: {type: Date, required: true},
    lastUpdated: {type: Date, required: true}
}, {collection: 'users'});

export default model('User', UserSchema);