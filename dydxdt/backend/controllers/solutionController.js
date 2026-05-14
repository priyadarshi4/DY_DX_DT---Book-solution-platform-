const { Solution, Question, Comment, Like } = require('../models/index');

// GET /api/solutions - Get solutions with filters
const getSolutions = async (req, res) => {
  try {
    const { bookId, chapterId, sectionId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (bookId) query.book = bookId;
    if (chapterId) query.chapter = chapterId;
    if (sectionId) query.section = sectionId;

    const skip = (Number(page) - 1) * Number(limit);

    const [solutions, total] = await Promise.all([
      Solution.find(query)
        .skip(skip)
        .limit(Number(limit))
        .populate('question', 'number statement difficulty')
        .populate('addedBy', 'name')
        .lean(),
      Solution.countDocuments(query)
    ]);

    // Add like/comment counts
    const solutionIds = solutions.map(s => s._id);
    const [likes, comments] = await Promise.all([
      Like.aggregate([
        { $match: { solution: { $in: solutionIds } } },
        { $group: { _id: '$solution', count: { $sum: 1 } } }
      ]),
      Comment.aggregate([
        { $match: { solution: { $in: solutionIds } } },
        { $group: { _id: '$solution', count: { $sum: 1 } } }
      ])
    ]);

    const likeMap = Object.fromEntries(likes.map(l => [l._id.toString(), l.count]));
    const commentMap = Object.fromEntries(comments.map(c => [c._id.toString(), c.count]));

    const enriched = solutions.map(s => ({
      ...s,
      likeCount: likeMap[s._id.toString()] || 0,
      commentCount: commentMap[s._id.toString()] || 0
    }));

    res.json({ solutions: enriched, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch solutions.' });
  }
};

// GET /api/solutions/:id
const getSolution = async (req, res) => {
  try {
    const solution = await Solution.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('question', 'number statement difficulty')
      .populate('book', 'title author thumbnail')
      .populate('chapter', 'title number')
      .populate('section', 'title number')
      .populate('addedBy', 'name')
      .lean();

    if (!solution) return res.status(404).json({ error: 'Solution not found.' });

    const [likeCount, commentCount, userLiked] = await Promise.all([
      Like.countDocuments({ solution: solution._id }),
      Comment.countDocuments({ solution: solution._id }),
      req.user ? Like.findOne({ user: req.user._id, solution: solution._id }) : null
    ]);

    res.json({
      solution: {
        ...solution,
        likeCount,
        commentCount,
        userLiked: !!userLiked
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch solution.' });
  }
};

// POST /api/solutions - Admin only
const createSolution = async (req, res) => {
  try {
    const { content, questionId, sectionId, chapterId, bookId, steps, pdfLink, latexFormulas } = req.body;

    // Verify question exists
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found.' });

    const solution = await Solution.create({
      content,
      question: questionId,
      section: sectionId,
      chapter: chapterId,
      book: bookId,
      steps: steps ? JSON.parse(steps) : [],
      pdfLink: pdfLink || '',
      latexFormulas: latexFormulas ? JSON.parse(latexFormulas) : [],
      addedBy: req.user._id
    });

    res.status(201).json({ solution });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create solution.' });
  }
};

// PUT /api/solutions/:id - Admin only
const updateSolution = async (req, res) => {
  try {
    const { content, steps, pdfLink, latexFormulas } = req.body;
    const updateData = { content, pdfLink };
    if (steps) updateData.steps = JSON.parse(steps);
    if (latexFormulas) updateData.latexFormulas = JSON.parse(latexFormulas);

    const solution = await Solution.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
    if (!solution) return res.status(404).json({ error: 'Solution not found.' });
    res.json({ solution });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update solution.' });
  }
};

// DELETE /api/solutions/:id - Admin only
const deleteSolution = async (req, res) => {
  try {
    const solution = await Solution.findByIdAndDelete(req.params.id);
    if (!solution) return res.status(404).json({ error: 'Solution not found.' });
    res.json({ message: 'Solution deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete solution.' });
  }
};

// POST /api/solutions/:id/like - Toggle like
const toggleLike = async (req, res) => {
  try {
    const existing = await Like.findOne({ user: req.user._id, solution: req.params.id });
    if (existing) {
      await Like.findByIdAndDelete(existing._id);
      const count = await Like.countDocuments({ solution: req.params.id });
      return res.json({ liked: false, likeCount: count });
    }
    await Like.create({ user: req.user._id, solution: req.params.id });
    const count = await Like.countDocuments({ solution: req.params.id });
    res.json({ liked: true, likeCount: count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle like.' });
  }
};

module.exports = { getSolutions, getSolution, createSolution, updateSolution, deleteSolution, toggleLike };
