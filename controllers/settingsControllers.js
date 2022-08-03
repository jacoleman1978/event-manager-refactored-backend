import Settings from '../models/settingsSchema.js';

export default class SettingsController {
    // Get settings info via GET
    static async GetSettings(req, res) {
        try {
            const userId = req.session.userId;

            const settings = await Settings.findOne({ownerId: userId})

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
            const userId = req.session.userId;
            const customizedSettings = req.body;

            // Update settings document by settingsId
            await Settings.updateOne({ownerId: userId}, {$set: customizedSettings});

            const settings = await Settings.findOne({ownerId: userId})

            res.json({message: "Saved new settings", didSave: true, settings: settings});

        } catch(error) {
            res.status(500).json({error: error.message, didSave: false});
        }
    }
}