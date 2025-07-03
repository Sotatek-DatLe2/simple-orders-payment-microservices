import express, { Router } from 'express'
import orderController from '../controller/orderController'

// Initialize Express Router
const router: Router = express.Router()

// API Endpoints
router.get('/orders', orderController.getOrders)
router.post('/orders', orderController.createOrder)
router.put('/orders/:orderId/cancel', orderController.cancelOrder)
router.get('/orders/:orderId', orderController.getOrderDetails)

export default router
