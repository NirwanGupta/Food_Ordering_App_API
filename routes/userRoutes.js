const express = require(`express`);
const router = express.Router();

const {getAllUser, getSingleUser, updatePassword, updateUser, deleteUser} = require(`../controllers/userController`);
const {authenticateUser, authorizePermissions} = require(`../middleware/authentication`);

router.route(`/`).get([authenticateUser, authorizePermissions(`admin`)], getAllUser);
router.route(`/update-password`).patch(authenticateUser, updatePassword);
router.route(`/update-user`).patch(authenticateUser, updateUser);
router.route(`/:id`).get(authenticateUser, getSingleUser).delete(authenticateUser, deleteUser);

module.exports = router;