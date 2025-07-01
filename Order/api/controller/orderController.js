const axios = require('axios')
const orderService = require('../service/order.service')
const { OrderState } = require('../model/orderModel')
const { OrderDTO, OrderWithHistoryDTO } = require('./orderDTOs')
const { getOrdersSchema, createOrderSchema, orderIdSchema } = require('./validationSchema')
const { handleError } = require('../../util/errorHandler')
const { scheduleOrderDelivery } = require('../../util/autoUpdateStatus')

// Validate request data
const validate = async (schema, data) => {
  try {
    return await schema.validateAsync(data, { abortEarly: false })
  } catch (error) {
    throw error
  }
}

// [GET] /api/orders
const getOrders = async (req, res) => {
  try {
    const validated = await validate(getOrdersSchema, req.query)
    const options = {
      page: validated.page,
      limit: validated.limit,
      sortBy: validated.sortBy,
      sortOrder: validated.sortOrder.toUpperCase(),
      filters: {},
    }

    if (validated.status) {
      options.filters.status = validated.status
    }
    if (validated.startDate || validated.endDate) {
      options.filters.dateRange = {}
      if (validated.startDate) {
        options.filters.dateRange.startDate = validated.startDate
      }
      if (validated.endDate) {
        options.filters.dateRange.endDate = validated.endDate
      }
    }

    const result = await orderService.getOrders(options)
    const orders = result.data.map((order) => new OrderDTO(order))
    res.status(200).json({
      data: orders,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    })
  } catch (error) {
    handleError(res, error)
  }
}

// [POST] /api/orders
const createOrder = async (req, res) => {
  try {
    const validated = await validate(createOrderSchema, req.body)
    const authToken = req.headers['authorization']

    if (!authToken) {
      return res.status(401).json({ error: 'Authorization token is required' })
    }

    const order = await orderService.createOrder(validated.userId, validated.totalAmount)

    try {
      const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL
      if (!paymentServiceUrl) {
        throw new Error('Payment service URL is not configured')
      }

      const paymentResponse = await axios.post(
        paymentServiceUrl,
        {
          orderId: order.orderId,
          amount: validated.totalAmount,
        },
        {
          headers: { Authorization: authToken },
        }
      )

      if (paymentResponse.data.status === 'confirmed') {
        await orderService.changeOrderState(order.orderId, OrderState.CONFIRMED)
        scheduleOrderDelivery(order.orderId)
        return res.status(201).json({
          message: 'Order created and payment confirmed successfully',
          order: new OrderDTO(order),
        })
      } else {
        await orderService.changeOrderState(order.orderId, OrderState.CANCELLED)
        return res.status(402).json({
          message: 'Order created but payment declined',
          order: new OrderDTO(order),
          error: 'Payment declined. Order has been cancelled.',
          details: paymentResponse.data.message || 'Payment was not successful.',
        })
      }
    } catch (paymentError) {
      console.error(`Order Controller: Payment service failed for order ${order.orderId}:`, paymentError.message)
      await orderService.changeOrderState(order.orderId, OrderState.CANCELLED)
      return res.status(502).json({
        error: 'Payment service failed. Order has been declined.',
        details: paymentError.message,
      })
    }
  } catch (error) {
    handleError(res, error)
  }
}

// [PUT] /api/orders/:orderId/cancel
const cancelOrder = async (req, res) => {
  try {
    const validated = await validate(orderIdSchema, req.params)
    await orderService.changeOrderState(validated.orderId, OrderState.CANCELLED)
    res.status(200).json({ message: 'Order cancelled successfully' })
  } catch (error) {
    handleError(res, error)
  }
}

// [GET] /api/orders/:orderId/status
const getOrderStatus = async (req, res) => {
  try {
    const validated = await validate(orderIdSchema, req.params)
    const order = await orderService.getOrderStatus(validated.orderId)
    res.status(200).json(new OrderDTO(order))
  } catch (error) {
    handleError(res, error)
  }
}

// [GET] /api/orders/:orderId
const getOrderDetails = async (req, res) => {
  try {
    const validated = await validate(orderIdSchema, req.params)
    const order = await orderService.getOrder(validated.orderId)
    res.status(200).json(new OrderWithHistoryDTO(order, order.history))
  } catch (error) {
    handleError(res, error)
  }
}

module.exports = {
  getOrders,
  createOrder,
  cancelOrder,
  getOrderStatus,
  getOrderDetails,
}
