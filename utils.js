// Send the response with the specified status code and data
export function sendResponse (res, statusCode, data) {
  res.status(statusCode).json(data)
}

// Throw an exception with the specified status code and message
export function throwException (statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  throw error
}
