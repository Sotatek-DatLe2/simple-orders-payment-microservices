const handleError = (res, error) => {
  console.error('Error:', error.message)
  if (error.message.includes('not found')) {
    return res.status(404).json({ error: error.message })
  }
  if (error.isJoi) {
    return res.status(400).json({ error: 'Validation failed', details: error.details })
  }
  return res.status(500).json({ error: 'Internal server error', details: error.message })
}

module.exports = { handleError }
