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

    // Create new user via POST
    static async Signup(req, res) {
        const body = req.body;

        try {
            // Generate salt to hash password
            const salt = await genSalt(10);

            // Hash the user's password
            const hashedPassword = await hash(body.password, salt);
            
            // Create new mongoose document from user data
            const user = new User({
                firstName: body.firstName,
                lastName: body.lastName,
                userName: body.userName,
                hashedPassword: hashedPassword,
                tags: [],
                groups: [],
                settings: {
                    isDefault: true,
                    id: ""
                },
                groupInvites: {
                    didReceive: false,
                    inviteList: []
                },
                dateCreated: Date(),
                lastUpdated: Date()
            });

            // Save the new document
            user.save().then(doc => {
                req.session = null;
                req.session = user;
                req.session.userId = user._id;
                res.status(201).json({message: "Successfully created user", userId: doc._id});
            });
            
        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Verify unique userName entered during Signup
    static async VerifyUniqueUserName(req, res) {
        const body = req.body;
        let isUniqueUserName = false;

        try {
            // Determine if userName already exists in database
            let userNameExists = await User.findOne({userName: body.userName});

            if (userNameExists) {
                isUniqueUserName = false;
            } else {
                isUniqueUserName = true;
            }

            // Return results to frontend
            res.json({
                isUniqueUserName: isUniqueUserName
            });

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Check session
    static async CheckSession(req, res) {
        try {
            // Search for userId in database
            const user = await User.findOne({_id: req.session._id});
            res.json(user);

        } catch(error) {
            res.json(null);
        }
    }

    // Logout and remove session
    static async Logout(req, res) {
        req.session = null;
        res.json({message: "Logged out"});
    }
}