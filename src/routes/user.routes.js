import {Router} from "express";
import { registerUser } from "../controllers/user.controller.js"; //automatically imported after writing line 6
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

export default router;