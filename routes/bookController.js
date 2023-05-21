import fs from 'fs'
import crypto from 'crypto'
import express from 'express'
import { sendResponse, throwException } from '../utils.js'
import { body, validationResult } from 'express-validator'
const router = express.Router()

// GET /books - Retrieve a list of books
router.get('/', (req, res, next) => {
  const allowedFilter = ['author', 'country', 'language', 'title', 'page', 'limit']
  try {
    let { page, limit, ...filterQuery } = req.query
    page = parseInt(page) || 1
    limit = parseInt(limit) || 10
    const filterKeys = Object.keys(filterQuery)

    // Validate and filter query parameters
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        throwException(401, `Query ${key} is not allowed`)
      }
      if (!filterQuery[key]) delete filterQuery[key]
    })

    const offset = limit * (page - 1)

    // Read books from the database
    let db = fs.readFileSync('db.json', 'utf-8')
    db = JSON.parse(db)
    const { books } = db
    let result = []

    // Apply filters
    if (filterKeys.length) {
      filterKeys.forEach((condition) => {
        result = result.length
          ? result.filter((book) => book[condition] === filterQuery[condition])
          : books.filter((book) => book[condition] === filterQuery[condition])
      })
    } else {
      result = books
    }

    // Apply pagination
    result = result.slice(offset, offset + limit)

    sendResponse(res, 200, result)
  } catch (error) {
    next(error)
  }
})

// POST /books - Create a new book
router.post(
  '/',
  [
    body('author').notEmpty().withMessage('Author is required'),
    body('country').notEmpty().withMessage('Country is required'),
    body('imageLink').notEmpty().withMessage('Image link is required'),
    body('language').notEmpty().withMessage('Language is required'),
    body('pages').isInt({ min: 1 }).withMessage('Pages must be a positive integer'),
    body('title').notEmpty().withMessage('Title is required'),
    body('year').isInt({ min: 1 }).withMessage('Year must be a positive integer')
  ],
  (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, { errors: errors.array() })
    }
    try {
      const { author, country, imageLink, language, pages, title, year } = req.body

      // Create a new book object
      const newBook = {
        author,
        country,
        imageLink,
        language,
        pages: parseInt(pages) || 1,
        title,
        year: parseInt(year) || 0,
        id: crypto.randomBytes(4).toString('hex')
      }

      // Read books from the database
      let db = fs.readFileSync('db.json', 'utf-8')
      db = JSON.parse(db)
      const { books } = db

      // Add the new book to the database
      books.push(newBook)
      db.books = books
      db = JSON.stringify(db)
      fs.writeFileSync('db.json', db)

      sendResponse(res, 200, newBook)
    } catch (error) {
      next(error)
    }
  }
)

// PUT /books/:bookId - Update a book
router.put('/:bookId', (req, res, next) => {
  try {
    const allowUpdate = ['author', 'country', 'imageLink', 'language', 'pages', 'title', 'year']
    const { bookId } = req.params
    const updates = req.body
    const updateKeys = Object.keys(updates)
    const notAllow = updateKeys.filter((el) => !allowUpdate.includes(el))

    if (notAllow.length) {
      throwException(401, 'Update field not allowed')
    }

    // Read books from the database
    let db = fs.readFileSync('db.json', 'utf-8')
    db = JSON.parse(db)
    const { books } = db

    const targetIndex = books.findIndex((book) => book.id === bookId)
    if (targetIndex < 0) {
      throwException(404, 'Book not found!')
    }

    // Update the book
    const updatedBook = { ...db.books[targetIndex], ...updates }
    db.books[targetIndex] = updatedBook
    db = JSON.stringify(db)
    fs.writeFileSync('db.json', db)

    sendResponse(res, 200, updatedBook)
  } catch (error) {
    next(error)
  }
})

// DELETE /books/:bookId - Delete a book
router.delete('/:bookId', (req, res, next) => {
  try {
    const { bookId } = req.params

    // Read books from the database
    let db = fs.readFileSync('db.json', 'utf-8')
    db = JSON.parse(db)
    const { books } = db

    const targetIndex = books.findIndex((book) => book.id === bookId)
    if (targetIndex < 0) {
      throwException(404, 'Book not found!')
    }

    // Remove the book from the database
    db.books = books.filter((book) => book.id !== bookId)
    db = JSON.stringify(db)
    fs.writeFileSync('db.json', db)

    sendResponse(res, 200, {})
  } catch (error) {
    next(error)
  }
})

export default router
