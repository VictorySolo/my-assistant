//  import modules
const express = require("express")
const session = require("express-session")
const cookieParser = require("cookie-parser")
require("dotenv").config({ path: "./server/config/.env" })
const cors = require("cors")
const helmet = require("helmet")

// -- importing authentication functions
const {
    login,
    isLoggedIn,
    isLoggedInMiddleware,
    logout,
  } = require("./server/services/authentication");

// -- importing functions from customersController
const { createUser } = require("./server/controllers/usersController.js");
const { connectDB } = require("./server/config/db.js")
// - import routes
const usersRouter = require("./server/routes/userRouter.js");

// middleware
const app = express()

app.use(cookieParser())
app.use(express.json())
app.use(express.static("./client"))
app.use(
    cors({
        origin: "*",
        credentials: true,
    })
)
app.use(helmet())
app.use(
    session({
        secret: process.env.SESSION_SECRET || "defaultSecret", // Change this to a secure secret
        resave: false,
        saveUninitialized: false, // Ensure session is not saved until modified
        cookie: {
            httpOnly: true,
            secure: false, // Set process.env.NODE_ENV === "production"
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
        },
    })
)

// -- login
app.post("/login", login);
// -- creating a new user
app.post("/user", createUser);
// -- log off
app.get("/logout", logout)
// -- check if logged in
app.get("/isLoggedIn", isLoggedIn);
app.use("/users", isLoggedInMiddleware, usersRouter);

const { errorLogger } = require("./server/services/errorHandler")
app.use(errorLogger)

const startServer = async () => {
    try {
        const dbConnected = await connectDB() // Check DB connection
        if (dbConnected) {
            //  setting up PORT
            const PORT = process.env.PORT || 3001

            //  starting server listener on PORT
            app.listen(PORT, () => {
                console.log(`Server is running on http://localhost:${PORT}`)

            })
        } else {
            console.log("Can't start the app because the DB is unavailable")
        }
    } catch (err) {
        console.error("Error starting server:", err.message);
    }
}




startServer()
