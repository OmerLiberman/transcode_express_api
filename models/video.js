const mongoose = require('mongoose');
const {Schema, model} = require('mongoose');

const Video = new Schema({
    owner: {type: mongoose.Types.ObjectId, ref: 'User'},
    title: {type: String, required: true},
    size: {type: String},
    path: {type: String, required: true},  
    type: {type: String},
});

module.exports = model('Video', Video);