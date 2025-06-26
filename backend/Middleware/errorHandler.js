function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Shopify API errors
  if (err instanceof Shopify.Errors.ShopifyError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Custom errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Default to 500 server error
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
}

module.exports = errorHandler;