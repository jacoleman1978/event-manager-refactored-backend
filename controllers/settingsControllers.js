import Settings from '../models/settingsSchema.js';
import User from '../models/userSchema.js';

export default class SettingsController {
    // Get settings info via GET
    static async getSettings(req, res) {
        try {
            const settingsId = req.params.settingsId;

            const settings = await Settings.findOne({_id: settingsId}).populate('defaultUser').populate('peopleAssigned').populate('groupsAssigned');

            // Return settings to frontend
            res.json({
                settings: settings
            });

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }
    
    // Create new settings file
    static async customizeSettings(req, res) {
        try {
            const oldSettingsId = req.session.settingsId;
            const newSettings = req.body.settings;

            // Create new mongoose document for default settings
            const settingsDoc = await Settings.create(newSettings);

            // Change settingsId for user
            const user = await User.findOne({_id: req.session.userId});
            user.settingsId = settingsDoc._id;
            await user.save();

            await Settings.deleteOne({_id: oldSettingsId});

            req.session.settingsId = user.settingsId;
            res.json({message: "Saved new settings", didSave: true});

        } catch(error) {
            res.status(500).json({error: error.message, didSave: false});
        }
    }
}