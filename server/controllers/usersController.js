// -- import models
const User = require("../models/user");
// -- importing mongoose
const mongoose = require("mongoose");
// -- extended Error class import
const HttpError = require("../services/HttpError");
// -- adding bcrypt for password hashing
const bcrypt = require("bcrypt");
// -- dotenv for environment variables import
require("dotenv").config();
// -- bcrypt salt rounds for password hashing
const saltRounds = parseInt(process.env.SALT_ROUNDS);
// -- regex for password rules
const validationPassword =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// GET -- geting all Users function (only for admin)
const gettingAll = async (req, res, next) => {
    try {
        // -- getting UserId from session
        const loggedInUserId = req.session.UserId;
        // -- searching logged in User in the DB
        const loggedInUser = await User.findById(loggedInUserId);
        // -- logged in User is not in the DB or is not admin
        if (!loggedInUser || !loggedInUser.isAdmin) {
            return next(
                new HttpError("Forbidden: Only admins can access this resource", 403)
            );
        }

        // -- fetching all Users
        const Users = await User.find();
        if (!Users || Users.length === 0) {
            return next(new HttpError("No Users found", 404));
        }
        // -- returning a list of all Users
        res.status(200).json(Users);
    } catch (err) {
        console.log("Error getting all Users (gettingAll)");
        // -- handling the error
        next(err);
    }
};

// POST -- creating new User function
const createUser = async (req, res, next) => {
    try {
        // -- getting parameters from the request
        const {
            name,
            email,
            password,
            phone,
            address,
            services,
            schedule,
            isAdmin,
        } = req.body;
        // -- checkong if all the required in UserSchema data exists
        if (!name || !email || !password || !phone|| !address || !services || !schedule || !isAdmin) {
            return next(
                new HttpError("Not enough data for creating a User", 400)
            );
        }
        // -- password validation using regex
        if (!validationPassword.test(password)) {
            return next(
                new HttpError("Validation error: password is not strong enough", 404)
            );
        }
        // -- hashing the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // -- setting isAdmin based on logged-in user's status
        let adminFlag = false;
        if (req.session.UserId) {
            // -- getting UserId from session
            const loggedInUserId = req.session.UserId;
            // -- searching logged in User in the DB
            const loggedInUser = await User.findById(loggedInUserId);
            // -- if current user is admin and isAdmin exists
            if (
                loggedInUser &&
                loggedInUser.isAdmin &&
                isAdmin !== undefined
            ) {
                adminFlag = isAdmin;
            }
        }
        // -- creating new User in the database
        const User = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            address,
            services: services || [],
            schedule: schedule || [],
            isAdmin: adminFlag,
        });
        if (!User) {
            return next(
                new HttpError("A problem occured while creating a User", 500)
            );
        }
        // -- returning created User data
        res
            .status(200)
            .json({ message: "User created successfully", User }); // probably need to return only a OK messageS
    } catch (err) {
        console.log("Error creating a User (creating)");
        // -- checking for duplicate key error
        if (err.code && err.code === 11000) {
            // -- handling duplicate email error
            return res.status(409).json({ message: "Email is already busy" });
        }
        // -- handling the error
        next(err);
    }
};

// -- get User by id from token function
const getId = async (req, res, next) => {
    try {
        // -- getting UserId from decoded token
        const UserId = req.UserId;
        // -- searching for the User in the DB
        const User = await User.findById(UserId);

        // -- if User is not found
        if (!User) {
            return next(new HttpError("User not found", 404));
        }

        // -- returning the found User
        res.status(200).json(User);
    } catch (err) {
        console.log("Error getting User by ID (getId)");
        // -- handling the error
        next(err);
    }
};

