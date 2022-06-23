import pkg from 'mongoose';
const { Schema, model } = pkg;

const UserSchema = new Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    userName: {type: String, unique: true, required: true},
    hashedPassword: {type: String, unique: true, required: true},
    tags: [{type: String}],
    groups: [{type: Schema.Types.ObjectId, ref: 'Group'}],
    settings: {
        isDefault: {type: Boolean, required: true},
        id: {type: Schema.Types.ObjectId, ref: 'Settings'}
    },
    groupInvites: {
        didReceive: {type: Boolean, required: true},
        inviteList: [{
            fromUserId: {type: Schema.Types.ObjectId, ref: 'User'},
            groupId: {type: Schema.Types.ObjectId, ref: 'Group'} 
        }]
    },
    dateCreated: {type: Date, required: true},
    lastUpdated: {type: Date, required: true}
}, {collection: 'users'});

export default model('User', UserSchema);