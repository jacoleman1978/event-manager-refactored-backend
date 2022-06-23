import pkg from 'mongoose';
const { Schema, model } = pkg;

const GroupSchema = new Schema({
    name: {type: String, required: true},
    ownerId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    memberData: [{
        id: {type: Schema.Types.ObjectId, ref: 'User', required: true},
        canEdit: {type: Boolean, required: true}
    }],
    openInvitations: [{type: Schema.Types.ObjectId, ref: 'User'}]
}, {collection: 'groups'});

export default model('Group', GroupSchema);