import { Request, Response, NextFunction } from 'express'
import OrderService from '../service/order.service'
import { OrderState } from '../model/orderModel'
import { OrderDTO, OrderWithHistoryDTO } from './orderDTOs'
import { getOrdersSchema, createOrderSchema, orderIdSchema } from './validationSchema'
import { scheduleOrderDelivery } from '../../util/autoUpdateStatus'
import { emitOrderUpdate } from '../../socket'
import { emitOrderCreatedKafka } from '../../kafka/kafkaProducer'
import { asyncHandler } from '../../middleware/asyncHandler'

interface GetOrdersQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  status?: string
  startDate?: string
  endDate?: string
}

interface CreateOrderBody {
  userId: string
  totalAmount: number
}

const sendSuccessResponse = <T>(res: Response, data: T, statusCode = 200, message?: string) => {
  res.status(statusCode).json({ success: true, data, message })
}

const sendErrorResponse = (res: Response, statusCode: number, message: string, details?: any) => {
  res.status(statusCode).json({ success: false, error: message, details })
}

const validateRequest =
  (schema: any, source: 'body' | 'query' | 'params' = 'body') =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validateAsync(req[source], { abortEarly: false })
      next()
    } catch (error) {
      console.error('Validation error:', error)
      sendErrorResponse(res, 400, 'Validation failed', error)
    }
  }

const getOrders = async (req: Request<{}, {}, {}, GetOrdersQuery>, res: Response) => {
  const { page, limit, sortBy, sortOrder, status, startDate, endDate } = req.query

  const options: any = {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sortBy: sortBy || 'createdAt',
    sortOrder: sortOrder?.toUpperCase() || 'ASC',
    filters: {},
  }

  if (status) options.filters.status = status
  if (startDate || endDate) {
    options.filters.dateRange = {}
    if (startDate) options.filters.dateRange.startDate = startDate
    if (endDate) options.filters.dateRange.endDate = endDate
  }

  const result = await OrderService.getOrders(options)
  const orders = result.data.map((order: any) => new OrderDTO(order))

  sendSuccessResponse(res, { orders, total: result.total, page: result.page, totalPages: result.totalPages })
}

const createOrder = async (req: Request<{}, {}, CreateOrderBody>, res: Response) => {
  const { userId, totalAmount } = req.body

  const order = await OrderService.createOrder(userId, totalAmount)
  console.log(`Order ${order.orderId} created, emitting event order.created...`)

  await emitOrderCreatedKafka({ orderId: order.orderId, totalAmount: order.totalAmount })
  scheduleOrderDelivery(order.orderId)

  sendSuccessResponse(res, new OrderDTO(order), 201, 'Order created successfully, waiting for payment confirmation')
}

const cancelOrder = async (req: Request, res: Response) => {
  console.log(`Cancelling order with ID: ${req.params.orderId}`)

  await OrderService.changeOrderState(req.params.orderId, OrderState.CANCELLED)
  const updatedOrder = await OrderService.getOrder(req.params.orderId)

  emitOrderUpdate(updatedOrder)
  console.log('Emit orderUpdated for order', updatedOrder.orderId)

  sendSuccessResponse(res, null, 200, 'Order cancelled successfully')
}

const getOrderDetails = async (req: Request, res: Response) => {
  const order = await OrderService.getOrder(req.params.orderId)
  sendSuccessResponse(res, new OrderWithHistoryDTO(order, order.history))
}

export default {
  getOrders: [validateRequest(getOrdersSchema), asyncHandler(getOrders)],
  createOrder: [validateRequest(createOrderSchema), asyncHandler(createOrder)],
  cancelOrder: [validateRequest(orderIdSchema, 'params'), asyncHandler(cancelOrder)],
  getOrderDetails: [validateRequest(orderIdSchema, 'params'), asyncHandler(getOrderDetails)],
}

//http version
// import { Request, Response, NextFunction } from 'express'
// import axios, { AxiosError } from 'axios'
// import OrderService from '../service/order.service'
// import { OrderState } from '../model/orderModel'
// import { OrderDTO, OrderWithHistoryDTO } from './orderDTOs'
// import { getOrdersSchema, createOrderSchema, orderIdSchema } from './validationSchema'
// import { scheduleOrderDelivery } from '../../util/autoUpdateStatus'
// import { emitOrderCreated, emitOrderUpdate } from '../../socket'

// // Interfaces for type safety
// interface ApiResponse<T> {
//   success: boolean
//   data?: T
//   message?: string
//   error?: string
//   details?: any
// }

// interface GetOrdersQuery {
//   page?: number
//   limit?: number
//   sortBy?: string
//   sortOrder?: 'ASC' | 'DESC'
//   status?: string
//   startDate?: string
//   endDate?: string
// }

// interface CreateOrderBody {
//   userId: string
//   totalAmount: number
// }

// // Common response utilities
// const sendSuccessResponse = <T>(res: Response, data: T, statusCode: number = 200, message?: string): void => {
//   const response: ApiResponse<T> = { success: true, data, message }
//   res.status(statusCode).json(response)
// }

