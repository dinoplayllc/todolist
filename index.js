import express from 'express';
import bodyParser from 'body-parser';
import ejs from 'ejs';
import mongoose, { Schema } from 'mongoose';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import md5 from 'md5';
import {MongoClient} from 'mongodb';
import session from 'express-session';
import {UserModel, MotherModel, UniqueIdModel} from './models.js';

const port = 8080;
const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Add this line to parse JSON data
export const connURL = "mongodb+srv://admin-hector:test123@freetest1.8lywiq7.mongodb.net/?retryWrites=true&w=majority"
import routes from './routes.js';
mongoose.connect(connURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

app.use(
    session({
      secret: 'oQDG41aVWyY9ljqIcf4NHurd3BoRuufV', // Replace with your secret key
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );
  app.use(routes);


  // Function to generate a new unique ID for a specific collection
export  async function generateUniqueId(collectionName) {
    const query = { collectionName: collectionName };
    const update = { $inc: { lastId: 1 } };
    const options = { upsert: true, new: true };
    const result = await UniqueIdModel.findOneAndUpdate(query, update, options);
    return result.lastId;
  }

export async function deleteDoc(motherName, note){
    try{
        await mongoose.connect(`${connURL}`);
        await MotherModel.findOneAndDelete({ name: motherName });
    }catch(error){
        console.log(error)
    }
}
export async function updateDoc(motherID, updatedNote) {
    try {
        await mongoose.connect(`${connURL}`);
        const filter = { _id: motherID };
        const update = { $set: { notes: [updatedNote] } };

        const result = await MotherModel.findOneAndUpdate(filter, update);

        if (result) {
            console.log(`Successfully updated notes for ${motherID}`);
        } else {
            console.log(`Mother ${motherID} not found in the database.`);
        }
    } catch (error) {
        console.error('Error updating document:', error);
    }
};

export async function insertDoc(userId, motherName, note) {
    await mongoose.connect(`${connURL}`);
    const insertDoc = new MotherModel({
        mom_id: `user_${userId}`,
        name: motherName,
        notes: note
    });

    await insertDoc.save(); // Wait for the document to be saved before rendering
}

export function generateUniqueToken() {
  const tokenLength = 32;
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';

  for (let i = 0; i < tokenLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    token += characters.charAt(randomIndex);
  }

  return token;
}

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
    process.exit(0);
});
app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
