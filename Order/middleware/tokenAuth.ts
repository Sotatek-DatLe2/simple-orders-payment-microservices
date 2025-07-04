import express, { Router, Request, Response, NextFunction } from 'express'

// Auth Middleware to check Bearer token
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader?.split(' ')[1]

  if (!token) {
    res.status(401).json({ success: false, error: 'Authorization token is required' })
    return
  }

  next()
}
