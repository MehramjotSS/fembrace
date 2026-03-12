const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({

  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },

  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
  },

  depth: {
    type: Number,
    default: 0
  },

  username: {
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

module.exports = mongoose.model("Comment", commentSchema);