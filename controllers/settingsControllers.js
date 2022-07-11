import Settings from '../models/settingsSchema.js';

export default class SettingsController {
    // Get settings info via GET
    static async GetSettings(req, res) {
        try {
            const settingsId = req.params.settingsId;

            const settings = await Settings.findOne({_id: settingsId}).populate('defaultUser').populate('groupsAssigned');

            // Return settings to frontend
            res.json({
                settings: settings
            });

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }
    
    // Create new settings file
    static async CustomizeSettings(req, res) {
        try {
            const settingsId = req.params.settingsId;
            const customizedSettings = req.body.settings;

            // Update settings document by settingsId
            await Settings.updateOne({_id: settingsId}, {$set: customizedSettings});

            res.json({message: "Saved new settings", didSave: true});

        } catch(error) {
            res.status(500).json({error: error.message, didSave: false});
        }
    }
}