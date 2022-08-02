// Dependencies
import { Router } from "express";
import UserController from "./userControllers.js";

// Express Router
const userRouter = Router();

// Route to retrieve user info
userRouter.route('/login').post(UserController.Login);

// Route to create new user
userRouter.route('/signup').post(UserController.Signup);

// Route to verify unique username
userRouter.route('/signup/verify').post(UserController.VerifyUniqueUserName);

// Route for verifying session
userRouter.route('/session').get(UserController.CheckSession);

// Route for logging out
userRouter.route('/logout').get(UserController.Logout);

// Route to search for user
userRouter.route('/search').post(UserController.SearchUser);

// Route to change password
userRouter.route('/changepassword').put(UserController.ChangePassword);

export default userRouter;