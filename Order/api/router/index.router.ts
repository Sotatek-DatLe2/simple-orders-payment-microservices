import { Express } from 'express'
import OrderRouter from './order.router'

const setupRoutes = (app: Express): void => {
  app.use('/api', OrderRouter)
}

export default setupRoutes
