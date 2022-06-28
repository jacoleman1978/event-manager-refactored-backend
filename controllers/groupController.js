import Group from '../models/groupSchema.js';
import User from '../models/userSchema.js';

export default class GroupController {
    // Get all groups from a user
    static async GetGroups(req, res) {
        try {

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Get one group by id
    static async GetGroup(req, res) {
        try {

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Create group
    static async NewGroup(req, res) {
        try {

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Edit group
    static async EditGroup(req, res) {
        try {

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Delete group
    static async DeleteGroup(req, res) {
        try {

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }
}