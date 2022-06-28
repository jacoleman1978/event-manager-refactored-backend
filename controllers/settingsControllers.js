import Settings from '../models/settingsSchema.js';


export default class SettingsController {
    // Get settings info via GET
    static async getSettings(req, res) {
        try {
            const settingsId = req.session.settingsId;

            const settings = await Settings.findOne({_id: settingsId});

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
            const newSettings = req.body.settings;

            // Create new mongoose document for default settings
            const settingsDoc = await Settings.create(newSettings);

            res.json({message: "Saved new settings", didSave: true});
            
        } catch(error) {
            res.status(500).json({error: error.message, didSave: false});
        }
    }
}