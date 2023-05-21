import express from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import indexRouter from './routes/index.js'

import dotenv from 'dotenv'

import cors from 'cors'

const app = express()
dotenv.config()
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(import.meta.url, 'public')))
app.use(cors())

// Set up routes
app.use('/', indexRouter)

// Handle path not found
app.use((req, res, next) => {
  const exception = new Error('Path not found')
  exception.statusCode = 404
  next(exception)
})

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).send(err.message) // Send the error status code and message as the response
})

export default app
