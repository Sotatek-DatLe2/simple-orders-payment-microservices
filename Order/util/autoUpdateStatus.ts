import OrderService from '../api/service/order.service'
import { OrderState } from '../api/model/orderModel'

// export const scheduleOrderDelivery = async (orderId: string): Promise<void> => {
//   setTimeout(async () => {
//     try {
//       const order = await OrderService.getOrder(orderId)

//       if (order.state === OrderState.CONFIRMED) {
//         await OrderService.changeOrderState(orderId, OrderState.DELIVERED)
//         console.log(`Order ${orderId} has been updated to DELIVERED state after 300 seconds.`)
//       } else {
//         console.log(`Order ${orderId} is not in CONFIRMED state, skipping DELIVERED update.`)
//       }
//     } catch (error: any) {
//       console.error(`Failed to update order ${orderId} to DELIVERED state:`, error.message)
//     }
//   }, 300_000) // 300 seconds = 5 minutes
// }

import { deliveryQueue } from '../queue'

export const scheduleOrderDelivery = async (orderId: string): Promise<void> => {
  await deliveryQueue.add('deliverOrder', { orderId }, { delay: 30_000 }) // 30 seconds
}
