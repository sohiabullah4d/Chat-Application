const jwt = require('jsonwebtoken');
const users_collection1 = require('../userdatabase/userdata');

const auth = async (req,res,next) => {
    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.TOKEN_SECRET);
        console.log(verifyUser);
        // console.log(JSON.stringify(verifyUser._id.username));

        const user = await users_collection1.findOne({_id:verifyUser._id});
        // console.log(user.username);
        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).send(error);
    }
}

module.exports = auth;
