import { asyncHandler } from "../utils/asyncHandler.js";
//#debugging -- writing ..utils/asyncHandler.js or ./utils/asyncHandler.js gives error
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

    const existedUser = User.findOne({
        $or: [{username}, {email}]
        //checks if either of username or email already exists in our database
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

export {registerUser}