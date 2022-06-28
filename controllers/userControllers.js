import User from '../models/userSchema.js';
import Settings from '../models/settingsSchema.js';
import { compare, genSalt, hash } from 'bcrypt';

export default class UserController {
    // Get user info via POST
    static async Login(req, res) {
        const body = req.body;
        req.session = null;

        try {
            // Search for userName in database
            const user = await User.findOne({userName: body.userName}).populate('groups');

            // Check whether there is a user found or not
            if (user) {
                // Check user password with hashed password in database
                const isValidPassword = await compare(body.password, user.hashedPassword);

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
            
            // Create newUser object
            let newUser = {
                firstName: body.firstName,
                lastName: body.lastName,
                userName: body.userName,
                hashedPassword: hashedPassword,
                tags: [],
                groupInvites: {
                    didReceive: false,
                },
                dateCreated: Date(),
                lastUpdated: Date()
            };

            // Create new user document via mongoose
            let userDoc = await User.create(newUser);

            // Create newSettings default object
            let newSettings = {
                views: {
                    view: "Events",
                    subView: "By List",
                    startOfWeek: "Sunday",
                    expandedDaysByList: "Today",
                    defaultUser: userDoc._id
                },
                task: {
                    isIt: false,
                    priority: "Medium"
                },
                allDay: {
                    isIt: true,
                    startDate: "Today",
                    endDate: "Today",
                    startTime: "Now",
                    endTime: "+1 Hour"
                },
                recurring: {
                    isIt: false,
                    everyNum: 1,
                    everyUnit: "Day(s)",
                    startDate: "Today",
                    endDate: "+1 Week"
                },
                peopleAssigned: [userDoc._id]
            }

            // Create new setting document via mongoose
            const settingsDoc = await Settings.create(newSettings);

            // Link the settingId to the user document
            userDoc["settingsId"] = settingsDoc._id;

            // Save the new user document and set the session
            userDoc.save().then(doc => {
                req.session = null;
                req.session = doc;
                req.session.userId = doc._id;
                res.status(201).json({message: "Successfully created user", userId: doc._id, didSignup: true, settings: settingsDoc});
            });
            
        } catch(error) {
            res.status(500).json({error: error.message, didSignup: false});
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