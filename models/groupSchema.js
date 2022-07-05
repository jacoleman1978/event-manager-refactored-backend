import pkg from 'mongoose';
const { Schema, model } = pkg;

const GroupSchema = new Schema({
    name: {type: String, required: true},
    ownerId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    editorIds: [{type: Schema.Types.ObjectId, ref: 'User', required: true}],
    viewerIds: [{type: Schema.Types.ObjectId, ref: 'User', required: true}],
    inviteeIds: [{type: Schema.Types.ObjectId, ref: 'User'}]
}, {collection: 'groups'});

export default model('Group', GroupSchema);