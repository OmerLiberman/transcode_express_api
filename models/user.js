const mongoose = require('mongoose');
const {Schema, model} = require('mongoose');

const User = new Schema({
    name: {type: String, required: true},
    uploads: {type: Number, default: 0},
    reads: {type: Number, default: 0},  
    videos: [
        {
          type: mongoose.Types.ObjectId,
          required: false,
          ref: 'Video',
        }]
});

module.exports = model('User', User);