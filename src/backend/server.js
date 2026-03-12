const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const mongoose = require("./db");
const User = require("./models/users");
const Period = require("./models/periods");
const Question = require("./models/question");
const Comment = require("./models/comment");
const Vote = require("./models/vote");

const app = express();
const PORT = 5001;
const SECRET_KEY = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());


// ---------------------- SIGNUP ----------------------

app.post("/signup", async (req, res) => {

  const { username, password } = req.body;

  try {

    const existingUser = await User.findOne({ username });

    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({ message: "Signup successful" });

  } catch (err) {

    res.status(500).json({
      message: "Signup error",
      error: err.message
    });

  }
});


// ---------------------- LOGIN ----------------------

app.post("/login", async (req, res) => {

  const { username, password } = req.body;

  try {

    const user = await User.findOne({ username });

    if (!user)
      return res.status(401).json({
        message: "Invalid credentials"
      });

    const valid = await bcrypt.compare(password, user.password);

    if (!valid)
      return res.status(401).json({
        message: "Invalid credentials"
      });

    const token = jwt.sign(
      { username },
      SECRET_KEY,
      { expiresIn: "30m" }
    );

    res.json({ token });

  } catch (err) {

    res.status(500).json({
      message: "Login error",
      error: err.message
    });

  }
});


// ---------------------- PERIOD ENDPOINT ----------------------

app.post("/api/period", async (req, res) => {

  try {

    const { username, start, days } = req.body;

    if (!username || !start)
      return res.status(400).json({
        message: "Username and start date required"
      });

    const startDate = new Date(
      new Date(start).getFullYear(),
      new Date(start).getMonth(),
      new Date(start).getDate()
    );

    const normalizedDays = days.map(d => ({
      ...d,
      date: new Date(
        new Date(d.date).getFullYear(),
        new Date(d.date).getMonth(),
        new Date(d.date).getDate()
      )
    }));

    let period = await Period.findOne({
      username,
      start: startDate
    });

    if (period) {

      period.set({
        ...req.body,
        start: startDate,
        days: normalizedDays
      });

    } else {

      period = new Period({
        ...req.body,
        start: startDate,
        days: normalizedDays
      });

    }

    await period.save();

    res.json({
      message: "Period saved successfully",
      period
    });

  } catch (err) {

    res.status(500).json({
      message: "Error saving period",
      error: err.message
    });

  }
});


// ---------------------- GET DAY DATA ----------------------

app.get("/api/day", async (req, res) => {

  try {

    const { username, date } = req.query;

    const targetDate = new Date(
      new Date(date).getFullYear(),
      new Date(date).getMonth(),
      new Date(date).getDate()
    );

    const period = await Period.findOne({
      username,
      "days.date": targetDate
    });

    if (!period)
      return res.status(404).json({
        message: "No data for this date"
      });

    const day = period.days.find(
      d => d.date.getTime() === targetDate.getTime()
    );

    res.json({ day });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
});


// ---------------------- DASHBOARD TOKEN CHECK ----------------------

app.get("/dashboard", (req, res) => {

  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ message: "No token" });

  const token = authHeader.split(" ")[1];

  jwt.verify(token, SECRET_KEY, (err) => {

    if (err)
      return res.status(401).json({ message: "Invalid token" });

    res.status(200).json({ message: "OK" });

  });

});


// ---------------------- POST QUESTION ----------------------

app.post("/api/forum/question", async (req, res) => {

  try {

    const { username, title,text } = req.body;

    const question = new Question({
      username,
      title,
      text
    });

    await question.save();

    io.emit("newQuestion", question);

    res.json({
      message: "Question posted",
      question
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


// ---------------------- DELETE QUESTION ----------------------

app.delete("/api/forum/question/:id", async (req,res)=>{

  const qid = req.params.id;

  const comments = await Comment.find({questionId:qid});

  for(const c of comments){
    await Vote.deleteMany({commentId:c._id});
  }

  await Comment.deleteMany({questionId:qid});
  await Question.deleteOne({_id:qid});

  io.emit("questionDeleted",qid);

  res.json({message:"question deleted"});

});


// ---------------------- GET QUESTIONS ----------------------

app.get("/api/forum/questions", async (req, res) => {

  try {

    const questions = await Question
      .find()
      .sort({ createdAt: -1 });

    res.json(questions);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


// ---------------------- POST COMMENT / REPLY ----------------------

app.post("/api/forum/comment", async (req, res) => {

  try {

    const { questionId, username, text, parentCommentId } = req.body;

    const comment = new Comment({
      questionId,
      username,
      text,
      parentCommentId: parentCommentId || null
    });

    await comment.save();

    io.emit("newComment", comment);

    res.json({
      message: "Comment posted",
      comment
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


// ---------------------- DELETE COMMENT THREAD ----------------------

app.delete("/api/forum/comment/:id", async (req,res)=>{

  const commentId = req.params.id;

  async function deleteThread(id){

    const replies = await Comment.find({ parentCommentId: id });

    for(const reply of replies){
      await deleteThread(reply._id);
    }

    await Vote.deleteMany({ commentId: id });

    await Comment.deleteOne({ _id: id });

  }

  await deleteThread(commentId);

  io.emit("commentDeleted", commentId);

  res.json({ message: "comment deleted" });

});

// ---------------------- GET COMMENTS ----------------------

app.get("/api/forum/comments", async (req, res) => {

  try {

    const { questionId } = req.query;

    const comments = await Comment
      .find({ questionId })
      .sort({ createdAt: 1 });

    const commentMap = {};
    comments.forEach(c=>{
      commentMap[c._id] = c;
    });

    const result = await Promise.all(
      comments.map(async (comment)=>{

        let depth = 0;
        let parent = comment.parentCommentId;

        while(parent){
          depth++;
          parent = commentMap[parent]?.parentCommentId;
        }

        const votes = await Vote.find({ commentId: comment._id });

        let likes = 0;
        let dislikes = 0;

        votes.forEach(v => {
          if (v.voteType === 1) likes++;
          if (v.voteType === -1) dislikes++;
        });

        return {
          ...comment.toObject(),
          likes,
          dislikes,
          depth
        };

      })
    );

    res.set("Cache-Control", "no-store");

    res.json(result);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


// ---------------------- VOTE ----------------------

app.post("/api/forum/vote", async (req, res) => {

  try {

    const { commentId, username, voteType } = req.body;

    let existingVote = await Vote.findOne({ commentId, username });

    if (existingVote) {

      if (existingVote.voteType === voteType) {

        await Vote.deleteOne({ commentId, username });

      } else {

        existingVote.voteType = voteType;
        await existingVote.save();

      }

    } else {

      const vote = new Vote({
        commentId,
        username,
        voteType
      });

      await vote.save();

    }

    const votes = await Vote.find({ commentId });

    let likes = 0;
    let dislikes = 0;

    votes.forEach(v=>{
      if(v.voteType===1) likes++;
      if(v.voteType===-1) dislikes++;
    });

    io.emit("voteUpdate",{
      commentId,
      likes,
      dislikes
    });

    res.json({likes,dislikes});

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});


// ---------------------- SOCKET SERVER ----------------------

const server = http.createServer(app);

const io = new Server(server,{
  cors:{
    origin:"http://localhost:3000"
  }
});

io.on("connection",(socket)=>{

  console.log("socket connected",socket.id);

  socket.on("disconnect",()=>{
    console.log("socket disconnected");
  });

});

server.listen(PORT,()=>{
  console.log("Server running on port",PORT);
});
