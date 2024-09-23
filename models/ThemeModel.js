import mongoose from 'mongoose';

const ThemeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const Theme = mongoose.model('Theme', ThemeSchema);

export default Theme;
