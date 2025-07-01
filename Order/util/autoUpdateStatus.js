const orderService = require('../api/service/order.service')
const { OrderState } = require('../api/model/orderModel')

module.exports.scheduleOrderDelivery = async (orderId) => {
  setTimeout(async () => {
    try {
      const order = await orderService.getOrder(orderId)
      if (order.state === OrderState.CONFIRMED) {
        await orderService.changeOrderState(orderId, OrderState.DELIVERED)
        console.log(`Order ${orderId} has been updated to DELIVERED state after 300 seconds.`)
      } else {
        console.log(`Order ${orderId} is not in CONFIRMED state, skipping DELIVERED update.`)
      }
    } catch (error) {
      console.error(`Failed to update order ${orderId} to DELIVERED state:`, error.message)
    }
  }, 300000) // 300 seconds = 5 minutes
}
