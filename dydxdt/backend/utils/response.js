/**
 * Consistent API response helpers.
 *
 * Usage:
 *   sendSuccess(res, { book }, 201);
 *   sendError(res, 'Not found', 404);
 *   sendPaginated(res, items, { page, limit, total });
 */

const sendSuccess = (res, data = {}, status = 200) => {
  res.status(status).json({ success: true, ...data });
};

const sendError = (res, message = 'An error occurred', status = 500) => {
  res.status(status).json({ success: false, error: message });
};

const sendPaginated = (res, items, { page, limit, total }) => {
  res.json({
    success: true,
    data: items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
      hasNext: Number(page) < Math.ceil(total / Number(limit)),
      hasPrev: Number(page) > 1
    }
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
