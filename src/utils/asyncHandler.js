/*
const asyncHandler = (requestHandler) => async (req,res,next) => {
    try {
        await requestHandler(req,res,next)
    }
    catch(error) {
        res.status(err.code || 500).json({
            success: false,
            message: err.message
        })
    }
}
*/
//this is a wrapper function which increases our efficiency by using this function whenever we have to write async block
//can be interpreted as () => {() => {}}
//asyncHandler is a higher order function can take other functions as parameters and thus consider them as variables
//till now we were taking req,res is async fucntion but actual variant of async is (err,req,res,next)
//next -- used to represent usage of middleware, it is a flag to indicate to move on to next middleware/function
//err -- takes an error

//previous way was using try catch blocks, while this is using promises
//this code is shorter thus more efficient
const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    }
    //#debugging -- not writing return gave error as this is a higher order function
}
export {asyncHandler};