// -- getting User by id function
const gettUserById = async (req, res, next) => {
    try {
        // -- reading id from request
        const id = req.params.id;
        // -- Validate the ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(new HttpError("Invalid User ID format", 400));
        }

        // -- getting UserId from session
        const loggedInUserId = req.session.UserId;
        // -- searching logged in User in the DB
        const loggedInUser = await User.findById(loggedInUserId);
        // -- logged in User is not in the DB
        if (!loggedInUser) {
            return next(new HttpError("Logged-in User not found", 401));
        }

        // -- checking if current User has rights to request User's data
        if (!loggedInUser.isAdmin && loggedInUserId.toString() !== id) {
            return next(
                new HttpError(
                    "Forbidden: You can only access your own information",
                    403
                )
            );
        }
        // -- finding User by id in the database
        const User = await User.findById(id);
        if (!User) {
            return next(new HttpError("Couldn't find the User", 404));
        }
        // -- returning User data
        res.status(200).json(User);
    } catch (err) {
        console.log("Error getting a User by ID (gettingById)");
        // -- handling the error
        next(err);
    }
};

// -- updating User by id function
const updateUser = async (req, res, next) => {
    try {
        // -- global variable for the new password hash
        let hashedPassword;
        // -- reading id from request
        const id = req.params.id;
        // -- Validate the ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(new HttpError("Invalid User ID format", 400));
        }
        // -- getting parameters from the request
        const {
            firstName,
            lastName,
            email,
            password,
            age,
            phone,
            deliveryAddress,
            isAdmin,
        } = req.body;
        // -- if password must be updated
        if (password) {
            // -- password validation using regex
            if (!validationPassword.test(password)) {
                return next(
                    new HttpError("Validation error: password is not strong enough", 404)
                );
            }
            // -- hashing the password using bcrypt
            hashedPassword
 = await bcrypt.hash(password, saltRounds);
        }

        // -- getting UserId from session
        const loggedInUserId = req.session.UserId;
        // -- searching logged in User in the DB
        const loggedInUser = await User.findById(loggedInUserId);
        // -- logged in User is not in the DB
        if (!loggedInUser) {
            return next(new HttpError("Logged-in User not found", 401));
        }

        // -- checking if current User has rights to update requested User data
        if (!loggedInUser.isAdmin && loggedInUserId.toString() !== id) {
            return next(
                new HttpError(
                    "Forbidden: You can only update your own information",
                    403
                )
            );
        }
        // -- updating User's data in the database
        const updatedUser = await User.findByIdAndUpdate(
            id,
            {
                firstName,
                lastName,
                email,
                password,
                age,
                phone,
                deliveryAddress,
                // Update isAdmin only if the user is an admin and isAdmin is provided in the request body
                ...(loggedInUser.isAdmin && {
                    isAdmin: isAdmin !== undefined ? isAdmin : loggedInUser.isAdmin,
                }),
            },
            { new: true }
        );
        // -- checking if User was found and updated successfully
        if (!updatedUser) {
            return next(
                new HttpError("User was not found or update failed", 404)
            );
        }
        // -- succesfully updated message
        res.status(200).json("Updated successfully");
    } catch (err) {
        console.log("Error updating User's data (updating)");
        // -- handling the error
        next(err);
    }
};

// -- deleting User by id function (only for admin)
const deleteUser = async (req, res, next) => {
    try {
        // -- reading id from request
        const id = req.params.id;
        // -- Validate the ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(new HttpError("Invalid User ID format", 400));
        }

        // -- getting UserId from session
        const loggedInUserId = req.session.UserId;
        // -- searching logged in User in the DB
        const loggedInUser = await User.findById(loggedInUserId);
        // -- logged in User is not in the DB or is not admin
        if (!loggedInUser || !loggedInUser.isAdmin) {
            return next(
                new HttpError("Forbidden: Only admins can delete Users", 403)
            );
        }

        // -- deleting User by id from the database
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return next(new HttpError("User not found or deleting failed", 404));
        }
        // -- succesfully deleted message
        res.status(200).json("Deleted successfully");
    } catch (err) {
        console.log("Error deleting a User (deleting)");
        // -- handling the error
        next(err);
    }
};



// -- exporting all functions
module.exports = {
    gettingAll,
    createUser,
    getId,
    gettUserById,
    updateUser,
    deleteUser,
};
