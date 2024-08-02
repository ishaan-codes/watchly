import {asyncHandler} from "../utils/asyncHandler.js";
//#debugging -- writing ..utils/asyncHandler.js or ./utils/asyncHandler.js gives error

const registerUser = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: "ok"
    })
});

export {registerUser}