require('dotenv').config();
const jwt = require('jsonwebtoken');

const createJWT =({payload})=>{
    const token = jwt.sign(payload,process.env.JWT_SECRET);
    return token;
}
//user==tokenUser
const attachCookiesToResponse = ({res,user,refreshToken})=>{
    const accessTokenJWT = createJWT({payload: {user}});
    const refreshTokenJWT = createJWT({payload: {user, refreshToken}});
    // console.log(user);
    const oneDay = 1000*60*60*24;
    const thirtyDays = 1000*60*60*24*30;

    res.cookie('accesstoken',accessTokenJWT,{
        httpOnly:true,
        expiresIn: new Date(Date.now()+oneDay),
        secure : process.env.NODE_ENV==='production',
        signed: true,    // to check that the user can not manually modify the cookie in the browser, so we send it signed with some value in cookieParser
    });

    res.cookie('refreshToken', refreshTokenJWT, {
        httpOnly: true,
        expiresIn: new Date(Date.now+thirtyDays),
        secure: process.env.NODE_ENV === 'production',
        signed: true,
    });
}

const isTokenValid = ({token})=> jwt.verify(token,process.env.JWT_SECRET);

module.exports ={createJWT,isTokenValid,attachCookiesToResponse};