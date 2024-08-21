import { asyncHandler } from "../utils/asyncHandler.js";
//#debugging -- writing ..utils/asyncHandler.js or ./utils/asyncHandler.js gives error
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

//we are going to use access and refresh tokens many times in code thus we'll build a separate entity to do this task fast
const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findyById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        //this saves refresh token in database
        //refresh tokens are saved in database so that we don't have to generate new access tokens everytime user logs in
        //user.save()
        //this saves the user in database and activates all the parameters of user model
        //but here for ex. we don't have password entity, thus we pass on an object
        await user.save({ validateBeforeSave: false })
        //this allows to save the user without any validation/cross-checking

        return {accessToken, refreshToken}
    }
    catch (error) {
        throw new ApiError (500, "Something went wrong while generating Access and Refresh Token")
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const {username, email, fullName, password} = req.body;
    /*
    if (fullName==""){
        throw new ApiError(400, "fullName is required")
    }
    */
    //we can check one-by-one about each entity, but this is time-taking
    //so we build an array and pass it to if function
    //req.body allows us to get only text type data and not buffer values (like avatar and coverImage in this case)
    if (
        [username, email, fullName, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
        //checks if either of username or email already exists in our database
        //debugging -- we missed an await here while talking to database
    });
    
    if (existedUser){
        throw new ApiError(409, "User with given username or email already exists");
    };

    //req.body only allowed us to get text files thus, we'll use req.files to get buffer entities
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //? -- ternary operator and can be comprehended as OR for understanding
    //this code allows us to get path of file which multer has uploaded
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    };

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar is required")
    };

    const user = await User.create({
        fullName,
        avatar: avatar.url, //we just need url of avatar and not its full object (json file)
        //coverImage: coverImage.url -> this could be fatal for our database if user has not given coverImage
        //thus we get url with help of ternary operator
        coverImage: coverImage?.url || "",
        //we didn't write code in this format in case of avatar as we have already setup it to be compulsory
        email,
        password,
        username: username.toLowerCase() //converts to lowercase
    });
    //to avoid null user, we would now check if user is not null/empty
    //mongoDB automatically adds an _id field with each entry (each user) if user is successfully created
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    //we have additionally chained a select method
    //select -- it takes a string of values as input, and we need to add only those entities which are not required as all the entities are by default selected from before
    //we need to add an additional minus sign alongwith space while passing these entities
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    };
    //we could have send createdUser in json file but we want to send user details in a structured and well-defined format
    //thus we use our ApiResponse code which we created earlier
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const {email, username, password} = req.body
    //our strategy is to add an object in this request, i.e., req.user 

    if (!(username || email)) {
        throw new ApiError(400, "Username or Password is required")
    };

    const user = await User.findOne({
        $or: [{username}, {email}]
        //allows us to pass an array as an object
        //operators in mongoDB are denoted by $ in the beginning
    });
    //it returns the first entry/element it finds in mongoDB

    if (!user) {
        throw new ApiError (400, "User does not exist")
    };

    const isPasswordValid = await user.isPasswordCorrect(password);
    //user -- this entity belongs to us and our user (instant mined/extracted from our database) thus, methods that we have built should be accessed using this
    //User -- this entity is that of mongoose thus, methods available through mongoose should be accessed using this

    if (!isPasswordValid) {
        throw new ApiError(400, "User Credentials are invalid.")
    };

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
    //refresh token generated from here is actually empty as it is taken from user in line 110
    //so we need to get actual value of user for which we have two ways -- either we update this entity only to primary 'user' or we call the value from our database
    //we need to decide which way to move forward on the basis of less expensive operation
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    //this whole step is optional and depends on personal requirements

    const options = {
        httpOnly: true,
        secure: true
    };
    //by default, anyone can modify our cookies in frontend
    //this code allows to modify cookies using server only
    
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
                //need of sending these tokens again is because this code handles the case when user wants to save these tokens from its end
            },
            "User logged in successfully"
        )
    )
});

const logOutUser = asyncHandler(async (req, res) => {
    //first step is to clear cookies of user
    //secondly, its refresh tokens need to be reset
    //we,ll need a user Id to access user but we don't have any way to get it
    //thus we need to build our own middleware
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined //resets refresh token to undefined
            }
        },
        {
            new: true //allows to return updated value of entity (here refresh token) rather than untouched version of it
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    //accessing refresh tokens from cookies
    const incomingRefresToken = req.cookies.refreshToken || req.body.refreshToken
    //req.body was used to cater request from user from phone, i.e., the cookies might be sent through body and not from cookies
    if (!incomingRefresToken) {
        throw new ApiError (401, "Unauthorized Request")
        //its not always necessary to send an error code/response, in some cases it is important to throw exact error to the user so that it can be fixed
        //fake/irrelevant responses might become fatal in some cases for ex. a fake response of 200 code is very dangerous as the user is confused when application doesn't run perfectly but gives indication of successful completion
    }

    try {
        //verifying token using jwt
        const decodedToken = jwt.verify(
            incomingRefresToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(findById?._id)
    
        if (!user) {
            throw new ApiError (401, "Invalid Refresh Token")
        }
    
        //we'll match if incomingRefreshToken that the user is sending and the encoded refreshToken that we got by finding User are same
        if (incomingRefresToken !== user?.refreshToken) {
            throw new ApiError (401, "Refresh Token is expired")
        }
    
        //we'll now generate a new refresh token for the user
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookies("accessToken", accessToken, options)
        .cookies("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access Token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError (401, error?.message || "Invalid Refresh Token")
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")        
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully"))
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(200, "Current user fetched successfully")
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body
    //production-level advice -- whenever we need to update a file, we should keep different controllers for ex. if user wants to save its image we shall give an option there only and hit an endpoint afterwards instead of saving complete user once again

    if (!(fullName || email)) {
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
                //actually fullName: fullName and simply fullName are same, same with email        
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    //using multer middleware
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading Avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}        
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    //using multer middleware
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}        
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image updated successfully")
    )
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        {
            //aggregation match pipeline -- it requires instruction on how to match pi
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                //here we need to write the mongoose name of the model, i.e., lowercase plural for ex. here we shall write subscriptions instead of Subscription
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        //here we found subscribers
        //next we'll find channels subscribed
        {
            $lookup: {
                from: "subscriptions",
                //here we need to write the mongoose name of the model, i.e., lowercase plural for ex. here we shall write subscriptions instead of Subscription
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            } 
        },
        //now, we need to add above two fields
        {
            //this keeps already existing fields in the model, but adds new fields to it
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers" //we are using a '$' before subscribers as it is now a field
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    //condition field takes 3 parameters as input: if, then, else
                    $condition: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"] 
                            //checks if an entity is present in given array or object
                            //first argument is the enity which needs to be checked and second argument is the array or object in which entity needs to be checked
                        },
                        then: true,
                        else: false
                    }

                }
            }
        },
        {
            //gives the projection that it provides selected values and not all of them at once
            //we need to give a flag '1' to those values which we want to project
            //professionally, we shouldn't generally project all the valus as it unnecessarily increases network traffic and size of data
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
});

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}