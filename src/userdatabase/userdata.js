require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const users_schema1 = new mongoose.Schema({
    username:{
        type: String,
        reuired: true,
        lowercase: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    confirm_password:{
        type: String,
        required: true
    },
    tokens:[{
        token:{
            type: String,
            required: true
        }
    }]
});


users_schema1.methods.generateAuthToken = async function(){
    try{
        const token = jwt.sign({_id:this._id.toString()}, process.env.TOKEN_SECRET );
        this.tokens = this.tokens.concat({token:token})
        // console.log(token);
        // const save_token = await this.save();
        return token; 
    } catch (err) {
        // res.send(err);
        console.log(err);
    }
};




users_schema1.pre('save', async function(next) {
    this.password = await bcrypt.hash(this.password, 12);
    this.confirm_password = await bcrypt.hash(this.confirm_password, 12);
    next()
});

const users_collection1 = new mongoose.model('users_collection1', users_schema1);
module.exports = users_collection1;