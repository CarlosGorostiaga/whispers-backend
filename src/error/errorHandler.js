const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: err.message,
    });
  };
  
  module.exports = errorHandler;
  