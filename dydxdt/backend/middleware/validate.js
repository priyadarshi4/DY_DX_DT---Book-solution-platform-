const { validationResult } = require('express-validator');

/**
 * Middleware to catch express-validator errors and return
 * a consistent { errors: [...] } response.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg,
      errors: errors.array()
    });
  }
  next();
};

/**
 * Sanitise pagination query params.
 * Ensures page >= 1 and limit is within [1, 100].
 */
const sanitisePagination = (req, res, next) => {
  const page = parseInt(req.query.page, 10);
  const limit = parseInt(req.query.limit, 10);

  req.query.page = (!isNaN(page) && page >= 1) ? page : 1;
  req.query.limit = (!isNaN(limit) && limit >= 1 && limit <= 100) ? limit : 20;

  next();
};

module.exports = { validate, sanitisePagination };
