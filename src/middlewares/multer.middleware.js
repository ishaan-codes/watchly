import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp") //folder to store all files
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
        //file.originalname -- exact name entered by the user, can be avoided as multiple files with same name might result in overwriting of data
        //we are using this here as our file is present for a fraction of time, but in production, it should be avoided
    }
  })
  
  export const upload = multer({
    storage: storage //can be shortened to storage as both entities are same
})

