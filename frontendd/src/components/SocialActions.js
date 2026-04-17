import React, { useState } from 'react';
import './SocialActions.css';


function SocialActions({ itineraryId, initialLikes, initialLiked, initialComments, initialRating, token }) {
  const [likesCount, setLikesCount] = useState(initialLikes || 0);
  const [liked, setLiked] = useState(initialLiked || false);
  const [comments, setComments] = useState(initialComments || []);
  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState(initialRating || 0);
  const [averageRating, setAverageRating] = useState(initialRating || 0);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleLikeToggle = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/itineraries/${itineraryId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLikesCount(data.likesCount);
        setLiked(data.liked);
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleAddComment = async e => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      const res = await fetch(`http://localhost:3001/api/itineraries/${itineraryId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [...prev, newComment]);
        setCommentText('');
      }
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleRate = async (value) => {
    try {
      const res = await fetch(`http://localhost:3001/api/itineraries/${itineraryId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value }),
      });
      if (res.ok) {
        const data = await res.json();
        setAverageRating(data.averageRating);
        setRatingsCount(data.ratingsCount);
        setRating(value);
      }
    } catch (err) {
      console.error('Rating error:', err);
    }
  };

  return (
    <div className="social-actions">
      <button onClick={handleLikeToggle} className={liked ? 'liked' : ''}>
        {liked ? '❤️ Liked' : '♡ Like'} ({likesCount})
      </button>

      <form onSubmit={handleAddComment} className="comment-form">
        <input
          type="text"
          placeholder="Add a comment..."
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          disabled={isSubmittingComment}
        />
        <button type="submit" disabled={isSubmittingComment}>Post</button>
      </form>

      <div className="comments-list">
        {comments.map(c => (
          <div key={c._id} className="comment-item">
            <strong>{c.user}</strong>: {c.text}
          </div>
        ))}
      </div>

      <div className="rating-section">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${star <= rating ? 'selected' : ''}`}
            onClick={() => handleRate(star)}
            style={{cursor: 'pointer', color: star <= rating ? 'gold' : 'gray'}}
          >★</span>
        ))}
        <span> {averageRating.toFixed(1)} ({ratingsCount} ratings)</span>
      </div>
    </div>
  );
}

export default SocialActions;
