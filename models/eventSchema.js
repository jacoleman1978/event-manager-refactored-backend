import pkg from 'mongoose';
const { Schema, model } = pkg;

const EventSchema = new Schema({

}, {collection: 'events'});

export default model('Event', EventSchema);