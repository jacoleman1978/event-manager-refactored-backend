import pkg from 'mongoose';
const { Schema, model } = pkg;

const SettingsSchema = new Schema({

}, {collection: 'settings'});

export default model('Settings', SettingsSchema);