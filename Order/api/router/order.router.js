const express = require('express');
const router = express.Router()
const {
    getOrders,
    createOrder,
    cancelOrder,
    getOrderStatus,
    getOrderDetails
} = require('../controller/orderController');

// API Endpoints
router.get('/orders', getOrders);
router.post('/orders', createOrder);
router.put('/orders/:orderId/cancel', cancelOrder);
router.get('/orders/:orderId/status', getOrderStatus);
router.get('/orders/:orderId', getOrderDetails);

module.exports = router;
