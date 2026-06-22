const Book = require('../models/Book');
const { Solution, Question } = require('../models/index');

/**
 * GET /api/search?q=...
 * Returns top results from books + questions combined.
 */
const globalSearch = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters.' });
  }

  const query = q.trim();

  try {
    const regex = new RegExp(query, 'i');

    const [books, questions] = await Promise.all([
      Book.find({
        isPublished: true,
        $or: [
          { title: regex },
          { author: regex },
          { description: regex },
          { tags: regex }
        ]
      })
        .limit(6)
        .select('title author thumbnail category _id')
        .lean(),

      Question.find({ statement: regex })
        .limit(8)
        .populate('book', 'title _id')
        .populate('chapter', 'number _id')
        .select('number statement difficulty book chapter _id')
        .lean()
    ]);

    res.json({
      query,
      results: {
        books,
        questions
      },
      total: books.length + questions.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed.' });
  }
};

module.exports = { globalSearch };
