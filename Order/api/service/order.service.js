const { AppDataSource } = require('../../config/database')
const { Order, OrderState, uuidv4: uuidv4Order } = require('../model/orderModel')
const { OrderHistory, uuidv4: uuidv4History } = require('../model/orderState')
const StateMachine = require('javascript-state-machine')
const { MoreThanOrEqual, LessThanOrEqual, Between } = require('typeorm')

const OrderService = {
  orderRepository: null,
  historyRepository: null,

  initialize: async () => {
    try {
      await AppDataSource.initialize()
      OrderService.orderRepository = AppDataSource.getRepository(Order)
      OrderService.historyRepository = AppDataSource.getRepository(OrderHistory)
      console.log('Order Service: TypeORM DataSource initialized successfully')
    } catch (error) {
      console.error('Order Service: Failed to initialize TypeORM DataSource:', error)
      throw error
    }
  },

  createOrder: async (userId, totalAmount) => {
    if (!OrderService.orderRepository) throw new Error('OrderService not initialized.')

    if (!userId || !totalAmount || totalAmount <= 0) {
      throw new Error('Invalid user ID or total amount')
    }

    const order = {
      orderId: uuidv4Order(),
      userId,
      totalAmount,
      createdAt: new Date(),
      state: OrderState.CREATED,
    }

    try {
      const savedOrder = await OrderService.orderRepository.save(order)

      // Record initial state in history
      await OrderService.historyRepository.save({
        Id: uuidv4History(),
        orderId: savedOrder.orderId,
        state: savedOrder.state,
        previousState: null,
        createdAt: new Date(),
      })

      return savedOrder
    } catch (error) {
      console.error('Order Service: Failed to create order:', error)
      throw new Error(`Failed to create order: ${error.message}`)
    }
  },

  changeOrderState: async (orderId, newState) => {
    if (!OrderService.orderRepository) throw new Error('OrderService not initialized.')

    const order = await OrderService.orderRepository.findOne({ where: { orderId } })
    if (!order) throw new Error('Order not found')

    // Initialize state machine
    const fsm = new StateMachine({
      init: order.state,
      transitions: [
        { name: 'confirm', from: OrderState.CREATED, to: OrderState.CONFIRMED },
        { name: 'deliver', from: OrderState.CONFIRMED, to: OrderState.DELIVERED },
        { name: 'cancel', from: [OrderState.CREATED, OrderState.CONFIRMED], to: OrderState.CANCELLED },
      ],
    })

    let transitionName
    if (newState === OrderState.CONFIRMED) transitionName = 'confirm'
    else if (newState === OrderState.DELIVERED) transitionName = 'deliver'
    else if (newState === OrderState.CANCELLED) transitionName = 'cancel'
    else throw new Error('Invalid target state')

    if (!fsm.can(transitionName)) {
      throw new Error(`Cannot transition from ${order.state} to ${newState}`)
    }

    // Apply transition
    fsm[transitionName]()

    const previousState = order.state
    order.state = fsm.state

    if (fsm.state === OrderState.CANCELLED) {
      order.cancelledAt = new Date()
    }

    await OrderService.orderRepository.save(order)

    // Log state change
    await OrderService.historyRepository.save({
      Id: uuidv4History(),
      orderId: order.orderId,
      state: order.state,
      previousState,
      createdAt: new Date(),
    })

    return true
  },

  getOrderStatus: async (orderId) => {
    const order = await OrderService.orderRepository.findOne({
      where: { orderId },
      select: ['orderId', 'state', 'createdAt', 'totalAmount'],
    })
    if (!order) throw new Error('Order not found')
    return order
  },

  getOrder: async (orderId) => {
    if (!OrderService.orderRepository || !OrderService.historyRepository) {
      throw new Error('OrderService not initialized. Call initialize() first.')
    }

    const queryRunner = OrderService.orderRepository.manager.connection.createQueryRunner()

    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const trimmedOrderId = orderId.trim()

      const order = await queryRunner.manager.findOne(OrderService.orderRepository.target, {
        where: { orderId: trimmedOrderId },
        select: ['orderId', 'userId', 'createdAt', 'state', 'totalAmount', 'cancelledAt', 'updatedAt'],
      })

      if (!order) {
        throw new Error('Order not found')
      }

      const orderHistory = await queryRunner.manager.find(OrderService.historyRepository.target, {
        where: { orderId: trimmedOrderId },
        order: { createdAt: 'DESC' },
        select: ['Id', 'orderId', 'state', 'previousState', 'createdAt'],
      })

      await queryRunner.commitTransaction()

      return {
        ...order,
        history: orderHistory.map((history) => ({
          id: history.Id,
          orderId: history.orderId,
          state: history.state,
          previousState: history.previousState,
          createdAt: history.createdAt,
        })),
      }
    } catch (error) {
      await queryRunner.rollbackTransaction()
      console.error('Order Service: Failed to fetch order with transaction:', error.message)
      throw new Error(`Failed to fetch order: ${error.message}`)
    } finally {
      await queryRunner.release()
    }
  },

  getOrders: async (options) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC', filters = {} } = options
    const where = {}

    if (filters.status) {
      where.state = filters.status
    }

    if (filters.dateRange) {
      if (filters.dateRange.startDate && filters.dateRange.endDate) {
        where.createdAt = Between(new Date(filters.dateRange.startDate), new Date(filters.dateRange.endDate))
      } else if (filters.dateRange.startDate) {
        where.createdAt = MoreThanOrEqual(new Date(filters.dateRange.startDate))
      } else if (filters.dateRange.endDate) {
        where.createdAt = LessThanOrEqual(new Date(filters.dateRange.endDate))
      }
    }

    const [orders, total] = await OrderService.orderRepository.findAndCount({
      select: ['orderId', 'userId', 'createdAt', 'state', 'totalAmount', 'cancelledAt', 'updatedAt'],
      where,
      order: { [sortBy]: sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return { data: orders, total, page, totalPages: Math.ceil(total / limit) }
  },
}

module.exports = OrderService
