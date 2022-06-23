import pkg from 'mongoose';
const { Schema, model } = pkg;

const GroupSchema = new Schema({

}, {collection: 'groups'});

export default model('Group', GroupSchema);