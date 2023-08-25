import mongoose from "mongoose";
import {UserModel, MotherModel, UniqueIdModel} from './models.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { connURL } from './index.js'; 
import md5 from 'md5';
import {generateUniqueId, insertDoc, updateDoc, deleteDoc} from './index.js'
const __dirname = dirname(fileURLToPath(import.meta.url));
export let loggedIn = false;
import { generateUniqueToken } from "./index.js";


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
      const user = await UserModel.findOne({ username: userLog });
      console.log(user);
      if (user && user.password === md5(passLog)) {
        
        const read = await MotherModel.find({});
        req.session.userId = user._id;
        req.session.loginTimestamp = Date.now();
        loggedIn = true;
        
        res.redirect('/:userID');
      } else {
        // Login failed
        
        res.render(__dirname + '/views/index.ejs', { loggedIn: false });
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
                    verificationToken,
                    password: md5Pass
                });
    
            await newUser.save();
            const verificationLink = `http://localhost:3000/verify/${verificationToken}`;
            const mailOptions = {
                from: 'your-email@example.com',
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
    
            res.render(__dirname + '/views/regSuc.ejs');
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to register user.' });
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
      res.render(__dirname + '/views/index.ejs', { loggedIn: false });
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
      res.render(__dirname + '/views/index.ejs', { motherName: read, loggedIn: true });
    } else {
      // Redirect to a different URL for unauthorized access
      res.redirect(`/${userId}`);
    }
  }