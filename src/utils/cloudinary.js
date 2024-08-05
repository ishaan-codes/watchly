//our goal in this file is to take already uploaded files on local system/server and give a local file path and upload this file to cloudinary using its local file path
//if the file is successfully we need to delete it from our local server as it is now of no use
//file is loaded by the user, this is done through multer only as cloudinary can't take files by itself
//we will use multer to temporarily store this buffer file on our local system/server
//then we will upload this file on cloudinary from our local system/server
//we could have directly taken file from user through multer and directly uploaded it to cloudinary sdk and get its url
//but in production, we follow previous approach only as it allows us to re-attempt this process and re-upload it if an error arises

import { v2 as cloudinary } from 'cloudinary';
//cloudinary is also an sdk (software development kit)
import fs from "fs"; //refers to file system 
//our files are linked to our file system
//when we delete a file, only thing that happens is that particular file is unlinked from our file system, i.e., the file is not destroyed from its existence its just not present in our file system

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});
    
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        //file has been uploaded successfully
        /*
        console.log("File is uploaded on Cloudinary", response.url);
        return response;
        */
        //when we have tested that code is working fine, we'll remove this piece of code
        //we'll also unlink the files after testing, as we now don't want them to pile up in upblic/temp folder
        fs.unlinkSync(localFilePath);
        //we did this synchronously as we want to delete the files here only then move forward
        //if we did this asynchronously the files would have been removed in backend 
    }
    catch (error) {
        fs.unlinkSync(localFilePath) //removes locally saved temporary file as upload operation failed
        return null;
    }
}

export {uploadOnCloudinary}