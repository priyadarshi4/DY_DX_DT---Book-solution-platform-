const { Comment } = require('../models/index');

// GET /api/comments/:solutionId
const getComments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [comments, total] = await Promise.all([
      Comment.find({ solution: req.params.solutionId })
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .populate('user', 'name avatar')
        .lean(),
      Comment.countDocuments({ solution: req.params.solutionId })
    ]);

    res.json({ comments, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments.' });
  }
};

// POST /api/comments/:solutionId
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment cannot be empty.' });
    }

    const comment = await Comment.create({
      content: content.trim(),
      user: req.user._id,
      solution: req.params.solutionId
    });

    const populated = await comment.populate('user', 'name avatar');
    res.status(201).json({ comment: populated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment.' });
  }
};

// DELETE /api/comments/:id - Admin or owner
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    const isOwner = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this comment.' });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment.' });
  }
};

// GET /api/comments/recent - Admin: get recent comments
const getRecentComments = async (req, res) => {
  try {
    const comments = await Comment.find()
      .sort('-createdAt')
      .limit(20)
      .populate('user', 'name avatar email')
      .populate('solution', 'question')
      .lean();
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments.' });
  }
};

module.exports = { getComments, addComment, deleteComment, getRecentComments };
