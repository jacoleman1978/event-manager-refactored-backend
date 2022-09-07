import pkg from 'mongoose';
const { Schema, model } = pkg;

const GroupSchema = new Schema({
    name: {type: String, required: true},
    ownerId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    editorIds: [{type: Schema.Types.ObjectId, ref: 'User'}],
    viewerIds: [{type: Schema.Types.ObjectId, ref: 'User'}],
    inviteeIds: [{type: Schema.Types.ObjectId, ref: 'User'}],
    eventIds: [{type: Schema.Types.ObjectId, ref: 'Event'}],
    archivedEventIds: [{type: Schema.Types.ObjectId, ref: 'Event'}]
}, {collection: 'groups'});

export default model('Group', GroupSchema);