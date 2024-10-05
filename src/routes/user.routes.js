import {Router} from "express";
import { 
    loginUser, 
    logOutUser, 
    registerUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile, 
    getWatchHistory 
} from "../controllers/user.controller.js"; //automatically imported after writing line 6
//#debugging -- writing ../controller/user.controller gave error
import {upload} from '../middlewares/multer.middleware.js';

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            coverImage: 1
        }
    ]),
    //allows us to send images
    registerUser
)
//instruction for routing user towards registration page
//this allows us to handle user from here only and we need not tweak app.js everytime
//if we send a request on postman/thunder client other than post request, we get an error


router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logOutUser)
//we can add middleware in any order but we need to ensure that there is a next() flag at the end of each middleware
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
//we have used patch here instead of post as all the details will get updated if latter was used
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
//we first need verifyJWT before multer as we need to ensure that user is logged in before uploading an avatar file
//upload is a multer middleware, also, we are adding single as we are working with one file only
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
//when we are working with parameters, we need to use /c/: or /channel/: instead of / while writing secured routes
router.route("/history").get(verifyJWT, getWatchHistory)

export default router;