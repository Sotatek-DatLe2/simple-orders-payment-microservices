import OrderService from '../api/service/order.service'
import { app } from '../index'
import { OrderState } from '../api/model/orderModel'

const request = require('supertest')

jest.mock('../api/service/order.service')
jest.mock('../util/autoUpdateStatus')
jest.mock('../kafka/kafkaConsumer.ts')
jest.mock('../kafka/kafkaProducer.ts')

const mockedOrderService = OrderService as jest.Mocked<typeof OrderService>

describe('Order Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/orders - createOrder (HTTP)', () => {
    const validOrderInput = {
      userId: '2',
      totalAmount: 99.99,
    }

    const createdOrder = {
      orderId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      userId: validOrderInput.userId,
      totalAmount: validOrderInput.totalAmount,
      state: OrderState.CREATED,
      history: [],
      createdAt: new Date(),
    }

    it('should create order and return 201 with order details', async () => {
      mockedOrderService.createOrder.mockResolvedValue(createdOrder)

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer mockToken')
        .send(validOrderInput)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('message', 'Order created successfully, waiting for payment confirmation')
      expect(response.body.data).toHaveProperty('orderId', createdOrder.orderId)
      expect(response.body.data).toHaveProperty('userId', createdOrder.userId)
      expect(response.body.data).toHaveProperty('totalAmount', createdOrder.totalAmount)
      expect(mockedOrderService.createOrder).toHaveBeenCalledWith(validOrderInput.userId, validOrderInput.totalAmount)
    })

    it('should return 400 for invalid input', async () => {
      const invalidOrderInput = {
        userId: '', // Invalid: empty userId
        totalAmount: -10, // Invalid: negative amount
      }

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer mockToken')
        .send(invalidOrderInput)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'Validation failed')
    })

    it('should return 401 if no Authorization header', async () => {
      const response = await request(app).post('/api/orders').send(validOrderInput)

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'Authorization token is required')
    })

    it('should return 500 if order creation fails', async () => {
      mockedOrderService.createOrder.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer mockToken')
        .send(validOrderInput)

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'Failed to create order')
    })
  })

  describe('PUT /api/orders/:orderId/cancel - cancelOrder (HTTP)', () => {
    const orderId = 'd26f7867-9b32-4b36-84f9-6c1c5d227bd7'
    const cancelledOrder = {
      orderId,
      userId: '1',
      totalAmount: 159.98,
      state: OrderState.CANCELLED,
      history: [{ state: OrderState.CANCELLED, timestamp: new Date() }],
    }

    it('should cancel order and return 200', async () => {
      mockedOrderService.changeOrderState.mockResolvedValue(true)
      mockedOrderService.getOrder.mockResolvedValue(cancelledOrder)

      const response = await request(app).put(`/api/orders/${orderId}/cancel`).set('Authorization', 'Bearer mockToken')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('message', 'Order cancelled successfully')
      expect(mockedOrderService.changeOrderState).toHaveBeenCalledWith(orderId, OrderState.CANCELLED)
      expect(mockedOrderService.getOrder).toHaveBeenCalledWith(orderId)
    })

    it('should return 400 for invalid orderId', async () => {
      const invalidOrderId = 'invalid-uuid'

      const response = await request(app)
        .put(`/api/orders/${invalidOrderId}/cancel`)
        .set('Authorization', 'Bearer mockToken')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'Validation failed')
    })

    it('should return 401 if no Authorization header', async () => {
      const response = await request(app).put(`/api/orders/${orderId}/cancel`)

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'Authorization token is required')
    })

    it('should return 500 if cancel order fails', async () => {
      mockedOrderService.changeOrderState.mockRejectedValue(new Error('Database error'))

      const response = await request(app).put(`/api/orders/${orderId}/cancel`).set('Authorization', 'Bearer mockToken')

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'Failed to cancel order')
    })
  })

  describe('GET /api/orders - getOrders with query params (HTTP)', () => {
    const mockOrders = [
      { orderId: '1', userId: '2', totalAmount: 100, state: 'CREATED' },
      { orderId: '2', userId: '3', totalAmount: 200, state: 'CONFIRMED' },
    ]

    it('should return filtered orders with query parameters', async () => {
      mockedOrderService.getOrders.mockResolvedValue({
        data: mockOrders,
        total: 2,
        page: 1,
        totalPages: 1,
      })

      const response = await request(app)
        .get('/api/orders?page=1&limit=5&status=CREATED&sortBy=createdAt&sortOrder=DESC')
        .set('Authorization', 'Bearer mockToken')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('orders')
      expect(response.body.data.orders).toHaveLength(2)
      expect(mockedOrderService.getOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        filters: { status: 'CREATED' },
      })
    })

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/orders?page=invalid&limit=-1')
        .set('Authorization', 'Bearer mockToken')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
    })
  })
})
