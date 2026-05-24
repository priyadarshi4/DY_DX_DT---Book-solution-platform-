const express = require('express');
const router = express.Router();
const {
  getChaptersByBook, createChapter, updateChapter, deleteChapter,
  getSectionsByChapter, createSection, updateSection, deleteSection,
  getQuestionsBySection, createQuestion, updateQuestion, deleteQuestion
} = require('../controllers/chapterController');
const { protect, adminOnly } = require('../middleware/auth');

// Chapters
router.get('/book/:bookId', getChaptersByBook);
router.post('/', protect, adminOnly, createChapter);
router.put('/:id', protect, adminOnly, updateChapter);
router.delete('/:id', protect, adminOnly, deleteChapter);

// Sections
router.get('/sections/chapter/:chapterId', getSectionsByChapter);
router.post('/sections', protect, adminOnly, createSection);
router.put('/sections/:id', protect, adminOnly, updateSection);
router.delete('/sections/:id', protect, adminOnly, deleteSection);

// Questions
router.get('/questions/section/:sectionId', getQuestionsBySection);
router.post('/questions', protect, adminOnly, createQuestion);
router.put('/questions/:id', protect, adminOnly, updateQuestion);
router.delete('/questions/:id', protect, adminOnly, deleteQuestion);

module.exports = router;
