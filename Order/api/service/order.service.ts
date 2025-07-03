import { AppDataSource } from '../../config/dataSource'
import { Order, OrderEntity, OrderState, uuidv4 as uuidv4Order } from '../model/orderModel'
import { OrderHistory, OrderHistoryEntity, uuidv4 as uuidv4History } from '../model/orderState'
const StateMachine = require('javascript-state-machine')
import { MoreThanOrEqual, LessThanOrEqual, Between, Repository } from 'typeorm'

interface OrderFilters {
  status?: OrderState
  dateRange?: {
    startDate?: string
    endDate?: string
  }
}

interface GetOrdersOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  filters?: OrderFilters
}

const OrderService = {
  orderRepository: null as Repository<Order> | null,
  historyRepository: null as Repository<OrderHistory> | null,

  initialize: async (): Promise<void> => {
    try {
      await AppDataSource.initialize()
      OrderService.orderRepository = AppDataSource.getRepository(OrderEntity)
      OrderService.historyRepository = AppDataSource.getRepository(OrderHistoryEntity)
      console.log('Order Service: TypeORM DataSource initialized successfully')
    } catch (error) {
      console.error('Order Service: Failed to initialize TypeORM DataSource:', error)
      throw error
    }
  },

  createOrder: async (userId: string, totalAmount: number): Promise<Order> => {
    if (!OrderService.orderRepository || !OrderService.historyRepository) {
      throw new Error('OrderService not initialized.')
    }

    if (!userId || !totalAmount || totalAmount <= 0) {
      throw new Error('Invalid user ID or total amount')
    }

    const order: Order = {
      orderId: uuidv4Order(),
      userId,
      totalAmount,
      createdAt: new Date(),
      state: OrderState.CREATED,
    } as Order

    try {
      const savedOrder = await OrderService.orderRepository.save(order)

      await OrderService.historyRepository.save({
        Id: uuidv4History(),
        orderId: savedOrder.orderId,
        state: savedOrder.state,
        previousState: null,
        createdAt: new Date(),
      })

      return savedOrder
    } catch (error: any) {
      console.error('Order Service: Failed to create order:', error)
      throw new Error(`Failed to create order: ${error.message}`)
    }
  },

  changeOrderState: async (orderId: string, newState: OrderState): Promise<boolean> => {
    if (!OrderService.orderRepository || !OrderService.historyRepository) {
      throw new Error('OrderService not initialized.')
    }

    const order = await OrderService.orderRepository.findOne({ where: { orderId } })
    if (!order) throw new Error('Order not found')

    const fsm = new StateMachine({
      init: order.state,
      transitions: [
        { name: 'confirm', from: OrderState.CREATED, to: OrderState.CONFIRMED },
        { name: 'deliver', from: OrderState.CONFIRMED, to: OrderState.DELIVERED },
        { name: 'cancel', from: [OrderState.CREATED, OrderState.CONFIRMED], to: OrderState.CANCELLED },
      ],
    })

    let transitionName: string
    if (newState === OrderState.CONFIRMED) transitionName = 'confirm'
    else if (newState === OrderState.DELIVERED) transitionName = 'deliver'
    else if (newState === OrderState.CANCELLED) transitionName = 'cancel'
    else throw new Error('Invalid target state')

    if (!fsm.can(transitionName)) {
      throw new Error(`Cannot transition from ${order.state} to ${newState}`)
    }

    fsm[transitionName]()

    const previousState = order.state
    order.state = fsm.state

    if (fsm.state === OrderState.CANCELLED) {
      order.cancelledAt = new Date()
    }

    await OrderService.orderRepository.save(order)

    await OrderService.historyRepository.save({
      Id: uuidv4History(),
      orderId: order.orderId,
      state: order.state,
      previousState,
      createdAt: new Date(),
    })

    return true
  },

  getOrderStatus: async (orderId: string): Promise<Partial<Order>> => {
    const order = await OrderService.orderRepository!.findOne({
      where: { orderId },
      select: ['orderId', 'state', 'createdAt', 'totalAmount'],
    })
    if (!order) throw new Error('Order not found')
    return order
  },

  getOrder: async (orderId: string): Promise<any> => {
    if (!OrderService.orderRepository || !OrderService.historyRepository) {
      throw new Error('OrderService not initialized. Call initialize() first.')
    }

    const queryRunner = AppDataSource.createQueryRunner()

    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const trimmedOrderId = orderId.trim()

      const order = await queryRunner.manager.findOne(OrderEntity, {
        where: { orderId: trimmedOrderId },
        select: ['orderId', 'userId', 'createdAt', 'state', 'totalAmount', 'cancelledAt', 'updatedAt'],
      })

      if (!order) {
        throw new Error('Order not found')
      }

      const orderHistory = await queryRunner.manager.find(OrderHistoryEntity, {
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
    } catch (error: any) {
      await queryRunner.rollbackTransaction()
      console.error('Order Service: Failed to fetch order with transaction:', error.message)
      throw new Error(`Failed to fetch order: ${error.message}`)
    } finally {
      await queryRunner.release()
    }
  },

  getOrders: async (options: GetOrdersOptions): Promise<any> => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC', filters = {} } = options
    const where: any = {}

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

    const [orders, total] = await OrderService.orderRepository!.findAndCount({
      select: ['orderId', 'userId', 'createdAt', 'state', 'totalAmount', 'cancelledAt', 'updatedAt'],
      where,
      order: { [sortBy]: sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return { data: orders, total, page, totalPages: Math.ceil(total / limit) }
  },
}

export default OrderService
