const express = require('express');
const router = express.Router();
const {
  getBooks, getBook, createBook, updateBook, deleteBook, incrementDownload
} = require('../controllers/bookController');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadThumbnail } = require('../config/cloudinary');

router.get('/', getBooks);
router.get('/:id', getBook);
router.patch('/:id/download', incrementDownload);

router.post('/', protect, adminOnly, uploadThumbnail.single('thumbnail'), createBook);
router.put('/:id', protect, adminOnly, uploadThumbnail.single('thumbnail'), updateBook);
router.delete('/:id', protect, adminOnly, deleteBook);

module.exports = router;
