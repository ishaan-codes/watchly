import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiErrors";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    //sometimes in production-grade code, if res is empty/blank, we write an underscore _ in place of it
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        //ternary after cookies as cookies might not have access to this token
        //authorization header gives token with bearer prefixed
        //thus we get access token by using replace() method and removing prefix from authorization header
        
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        //in case token is present, we need to verify its authenticity using jwt
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        //after successful verification of token, we get decoded token
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        //._id comes from user.model.js where we defined it while generating access token
    
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
    
});
//#vscode -- if forgot to add a code in try-catch block, just select the code and start writing try-catch block, the code will automatically inserted in try block