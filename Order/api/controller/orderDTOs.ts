import { OrderState } from '../model/orderModel'

interface Order {
  orderId: string
  userId: string
  totalAmount: number
  state: OrderState
  createdAt: Date
  cancelledAt?: Date | null
  updatedAt?: Date | null
}

export class OrderDTO {
  orderId: string
  userId: string
  totalAmount: number
  state: OrderState
  createdAt: Date
  cancelledAt: Date | null
  updatedAt: Date | null

  constructor(order: Order) {
    this.orderId = order.orderId
    this.userId = order.userId
    this.totalAmount = order.totalAmount
    this.state = order.state
    this.createdAt = order.createdAt
    this.cancelledAt = order.cancelledAt || null
    this.updatedAt = order.updatedAt || null
  }
}

interface OrderHistory {
  id: string
  orderId: string
  state: OrderState
  previousState: OrderState | null
  createdAt: Date
}

export class OrderWithHistoryDTO {
  orderId: string
  userId: string
  totalAmount: number
  state: OrderState
  createdAt: Date
  cancelledAt: Date | null
  updatedAt: Date | null
  history: OrderHistory[]

  constructor(order: Order, history?: OrderHistory[]) {
    this.orderId = order.orderId
    this.userId = order.userId
    this.totalAmount = order.totalAmount
    this.state = order.state
    this.createdAt = order.createdAt
    this.cancelledAt = order.cancelledAt || null
    this.updatedAt = order.updatedAt || null
    this.history = history
      ? history.map((h) => ({
          id: h.id,
          orderId: h.orderId,
          state: h.state,
          previousState: h.previousState,
          createdAt: h.createdAt,
        }))
      : []
  }
}
