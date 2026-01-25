import { Schema, model } from 'mongoose';

export const guestSchema = new Schema({
    email:{
        type: String,
        required: true,
        unique: true
    }
})

export const Guest = new model('Guest', guestSchema);