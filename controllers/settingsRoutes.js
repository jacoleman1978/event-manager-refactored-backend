import { Router } from 'express';
import SettingsController from './settingsControllers.js';

// Express Router
const settingsRouter = Router();

// Route to retrieve or customize settings
settingsRouter.route('/')
    .get(SettingsController.GetSettings)
    .put(SettingsController.CustomizeSettings);

export default settingsRouter;