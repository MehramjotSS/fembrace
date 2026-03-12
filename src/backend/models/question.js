const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },

  title: {
    type: String,
    required: true
  },

  text: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Question", questionSchema);