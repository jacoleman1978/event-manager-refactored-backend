import User from '../models/userSchema.js';
import { compare, genSalt, hash } from 'bcrypt';

export default class UserController {
    // Get user info via POST
    static async Login(req, res) {
        const body = req.body;
        req.session = null;

        try {
            // Search for userName in database
            const user = await User.findOne({userName: body.userName});

            // Check whether there is a user found or not
            if (user) {
                // Check user password with hashed password in database
                const isValidPassword = await compare(body.password, user.password);

                if (isValidPassword) {
                    req.session = user;
                    req.session.userId = user._id;
                    res.status(200).json({
                        message: "Valid password",
                        userId: user._id,
                        userName: user.userName,
                        session: req.session
                    });
                } else {
                    res.json({
                        message: "Invalid password", 
                        userId: "", 
                        userName: ""
                    });
                }
            } else {
                res.json({
                    message: "Invalid password", 
                    userId: "", 
                    userName: ""
                });
            }
        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }
}