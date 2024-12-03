const express = require("express");
const router = express.Router();
const {
    gettingAll,
    createUser,
    getId,
    gettUserById,
    updateUser,
    deleteUser,
 } = require("../controllers/usersController");
const { decodeToken} = require("../services/authentication"); // Assuming you use JWT decoding middleware


/// POST - Create a new user
router.route('/').get(gettingAll).post(createUser);
router.route('/user').get(decodeToken, getId);
router.route("/user/:id").get(gettUserById).put(updateUser).delete(deleteUser);

module.exports = router;