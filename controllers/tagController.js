import Tag from '../models/tagSchema.js';

export default class TagController {
    static async NewTag(req, res) {
        try {
            const newTag = req.body;

            const tagDoc = await Tag.create(newTag);

            res.json({tagDoc: tagDoc})

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    static async GetEventsByTag(req, res) {
        try {
            const tagId = req.params.tagId;

            const { eventIds } = await Tag.findOne({_id: tagId}, {eventIds: 1}).populate('eventIds');

            res.json({events: eventIds});

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }
}