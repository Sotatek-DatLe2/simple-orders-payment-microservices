const axios = require('axios')
const orderService = require('../service/order.service')
const { OrderState } = require('../model/orderModel')
const { scheduleOrderDelivery } = require('../../util/autoUpdateStatus')

// [GET] /api/orders
// Get all orders
module.exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', startDate, endDate, status } = req.query

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder: sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC',
      filters: {},
    }

    // Filter by date range
    if (startDate || endDate) {
      options.filters.dateRange = {
        startDate,
        endDate,
      }
    }

    // Filter by status
    if (status) {
      options.filters.status = status
    }

    const result = await orderService.getOrders(options)

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// [POST] /api/orders
// Create a new order
module.exports.createOrder = async (req, res) => {
  const authToken = req.headers['authorization']
  const { userId, totalAmount } = req.body

  if (!userId || !totalAmount) {
    return res.status(400).json({ error: 'User ID and total amount are required' })
  }

  try {
    // Create order
    const order = await orderService.createOrder(userId, totalAmount)

    try {
      // Call payment service
      const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL
      const paymentResponse = await axios.post(
        paymentServiceUrl,
        {
          orderId: order.orderId,
          amount: totalAmount,
        },
        {
          headers: {
            Authorization: authToken,
          },
        }
      )

      // If payment is successful, update order state to CONFIRMED
      if (paymentResponse.data.status === 'confirmed') {
        await orderService.changeOrderState(order.orderId, OrderState.CONFIRMED)
        scheduleOrderDelivery(order.orderId)
        return res.status(201).json({
          message: 'Order created and payment confirmed successfully',
          orderId: order.orderId,
          totalAmount: order.totalAmount,
          state: OrderState.CONFIRMED,
        })
      } else {
        await orderService.changeOrderState(order.orderId, OrderState.CANCELLED)
        return res.status(402).json({
          message: 'Order created but payment declined',
          orderId: order.orderId,
          totalAmount: order.totalAmount,
          state: OrderState.CANCELLED,
          error: 'Payment declined. Order has been cancelled.',
          details: paymentResponse.data.message || 'Payment was not successful.',
        })
      }
    } catch (paymentError) {
      console.error(`Order Controller: Payment service failed for order ${order.orderId}:`, paymentError.message)

      // Update order state to DECLINED if payment fails
      await orderService.changeOrderState(order.orderId, OrderState.CANCELLED)

      return res.status(502).json({
        error: 'Payment service failed. Order has been declined.',
        details: paymentError.message,
      })
    }
  } catch (error) {
    console.error('Order Controller: Failed to create order:', error.message)
    return res.status(500).json({ error: `Failed to create order: ${error.message}` })
  }
}

// [PUT] /api/orders/:orderId/cancel
// Cancel an order
module.exports.cancelOrder = async (req, res) => {
  const { orderId } = req.params
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' })
  }

  try {
    await orderService.changeOrderState(orderId, OrderState.CANCELLED)
    res.status(200).json({ message: 'Order cancelled successfully' })
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message })
  }
}

// [GET] /api/orders/:orderId/status
// Get the status of an order
module.exports.getOrderStatus = async (req, res) => {
  const { orderId } = req.params
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' })
  }

  try {
    const order = await orderService.getOrderStatus(orderId)
    res.status(200).json(order)
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message })
  }
}

// [GET] /api/orders/:orderId
// Get order details by ID
module.exports.getOrderDetails = async (req, res) => {
  const { orderId } = req.params
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' })
  }

  try {
    const order = await orderService.getOrder(orderId)
    res.status(200).json(order)
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message })
  }
}
