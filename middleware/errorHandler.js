export function apiNotFound(_req, res) {
  res.status(404).json({ message: 'API route not found' });
}

export function errorHandler(error, _req, res, _next) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error?.code === 11000) {
    return res.status(409).json({ message: 'Bu maÊ¼lumot allaqachon mavjud' });
  }

  return res.status(500).json({ message: error instanceof Error ? error.message : 'Server error' });
}
