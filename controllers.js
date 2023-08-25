import mongoose from "mongoose";
import {UserModel, MotherModel, UniqueIdModel} from './models.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { connURL } from './index.js'; 
import md5 from 'md5';
import {generateUniqueId, insertDoc, updateDoc, deleteDoc} from './index.js'
const __dirname = dirname(fileURLToPath(import.meta.url));
import { generateUniqueToken } from "./index.js";
import nodemailer from 'nodemailer';
import msal from 'msal';

export const regiFailed = false;
export let loggedIn = false;

export async function logout(req, res) {
    try {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            // Redirect the user to the login page or another appropriate page
            res.redirect('/');
        });
    } catch (error) {
        console.log(error);
    }
 
}

export async function login(req, res){
    await mongoose.connect(`${connURL}`);
    const { userLog, passLog } = req.body;

    try {
      const email = await UserModel.findOne({ email: userLog });
      const user = await UserModel.findOne({ username: userLog });
      console.log(user);
      if (user && user.password === md5(passLog) || email && user.password === md5(passLog)) {
        
        const read = await MotherModel.find({});
        req.session.userId = user._id;
        req.session.loginTimestamp = Date.now();
        loggedIn = true;
        
        res.redirect('/:userID');
      } else {
        // Login failed
        
        res.render(__dirname + '/views/index.ejs', { loggedIn: false, regiFailed:false });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Server Error');
    }
}

export async function submit(req, res) {
    let item = req.body.note;
    let motherName = req.body.motherName;
    const userId = req.session.userId;

    await insertDoc(userId, motherName, item); // Save the new document to the database
    if(loggedIn === false){
        res.redirect('/');
    }else {
        
    res.redirect('/:userID');
    }
}
const azureConfig = {
    auth: {
        clientId: 'e8f2710f-cd73-44c3-99ec-142ec8d327dc',
        authority: 'https://login.microsoftonline.com/cf6a4f01-dfbf-48ee-b1e2-64e9431ed496',
        clientSecret: 'tTF8Q~XAXkVKDZ~qQtmq8EYHIZC1hQtLIDZRBafT'
    }
};

// Create a MSAL application
const msalApp = new msal.ConfidentialClientApplication(azureConfig);

// Request token using MSAL
async function getToken() {
    const tokenRequest = {
        scopes: ['https://outlook.office365.com/.default'] // This scope is for sending emails through Outlook/Microsoft 365
    };

    try {
        const tokenResponse = await msalApp.acquireTokenByClientCredential(tokenRequest);
        return tokenResponse.accessToken;
    } catch (error) {
        console.error('Error acquiring token:', error);
        return null;
    }
}

// Create a Nodemailer transporter with OAuth2
const transporter = nodemailer.createTransport({
    service: 'outlook', // You can set 'office365' or other appropriate service name
    auth: {
        type: 'OAuth2',
        user: 'admin@doulafocus.com', // Your email address
        accessToken: getToken()
    }
});
export async function register(req, res) {
    try {
        const { email, username, password, passwordVer } = req.body;

        const userId = await generateUniqueId('users');
        const md5Pass = md5(password);
        const md5PassVer = md5(passwordVer);
        const verificationToken = generateUniqueToken();
        if(md5Pass != md5PassVer){

        } else {
            const newUser = new UserModel(
                {
                    _id: `user_${userId}`,
                    email,
                    username,
                    isVerified: false, 
                    verificationToken,
                    password: md5Pass
                });
    
            await newUser.save();
            const verificationLink = `http://localhost:3000/verify/${verificationToken}`;
            const mailOptions = {
                from: 'admin@doulafocus.com',
                to: email,
                subject: 'Email Verification',
                text: `Please click on the following link to verify your email: ${verificationLink}`
            };
    
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                } else {
                    console.log('Email sent:', info.response);
                }
            });
    
            res.render(__dirname + '/views/regSuc.ejs', {loggedIn:false, regiFailed:false});
        }

    } catch (error) {
        console.error(error);
        res.render(__dirname + '/views/regFail.ejs', {loggedIn:false, regiFailed: true});
    }
}
export async function updateList(req, res) {
    let motherName = req.body.motherName;
    console.log("Received motherName:", motherName); // Debugging statement
    
    // Access the "name" property of the motherName object
    const name = motherName.name;

    console.log("Mother's name:", name); // Debugging statement

    await deleteDoc(name);
    if(loggedIn === false){
        res.redirect('/');
    }else {
        
    res.redirect('/:userID');
    }
}
  
export async function updateNotes(req, res) {
    const motherID = req.body.motherName._id;
    await updateDoc(motherID, req.body.updateNote);
  
    const userId = req.session.userId; // Get the userId from the session
    console.log("userId:", userId); // Debugging statement
  
    if (!loggedIn) { // Note the change here, using "!" to negate the "loggedIn" variable
      res.redirect('/');
    } else {
      res.redirect(`/${userId}`);
    }
}

export async function getIndexPage(req, res) {
    if (!req.session.loginTimestamp || Date.now() - req.session.loginTimestamp > 24 * 60 * 60 * 1000) {
      // User is not logged in
      res.render(__dirname + '/views/index.ejs', { loggedIn: false, regiFailed:false });
    } else {
      // User is logged in
      const userId = req.session.userId;
      // Your logic for logged-in users goes here
      // For example, fetch data for the logged-in user and render the page accordingly
      res.redirect(`/${userId}`);
    }
  }
  
  export async function getUserPage(req, res) {
    const read = await MotherModel.find({});
    // Your logic for logged-in users goes here
    // You can use req.session.userId to access the logged-in user's ID
    const userId = req.session.userId;
  
    // Check if the logged-in user's ID matches the requested userID
    if (userId === req.params.userID) {
      res.render(__dirname + '/views/index.ejs', { motherName: read, loggedIn: true, regiFailed:false });
    } else {
      // Redirect to a different URL for unauthorized access
      res.redirect(`/${userId}`);
    }
  }

  export async function verify(req, res){
    const verificationToken = req.params.token;

    try {
        // Find the user by verification token
        const user = await User.findOne({ verificationToken });

        if (!user) {
            res.render(__dirname + '/views/invalidToken.ejs');
        }

        // Update user's verification status
        user.isVerified = true;
        user.verificationToken = undefined; // Clear the token
        await user.save();

        res.render(__dirname + '/views/index.ejs', {loggedIn:false, regiFailed:false});
    } catch (error) {
        res.render(__dirname+ '/views/verFail.ejs', {error:error, loggedIn:false, regiFailed:false});
    }

  }