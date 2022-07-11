import pkg from 'mongoose';
const { Schema, model } = pkg;

const TagSchema = new Schema({
    name: {type: String},
    userId: {type: Schema.Types.ObjectId, ref: 'User'},
    eventIds: [{type: Schema.Types.ObjectId, ref: 'Event'}],
    archivedEventIds: [{type: Schema.Types.ObjectId, ref: 'Event'}]
}, {collection: 'tags'});

export default model('Tag', TagSchema);