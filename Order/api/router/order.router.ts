import express, { Router } from 'express'
import orderController from '../controller/orderController'
import { authMiddleware } from '../../middleware/tokenAuth'

// Initialize Express Router
const router: Router = express.Router()

// API Endpoints
router.get('/orders', authMiddleware, orderController.getOrders)
router.post('/orders', authMiddleware, orderController.createOrder)
router.put('/orders/:orderId/cancel', authMiddleware, orderController.cancelOrder)
router.get('/orders/:orderId', authMiddleware, orderController.getOrderDetails)

export default router
