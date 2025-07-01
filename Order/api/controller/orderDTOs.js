class OrderDTO {
  constructor(order) {
    this.orderId = order.orderId
    this.userId = order.userId
    this.totalAmount = order.totalAmount
    this.state = order.state
    this.createdAt = order.createdAt
    this.cancelledAt = order.cancelledAt || null
    this.updatedAt = order.updatedAt || null
  }
}

class OrderWithHistoryDTO {
  constructor(order, history) {
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

module.exports = { OrderDTO, OrderWithHistoryDTO }
