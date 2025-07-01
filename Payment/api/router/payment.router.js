const express = require('express');
const router = express.Router()
const {
    createPayment,
} = require('../controller/paymentController');

// API Endpoints

router.post('/payments', createPayment);
module.exports = router;
