//  import modules
const jwt = require("jsonwebtoken")
//  adding bcrypt for password hashing
const bcrypt = require("bcrypt")
//  extended Error class import
const HttpError = require("../services/HttpError")
//  import models
const User = require("../models/user")
//  dotenv for environment variables import
require("dotenv").config()

//  setting secret key from .env
const secretKey = process.env.SECRET_KEY

//  login function
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    //  check for required parameters
    if (!email || !password) {
      return next(new HttpError("Email and password are required", 400))
    }

    //  find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return next(new HttpError("User not found", 404))
    }

    //  verify password
    const isPasswordCorrect = await bcrypt.compare(password, user.password)
    if (!isPasswordCorrect) {
      return next(new HttpError("Invalid password", 401))
    }
    //  store user ID in session
    req.session.userId = user._id

    //  create and send JWT token
    const token = jwt.sign({ _id: user._id }, secretKey)
    res.cookie("Ticket", token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production", // Only secure in production
    })
    res.status(200).json({ message: "Logged in successfully" })
  } catch (err) {
    console.log("Error during login", err)
    next(err)
  }
}
//  Middleware:
// check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.session.userId) {
    return res.status(200).json({ loggedIn: true })
  } else {
    res.status(200).json({ loggedIn: false })
  }
}

//  Decode JWT token
const decodeToken = async (req, res, next) => {
  try {
    //  getting the token from the user's cookies
    const token = req.cookies.Ticket

    if (!token) {
      return next(new HttpError("No token provided", 401))
    }

    const decoded = await jwt.verify(token, secretKey)
    req.userId = decoded._id
    next()
  } catch (err) {
    next(new HttpError("Unauthorized: Invalid or expired token", 401))
  }
}

//  isAdmin 
const isAdmin = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized: Please log in" })
  }
  try {
    const user = await User.findById(req.session.userId)
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" })
    }
    if (!user.isAdmin) {
      return res.status(403).json({
        message: "Forbidden: You do not have the required permissions",
      })
    }
    next()
  } catch (err) {
    console.error("Error checking admin status:", err)
    next(err)
  }
}

//  logout function
const logout = (req, res, next) => {
  //  destroying the session
  req.session.destroy((err) => {
    if (err) {
      return next(new HttpError("Error logging out", 500))
    }
    //  clear the cookie "Ticket"
    res.clearCookie("Ticket")
    //  sending response to the user with success logout message
    res.status(200).json({ message: "Logged out successfully" })
  })
}

// -- isLoggedInMiddleware
const isLoggedInMiddleware = (req, res, next) => {
  // -- checking if the userId is present in the session
  if (req.session.userId) {
    next(); // Allow the request to proceed
  } else {
    next(new HttpError("Unauthorized: Please log in", 401));
  }
};

//  exporting functions
module.exports = {
  login,
  isLoggedIn,
  isLoggedInMiddleware,
  decodeToken,
  isAdmin,
  logout,
}
