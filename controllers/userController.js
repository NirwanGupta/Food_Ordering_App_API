const customErrors = require(`../errors`);
const { StatusCodes } = require("http-status-codes");
const User = require(`../models/User`);
const Token = require(`../models/Token`);
const { checkPermissions } = require("../utils");

const getAllUser = async(req, res) => {
    const users = await User.find({role: 'user'}).select(`-password`);
    res.status(StatusCodes.OK).json({users, count: users.length});
};

const getSingleUser = async(req, res) => {
    const {id: userId} = req.params;
    const user = await User.findOne({_id: userId}).select(`-password`);
    if(!user) {
        throw new customErrors.NotFoundError(`User not found`);
    }
    checkPermissions(req.user, user._id);
    res.status(StatusCodes.OK).json({user});
};

const updateUser = async(req, res) => {
    const {name, email, address, phone} = req.body;
    if(!name && !email && !address && !phone) {
        throw new customErrors.BadRequestError(`Please provide the data you want to update`);
    }
    const user = await User.findOne({_id: req.user.userId});
    ['name', 'email', 'address', 'phone'].forEach(property => {
        if(req.body[property] !== undefined) {
            user[property] = req.body[property];
        }
    })
    //So, in your case, req.body[property] is the correct syntax because property is a variable holding the name of the property you want to access. Using req.body.property would look for a property named "property" in req.body, which is not what you intend.
    await user.save();
    res.status(StatusCodes.OK).json({user});
};

const deleteUser = async(req, res) => {
    const {id: userId} = req.params;

    checkPermissions(req.user, userId);
    
    await Token.findOneAndDelete({ user: req.user.userId });

    res.cookie(`accessToken`, 'AccessTokenLogout', {
        httpOnly: true,
        expiresIn: new Date(Date.now()),
    })

    res.cookie(`refreshToken`, 'RefreshTokenLogout', {
        httpOnly: true,
        expiresIn: new Date(Date.now()),
    })

    const user = await User.findOneAndDelete({_id: userId});
    res.status(StatusCodes.OK).json({msg: "User Successfully deleted"});
};

const updatePassword = async(req, res) => {
    const {oldPassword, newPassword} = req.body;
    if(!oldPassword || !newPassword) {
        throw new customErrors.BadRequestError("Please provide both passwords");
    }
    const user = await User.findOne({_id: req.user.userId});
    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if(!isPasswordCorrect) {
        throw new customErrors.BadRequestError("Wrong Pasword");
    }
    user.password = newPassword;
    await user.save();
    res.status(StatusCodes.OK).json({msg: "Password changed successfully"});
};

module.exports = {
    getAllUser,
    getSingleUser,
    updateUser,
    deleteUser,
    updatePassword,
};