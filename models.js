import mongoose from "mongoose";
import md5 from 'md5';

const userSchema = new mongoose.Schema({
    _id: String,
    email: {type: String, unique: true, required: true },
    isVerified: {type: String, required: true},
    verificationToken: {type: String },
    username: { type: String, unique: false, required: true },
    password: { type: String, required: true },
});
  
userSchema.pre('save', function (next) {
    if (this.isModified('password')) {
        this.password = md5(this.password);
    }
    next();
});
export const UserModel = mongoose.model('User', userSchema);

const motherSchema = new mongoose.Schema({
    mom_id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true
    },
    notes: [String]
  });
export const MotherModel = mongoose.model('mother', motherSchema);

const uniqueIdSchema = new mongoose.Schema({
    collectionName: String, 
    lastId: Number, 
  });
  
export  const UniqueIdModel = mongoose.model('UniqueId', uniqueIdSchema);
  