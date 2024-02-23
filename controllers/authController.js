const User = require(`../models/User`);
const customErrors = require(`../errors/index`);
const {StatusCodes} = require(`http-status-codes`);
const {createTokenUser, attachCookiesToResponse} = require(`../utils`);
const crypto = require(`crypto`);
const {sendVerificationEmail, sendResetPasswordEmail, createHash} = require(`../utils`);
const Token = require("../models/Token");

const register = async(req, res) => {
    const {name, email, password, address, phone} = req.body;
    if(!name || !email || !password || !address || !phone) {
        throw new customErrors.BadRequestError("Please provide all the credentials");
    }
    const isFirstAccount = await User.countDocuments({}) === 0;
    const role = (isFirstAccount? 'admin': 'user');
    
    const verificationToken = crypto.randomBytes(40).toString("hex");
    
    const user = await User.create({ name, email, password, address, phone, role, verificationToken });
    const origin = `http://localhost:5000`;

    await sendVerificationEmail({email: user.email, name: user.name, verificationToken: user.verificationToken, origin});
    res.status(StatusCodes.CREATED).json({msg: "Success!! Please verify your email account"});
}

const verifyEmail = async(req, res) => {
    const {token: verificationToken, email} = req.query;
    // console.log("token: ", verificationToken);
    // console.log("Email:", email);
    const user = await User.findOne({email});
    if(!user) {
        throw new customErrors.UnauthenticatedError("Verification Failed");
    }
    if(user.verificationToken !== verificationToken) {
        throw new customErrors.UnauthenticatedError("Verification Failed -> user.verificationToken !== verificationToken");
    }
    user.isVerified = true;
    user.verified = Date.now();
    user.verificationToken = '';

    await user.save();
    res.status(StatusCodes.OK).json({msg: "Email Verified"});
}

const login = async (req, res) => {
    const {email, password} = req.body;
    if(!email && !password) {
        throw new customErrors.BadRequestError("Please provide all the credentials");
    }

    const user = await User.findOne({email});
    if(!user) {
        throw new customErrors.UnauthenticatedError(`No user registered with email ${email}`);
    }
    // $2a$10$KYwBLTOv14vC6.oM4RmNhuiS2U3J2V.dMHd94EmC4Z4L30D4.kLOO
    const isPasswordCorrect = await user.comparePassword(password);
    // console.log("password: ", password);
    if(!isPasswordCorrect) {
        throw new customErrors.UnauthenticatedError("Wrong password");
    }
    if(!user.isVerified) {
        throw new customErrors.UnauthenticatedError()
    }

    const tokenUser = createTokenUser(user);
    let refreshToken = '';

    const existingToken = await Token.findOne({user: user._id});
    if(existingToken) {
        console.log("existing token is present");
        const {isValid} = existingToken;
        if(!isValid) {
            throw new customErrors.UnauthenticatedError("Your account has been banned");
        }
        console.log("Correct till now");
        refreshToken = existingToken.refreshToken;
        attachCookiesToResponse({res, user: tokenUser, refreshToken});
        res.status(StatusCodes.OK).json({user: tokenUser});
        return;
    }

    refreshToken = crypto.randomBytes(40).toString('hex');
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const userToken = {refreshToken, ip, userAgent, user: user._id};

    await Token.create(userToken);
    attachCookiesToResponse({res, user: tokenUser, refreshToken});
    res.status(StatusCodes.OK).json({ user : tokenUser });
}

const logout = async (req, res) => {
    await Token.findOneAndDelete({ user: req.user.userId });

    res.cookie(`accessToken`, 'AccessTokenLogout', {
        httpOnly: true,
        expiresIn: new Date(Date.now() /*+ 5*1000*/),
    })

    res.cookie(`refreshToken`, 'RefreshTokenLogout', {
        httpOnly: true,
        expiresIn: new Date(Date.now() /*+ 5*1000*/),
    })

    res.status(StatusCodes.OK).json({msg: 'user logged out'});
}

const forgotPassword = async (req, res) => {
    const {email} = req.body;
    if(!email) {
        throw new customErrors.BadRequestError("Please provide email ID");
    }
    const user = await User.findOne({email});
    if(user) {
        const passwordToken = crypto.randomBytes(70).toString('hex');
        const origin = "http://localhost:5000";

        await sendResetPasswordEmail({name: user.name, email: user.email, token: passwordToken, origin});
        
        const tenMinutes = 1000*60*10;
        const passwordTokenExpirationDate = new Date(Date.now()+tenMinutes);

        user.passwordToken = createHash(passwordToken);
        user.passwordTokenExpirationDate = passwordTokenExpirationDate;

        await user.save();
    }
    res.status(StatusCodes.OK).json({msg: `Please check your email for reset password link`});
}

const resetPassword = async(req, res) => {
    const {email, token} = req.params;
    const {password} = req.body;
    if(!email || !token || !password) {
        throw new customError.BadRequestError(`Please provide all the values`);
    }
    const user = await User.findOne({email});

    if(user) {
        const currentDate = new Date();
        if(user.passwordToken === createHash(token) && user.passwordTokenExpirationDate > currentDate) {
            user.password = password;
            user.passwordToken = null;
            user.passwordTokenExpirationDate = null;
            await user.save();
        }
    }
    res.status(StatusCodes.OK).json({msg: 'Password changed successfully'});
}

module.exports = {
    register,
    login,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
};