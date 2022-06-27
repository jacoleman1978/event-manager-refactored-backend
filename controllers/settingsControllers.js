import Settings from '../models/settingsSchema.js';

export default class SettingsController {
    // Get settings info via GET
    static async getSettings(req, res) {
        try {
            const settingsId = req.session.settings.id;
            let settings = {};
            
            // Check if using default or custom settings
            if (req.session.settings.isDefault == true) {
                settings = await Settings.findOne({isDefault: true})
                
            } else {
                settings = await Settings.findOne({_id: settingsId});
            }

            // Return settings to frontend
            res.json({
                settings: settings
            });
        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }
}