// const sendErrorResponse = (res: Response, statusCode: number, message: string, details?: any): void => {
//   const response: ApiResponse<null> = { success: false, error: message, details }
//   res.status(statusCode).json(response)
// }

// // Validation middleware
// const validateRequest =
//   (schema: any, source: 'body' | 'query' | 'params' = 'body') =>
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await schema.validateAsync(req[source], { abortEarly: false })
//       next()
//     } catch (error) {
//       sendErrorResponse(res, 400, 'Validation failed', error)
//     }
//   }

// // Config module for environment variables
// const config = {
//   paymentServiceUrl: process.env.PAYMENT_SERVICE_URL || '',
// }

// // [GET] /api/orders
// const getOrders = async (req: Request<{}, {}, {}, GetOrdersQuery>, res: Response) => {
//   const { page, limit, sortBy, sortOrder, status, startDate, endDate } = req.query

//   const options: any = {
//     page: Number(page) || 1,
//     limit: Number(limit) || 10,
//     sortBy: sortBy || 'createdAt',
//     sortOrder: sortOrder?.toUpperCase() || 'ASC',
//     filters: {} as any,
//   }

//   if (status) options.filters.status = status
//   if (startDate || endDate) {
//     options.filters.dateRange = {}
//     if (startDate) options.filters.dateRange.startDate = startDate
//     if (endDate) options.filters.dateRange.endDate = endDate
//   }

//   const result = await OrderService.getOrders(options)
//   const orders = result.data.map((order: any) => new OrderDTO(order))
//   sendSuccessResponse(res, { orders, total: result.total, page: result.page, totalPages: result.totalPages })
// }

// // [POST] /api/orders
// const createOrder = async (req: Request<{}, {}, CreateOrderBody>, res: Response) => {
//   const { userId, totalAmount } = req.body
//   const authToken = req.headers['authorization']

//   if (!authToken) {
//     return sendErrorResponse(res, 401, 'Authorization token is required')
//   }

//   if (!config.paymentServiceUrl) {
//     return sendErrorResponse(res, 500, 'Payment service URL is not configured')
//   }

//   const order = await OrderService.createOrder(userId, totalAmount)
//   console.log(`Order ${order.orderId} created, waiting for payment confirmation...`)

//   try {
//     const paymentResponse = await axios.post(
//       config.paymentServiceUrl,
//       { orderId: order.orderId, amount: totalAmount },
//       { headers: { Authorization: authToken } }
//     )

//     console.log(`Payment service response for order ${order.orderId}:`, paymentResponse.data)

//     if (paymentResponse.data.status === 'confirmed') {
//       console.log(`Payment confirmed for order ${order.orderId}, updating state to CONFIRMED...`)
//       await OrderService.changeOrderState(order.orderId, OrderState.CONFIRMED)
//       emitOrderCreated(order)
//       scheduleOrderDelivery(order.orderId)
//       console.log(`Emit orderCreated for order ${order.orderId}`)
//       return sendSuccessResponse(res, new OrderDTO(order), 201, 'Order created and payment confirmed successfully')
//     } else {
//       console.log(`Payment declined for order ${order.orderId}, cancelling order...`)
//       await OrderService.changeOrderState(order.orderId, OrderState.CANCELLED)
//       emitOrderCreated(order)
//       return sendErrorResponse(res, 402, 'Order created but payment declined', {
//         order: new OrderDTO(order),
//         details: paymentResponse.data.message || 'Payment was not successful.',
//       })
//     }
//   } catch (error) {
//     console.error(`Payment service call failed for order ${order.orderId}:`, (error as AxiosError).message)
//     await OrderService.changeOrderState(order.orderId, OrderState.CANCELLED)
//     return sendErrorResponse(
//       res,
//       502,
//       'Payment service failed. Order has been declined.',
//       (error as AxiosError).message
//     )
//   }
// }

// // [PUT] /api/orders/:orderId/cancel
// const cancelOrder = async (req: Request<{ orderId: string }>, res: Response) => {
//   console.log(`Cancelling order with ID: ${req.params.orderId}`)
//   await OrderService.changeOrderState(req.params.orderId, OrderState.CANCELLED)
//   const updatedOrder = await OrderService.getOrder(req.params.orderId)
//   emitOrderUpdate(updatedOrder)
//   console.log('Emit orderUpdated for order', updatedOrder.orderId)
//   sendSuccessResponse(res, null, 200, 'Order cancelled successfully')
// }

// // [GET] /api/orders/:orderId
// const getOrderDetails = async (req: Request<{ orderId: string }>, res: Response) => {
//   const order = await OrderService.getOrder(req.params.orderId)
//   sendSuccessResponse(res, new OrderWithHistoryDTO(order, order.history))
// }

// // Export with validation middleware
// export default {
//   getOrders: [validateRequest(getOrdersSchema), getOrders],
//   createOrder: [validateRequest(createOrderSchema), createOrder],
//   cancelOrder: [validateRequest(orderIdSchema, 'params'), cancelOrder],
//   getOrderDetails: [validateRequest(orderIdSchema, 'params'), getOrderDetails],
// }
