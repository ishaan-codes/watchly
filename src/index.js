/*
dev dependencies - these are the dependencies that are only required during development and not in production, thus they don't take up space in the production build
dependencies - these are the dependencies that are required in production
.gitkeep - this file is used to keep the directory in the git repository even if it is empty otherwise git ignores the folders/directories that are empty
nodemon restarts the server automatically and runs index.js when we write npm run dev in the terminal (for this we need to add a script in package.json)
prettier is a code formatter that formats the code according to the rules that we have set in the .prettierrc file
we add two files after installing prettier - .prettierrc and .prettierignore
we don't need a slash / at the end of mongodb url in the .env file
whenever we try to talk to database, we can face problems thus we need to handle these errors by using try-catch block or promises 
we can use async-await to handle promises
database is always in another continent and it takes time to connect to it, thus we need to handle this by using try-catch block or async-await
*/

//require('dotenv').config({path: './env'});
//this method actually depreciates the consistency of our code (as a require statement is written among import statements)
import dotenv from "dotenv";

//this method is better way of importing dotenv (this is not yet available on npm, we will use experimental feature of dotenv to move forward)

import express from "express";
const app = express();

/*
function connectDB(){}
connectDB();
this is also a way of connecting database but we can definitrely use the better way of connecting database by using iffie function
*/

//this approach involves writing function in another folder and file, and then just importing it here and execute it

import connectDB from '../db/index.js';
//sometimes writing only ./db might produce error so we update to ../db/index

//this is also an approach of connecting database, but we have polluted our index.js file with this
//better approach is the one above
/*
(async () => {
     try {
        await mongooose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error) => {
            console.log("ERROR: ", error);
            throw error;
        });
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        });
     } catch (error) {
        console.error("ERROR: ", error);
        throw error;
     }
})()
*/
//professional developers write ; before async function to avoid any error erupted while importing
dotenv.config({
    path: "./env"
});

connectDB();
/*
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server running on port ${process.env.PORT}`);
    });
});
.catch((err) => {
    console.log("MONGODB connection failed !!", err);
});
*/

//we majorly use 2 statements from request module (req.params -- allows to get data from url ; req.body -- data can come in this in form of forms, json etc. thus we need to add some configurations here)
//sometimes we also use req.cookies -- allows to store cookies from server
//cors -- allows to configure settings for cross origin resource sharing
//app.use is mostly used for configuration settings or in case of a middleware
