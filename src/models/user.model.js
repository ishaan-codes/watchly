//we don't write userID as mongoDB automatically generates a unique user id once it saves the user
//it saves in BSON (binary json) format rather than a JSON format

import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"; 
//handles tokens
import bcrypt from "bcrypt"; 
//bcrypt library is core library while bcryptjs is optimized for javascript with zero dependency
//it is used to hash passwords

//both jwt and bcrypt are based on cryptography 
//direct encryption is not possible thus we need to use certain mongoose hooks/middlewares such as pre-hook
//pre -- allows to execute a piece of code (here, encrypt using password) just before the user is about to save data 

const userSchema = new Schema(
    {
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ], //it is an array type as we will continuously add watch histrories of user
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, //used to remove useless whitespaces in a string
            index: true //used to make data field appear in searching of a database
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullName: {
            type: String,
            required: true,
            index: true
        },
        avatar: {
            type: String, //cloudinary url
            required: true
        },
        coverImage: {
            type: String
        },
        password: {
            type: String, //there is a standard practice of storing passwords after encrypting them as our database might get leaked
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        },
    }, {timestamps: true}
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
    //in this code, whenever data is saved this will change password everytime 
    //thus we need to write such a code that runs this particular code only when we send modification in password field,i.e., if there is no modification of password we need not run this piece of code
})
//we shouldn't write callback function here as () => {} as it gives an error because we don't have context/reference of <this> in arror functions
//thus we use fucntions specifically async functions as this process takes time
//we have mentioned salt rounds in hash function, they are basically a cost factor which controls how much time is needed to calculate a single bcrypt hash
//higher cost factor depicts more hashing rounds, increasing cost factor by 1 doubles the necessary time
//nhigher necessary time depicts more difficult brute-forcing

userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password)
}
//this compares string password entered by user by encrypted password
//we use fucntionality of becrypt only to compare these two (password -- string entered by user & this.password -- encrypted password)
//cryptography is used here thus it takes time thus await is used

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }

    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }

    )
}
//jwt is basically a bearer token (or a key), i.e., anyone who provides with the token will be given access to data
//we are using both sessions and cookies (high-level security) 
//access token which we have made is not stored in database, only our refresh token is stored
//token expiry which we have given is in form of Nd where d represents days

export const User = mongoose.model("User", userSchema);
