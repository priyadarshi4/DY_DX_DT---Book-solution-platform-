const User = require('../models/User');
const Book = require('../models/Book');
const Chapter = require('../models/Chapter');
const { Section, Question, Solution, Comment, Like } = require('../models/index');

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [users, books, solutions, comments, likes, questions] = await Promise.all([
      User.countDocuments(),
      Book.countDocuments(),
      Solution.countDocuments(),
      Comment.countDocuments(),
      Like.countDocuments(),
      Question.countDocuments()
    ]);

    // Recent signups (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const recentSolutions = await Solution.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    // Top books by downloads
    const topBooks = await Book.find()
      .sort('-downloads')
      .limit(5)
      .select('title author downloads thumbnail')
      .lean();

    res.json({
      stats: {
        users, books, solutions, comments, likes, questions,
        recentUsers, recentSolutions
      },
      topBooks
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find().sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
      User.countDocuments()
    ]);

    res.json({ users, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

// PATCH /api/admin/users/:id/toggle
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot deactivate admin.' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ user, message: `User ${user.isActive ? 'activated' : 'deactivated'}.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle user status.' });
  }
};

module.exports = { getStats, getUsers, toggleUserStatus };
