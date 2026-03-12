import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { ArrowUp, ArrowDown } from "lucide-react";
import "./forum.css";

const socket = io("http://localhost:5001");

export default function Forum({ currUser }) {

  const [questions, setQuestions] = useState([]);
  const [comments, setComments] = useState({});
  const [questionText, setQuestionText] = useState("");
  const [commentInput, setCommentInput] = useState({});
  const [showComments, setShowComments] = useState({});
  const [replyParent, setReplyParent] = useState({});
  const [questionTitle, setQuestionTitle] = useState("");

  useEffect(() => {

    loadQuestions();

    socket.on("newQuestion", (q) => {
      setQuestions(prev => [q, ...prev]);
    });

    socket.on("questionDeleted", (qid) => {
      setQuestions(prev => prev.filter(q => q._id !== qid));
    });

    socket.on("newComment", (c) => {
      loadComments(c.questionId);
    });

    socket.on("commentDeleted", (cid) => {
      setComments(prev => {
        const updated = { ...prev };

        Object.keys(updated).forEach(qid => {
          updated[qid] = updated[qid].filter(c => c._id !== cid);
        });

        return updated;
      });
    });

    socket.on("voteUpdate", ({ commentId, likes, dislikes }) => {
      setComments(prev => {
        const updated = { ...prev };

        Object.keys(updated).forEach(qid => {
          updated[qid] = updated[qid].map(c => {
            if (c._id === commentId) {
              return { ...c, likes, dislikes };
            }
            return c;
          });
        });

        return updated;
      });
    });

    return () => {
      socket.off("newQuestion");
      socket.off("questionDeleted");
      socket.off("newComment");
      socket.off("commentDeleted");
      socket.off("voteUpdate");
    };

  }, []);

  async function loadQuestions() {
    const res = await fetch("http://localhost:5001/api/forum/questions");
    const data = await res.json();
    setQuestions(data);
  }

  async function loadComments(qid) {

    const res = await fetch(
      `http://localhost:5001/api/forum/comments?questionId=${qid}`
    );

    const data = await res.json();

    setComments(prev => ({
      ...prev,
      [qid]: data
    }));
  }

  async function postQuestion() {

    if (!questionText.trim()) return;

    const res = await fetch("http://localhost:5001/api/forum/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: currUser,
        title: questionTitle,
        text: questionText
      })
    });

    await res.json();

    setQuestionText("");
    setQuestionTitle("");
  }

  async function deleteQuestion(qid) {

    await fetch(`http://localhost:5001/api/forum/question/${qid}`, {
      method: "DELETE"
    });

  }

  async function postComment(qid) {

    const text = commentInput[qid];
    if (!text?.trim()) return;

    await fetch("http://localhost:5001/api/forum/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: qid,
        username: currUser,
        text: text,
        parentCommentId: replyParent[qid] || null
      })
    });

    setCommentInput({
      ...commentInput,
      [qid]: ""
    });

    setReplyParent({
      ...replyParent,
      [qid]: null
    });
  }

  async function deleteComment(cid, qid) {

    await fetch(`http://localhost:5001/api/forum/comment/${cid}`, {
      method: "DELETE"
    });

    loadComments(qid);
  }

  async function vote(commentId, voteType, qid) {

    await fetch("http://localhost:5001/api/forum/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commentId,
        username: currUser,
        voteType
      })
    });

    loadComments(qid);
  }

  function toggleComments(qid) {

    const open = showComments[qid];

    setShowComments({
      ...showComments,
      [qid]: !open
    });

    if (!open) loadComments(qid);
  }

  function renderComments(qid, parentId = null, depth = 0) {

    const list = (comments[qid] || []).filter(
      c => (c.parentCommentId || null) === parentId
    );

    return list.map(c => (

      <div key={c._id}>

        <div
          className="comment-card"
          style={{ marginLeft: depth * 30 }}
        >

          <div className="vote-bar">

              <ArrowUp
                className="vote-icon"
                onClick={()=>vote(c._id,1,qid)}
              />
              
              <span className="vote-number">{c.likes || 0}</span>
              
              <ArrowDown
                className="vote-icon"
                onClick={()=>vote(c._id,-1,qid)}
              />
              
              <span className="vote-number">{c.dislikes || 0}</span>
            </div>

          <div className="comment-body">

            <div className="comment-user">
              {c.username}
            </div>

            <div className="comment-text">
              {c.text}
            </div>

            <div className="comment-actions">

              <button
                className="reply-btn"
                onClick={() =>
                  setReplyParent({
                    ...replyParent,
                    [qid]: c._id
                  })
                }
              >
                Reply
              </button>

              {c.username === currUser && (
                <button
                  className="delete-btn"
                  onClick={() => deleteComment(c._id, qid)}
                >
                  Delete
                </button>
              )}

            </div>

          </div>

        </div>

        {renderComments(qid, c._id, depth + 1)}

      </div>

    ));
  }

  return (

    <div className="forum-container">

      <h2>Because every question is worth asking...</h2>

      <div className="ask-box">

        <input
          className="title-input"
          placeholder="Title — summarize the problem"
          value={questionTitle}
          onChange={(e) => setQuestionTitle(e.target.value)}
        />

        <textarea
          placeholder="Describe your problem in detail..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
        />

        <button onClick={postQuestion}>
          Post Question
        </button>

      </div>

      {questions.map(q => (

        <div className="question-card" key={q._id}>

          <div className="question-header">
            <div className="question-title">{q.title}</div>
            <div className="question-user">asked by {q.username}</div>
          </div>

          <div className="question-description">
            {q.text}
          </div>

          {q.username === currUser && (
            <button className="deleteqs" onClick={() => deleteQuestion(q._id)}>
              Delete Question
            </button>
          )}

          <button
            className="toggle-btn"
            onClick={() => toggleComments(q._id)}
          >
            {showComments[q._id]
              ? "Hide comments"
              : `Show comments (${comments[q._id]?.length || 0})`}
          </button>

          {showComments[q._id] && (

            <div className="comment-section">

              <div className="comment-input">

                {replyParent[q._id] && (
                  <div className="replying-indicator">
                    Replying to a comment
                  </div>
                )}

                <div className="comment-input-row">

                  <input
                    placeholder="Write comment..."
                    value={commentInput[q._id] || ""}
                    onChange={(e) =>
                      setCommentInput({
                        ...commentInput,
                        [q._id]: e.target.value
                      })
                    }
                  />

                  <button onClick={() => postComment(q._id)}>
                    Send
                  </button>

                </div>

              </div>

              {renderComments(q._id)}

            </div>

          )}

        </div>

      ))}

    </div>

  );

}