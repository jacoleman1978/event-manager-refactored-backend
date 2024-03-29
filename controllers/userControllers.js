import User from '../models/userSchema.js';
import Settings from '../models/settingsSchema.js';
import { compare, genSalt, hash } from 'bcrypt';

export default class UserController {
    // Get user info after verifying credentials
    static async Login(req, res) {
        const body = req.body;

        try {
            // Search for userName in database
            const user = await User.findOne({userName: body.userName}).populate('eventIds').populate('groupEventIds').populate('settingsId').populate('groupIds').populate('groupInviteIds').populate('tagIds');

            // Check whether there is a user found or not
            if (user) {
                // Check user password with hashed password in database
                const isValidPassword = await compare(body.password, user.hashedPassword);

                if (isValidPassword) {
                    let data = {
                        userId: user._id.toString(),
                        userName: user.userName
                    }
                    req.session = data;
                    req.session.userId = user._id.toString();
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

    // Create new user document
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
                dateCreated: Date(),
                lastUpdated: Date()
            };

            // Create new user document via mongoose
            let userDoc = await User.create(newUser);

            // Create newSettings default object
            let newSettings = {
                ownerId: userDoc._id,
                views: {
                    events: "By Day",
                    tasks: "By Priority",
                    login: "Tasks",
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
                }
            }

            // Create new setting document via mongoose
            const settingsDoc = await Settings.create(newSettings);

            // Link the settingId to the user document
            userDoc["settingsId"] = settingsDoc._id;

            // Save the new user document and set the session
            userDoc.save().then(doc => {
                req.session = null;
                let data = {
                    userId: doc._id.toString(),
                    userName: doc.userName
                }
                req.session = data;
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

    // Check if the current user session exists and return it
    static async CheckSession(req, res) {
        try {
            // Search for userId in database
            const user = await User.findOne({_id: req.session.userId});

            let data = {
                userName: user.userName,
                userId: user._id,
                fullName: `${user.firstName} ${user.lastName}`
            }
            res.json(data);

        } catch(error) {
            res.json(null);
        }
    }

    // Logout and remove session
    static async Logout(req, res) {
        req.session = null;
        res.json({message: "Logged out"});
    }

    // Search for user by first and last name with partial matches possible
    static async SearchUser(req, res) {
        const firstName = req.body.firstName || '';
        const lastName = req.body.lastName || '';
        let usersFromSearch = new Set();
        let results = [];

        try {
            if (firstName.length > 0 && lastName.length > 0) {
                let bestMatch = await User.find({$and:[{firstName: {$regex: firstName, $options: 'i'}}, {lastName: {$regex: lastName, $options: 'i'}}]});
    
                for (let i = 0; i < bestMatch.length; i++) {
                    usersFromSearch.add(bestMatch[i].userName)
                    results.push(bestMatch[i]);
                };
    
                let partialMatch = await User.find({$or:[{firstName: {$regex: firstName, $options: 'i'}}, {lastName: {$regex: lastName, $options: 'i'}}]});
    
                for (let j = 0; j < partialMatch.length; j++) {
                    if (usersFromSearch.has(partialMatch[j].userName) === false) {
                        usersFromSearch.add(partialMatch[j].userName)
                        results.push(partialMatch[j]);
                    }
                };
    
            } else if (firstName.length > 0) {
                let matches = await User.find({firstName: {$regex: firstName, $options: 'i'}});
    
                for (let i = 0; i < matches.length; i++) {
                    results.push(matches[i]);
                };
    
            } else if (lastName.length > 0) {
                let matches = await User.find({lastName: {$regex: lastName, $options: 'i'}});
    
                for (let i = 0; i < matches.length; i++) {
                    results.push(matches[i]);
                };
            } 

            res.json({searchResults: results});

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }

    // Authenticate current user and change their password
    static async ChangePassword(req, res) {
        const userId = req.session.userId;
        const currentPwd = req.body.currentPwd;
        const newPassword = req.body.newPassword;

        try {
            // Get user doc
            const user = await User.findOne({_id: userId});

            // Check user password with hashed password in database
            const isValidPassword = await compare(currentPwd, user.hashedPassword);

            if (isValidPassword === true) {
                // Generate salt to hash password
                const salt = await genSalt(10);

                // Hash the user's password
                const hashedPassword = await hash(newPassword, salt);

                await User.updateOne({_id: userId}, {$set: {hashedPassword: hashedPassword}});

                res.json({message: "The password has been changed", changedPwd: true})
            } else {
                res.json({message: "The current password is invalid", changedPwd: false})
            }

        } catch(error) {
            res.status(500).json({error: error.message});
        }
    }
}