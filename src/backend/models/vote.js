const mongoose=require("mongoose");

const voteSchema = new mongoose.Schema({
  
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  
  username: {
    type: String,
    required: true
  },
  
  voteType: {
    type: Number,
    required: true
  }

});

voteSchema.index({ commentId: 1, username: 1 }, { unique: true });
module.exports = mongoose.model("Vote", voteSchema);













