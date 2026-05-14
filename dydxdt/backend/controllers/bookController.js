const Book = require('../models/Book');
const Chapter = require('../models/Chapter');
const { deleteFromCloudinary } = require('../config/cloudinary');

// GET /api/books - Get all books with filters
const getBooks = async (req, res) => {
  try {
    const {
      search,
      category,
      page = 1,
      limit = 12,
      sort = '-createdAt'
    } = req.query;

    const query = { isPublished: true };

    if (search) {
      query.$text = { $search: search };
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [books, total] = await Promise.all([
      Book.find(query)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('addedBy', 'name')
        .lean(),

      Book.countDocuments(query)
    ]);

    res.json({
      books,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Failed to fetch books.'
    });
  }
};

// GET /api/books/:id
const getBook = async (req, res) => {
  try {

    const book = await Book.findById(req.params.id)
      .populate('addedBy', 'name')
      .lean();

    if (!book) {
      return res.status(404).json({
        error: 'Book not found.'
      });
    }

    // Get chapters
    const chapters = await Chapter.find({
      book: book._id
    })
      .sort('number')
      .lean();

    res.json({
      book: {
        ...book,
        chapters
      }
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Failed to fetch book.'
    });
  }
};

// POST /api/books - Admin only
const createBook = async (req, res) => {
  try {

    const {
      title,
      author,
      description,
      category,
      pdfLink,
      edition,
      publisher,
      year,
      tags
    } = req.body;

    const bookData = {
      title,
      author,
      description,
      category,
      pdfLink,
      edition,
      publisher,
      year,

      // FIXED TAGS
      tags: tags
        ? tags.split(',').map(tag => tag.trim())
        : [],

      addedBy: req.user._id
    };

    // Thumbnail Upload
    if (req.file) {
      bookData.thumbnail = req.file.path;
      bookData.thumbnailPublicId = req.file.filename;
    }

    const book = await Book.create(bookData);

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      book
    });

  } catch (err) {

    console.error('BOOK CREATE ERROR:', err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// PUT /api/books/:id - Admin only
const updateBook = async (req, res) => {
  try {

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        error: 'Book not found.'
      });
    }

    const updateData = {
      ...req.body
    };

    // FIXED TAGS
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags
        .split(',')
        .map(tag => tag.trim());
    }

    // Upload New Thumbnail
    if (req.file) {

      // Delete old thumbnail
      if (book.thumbnailPublicId) {
        await deleteFromCloudinary(book.thumbnailPublicId);
      }

      updateData.thumbnail = req.file.path;
      updateData.thumbnailPublicId = req.file.filename;
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: 'Book updated successfully',
      book: updatedBook
    });

  } catch (err) {

    console.error('BOOK UPDATE ERROR:', err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// DELETE /api/books/:id - Admin only
const deleteBook = async (req, res) => {
  try {

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        error: 'Book not found.'
      });
    }

    // Delete thumbnail from cloudinary
    if (book.thumbnailPublicId) {
      await deleteFromCloudinary(book.thumbnailPublicId);
    }

    await Book.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Book deleted successfully.'
    });

  } catch (err) {

    console.error('BOOK DELETE ERROR:', err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// PATCH /api/books/:id/download
const incrementDownload = async (req, res) => {
  try {

    await Book.findByIdAndUpdate(
      req.params.id,
      {
        $inc: { downloads: 1 }
      }
    );

    res.json({
      success: true,
      message: 'Download counted.'
    });

  } catch (err) {

    console.error('DOWNLOAD COUNT ERROR:', err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  incrementDownload
};