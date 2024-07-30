import mongoose from 'mongoose';
import {DB_NAME} from '../src/constants.js';

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        //we are storing response of mongoose.connect after successfully establishing connection to database
        console.log(`\n MONGODB connected !! DB HOST: ${connectionInstance.connection.host}`);
        //it is used to print the host (connection url) of the database to which we are connected to avoid any confusion in production
    }
    catch (error) {
        console.log("MONGODB connection failed", error);
        //throw error;
        //node.js allows us to use process object anywhere, we need not import it specifically in a file
        process.exit(1);
    }
}

export default connectDB;