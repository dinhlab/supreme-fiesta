import express from 'express'

import bookRouter from './bookController.js'
const router = express.Router()

router.get('/', function (req, res, next) {
  res.status(200).send('Welcome to Express!')
})
router.use('/books', bookRouter)

export default router
