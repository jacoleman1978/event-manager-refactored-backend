import pkg from 'mongoose';
const { Schema, model } = pkg;

const GroupSchema = new Schema({
    name: {type: String, required: true},
    memberData: [{
        id: {type: Schema.Types.ObjectId, ref: 'User', required: true},
        memberType: {
            type: String, 
            required: true,
            enum: ["Owner", "View", "Edit"]
        }
    }],
    openInvitations: [{type: Schema.Types.ObjectId, ref: 'User'}]
}, {collection: 'groups'});

export default model('Group', GroupSchema);