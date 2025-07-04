import { consumer } from './kafka'
import OrderService from '../api/service/order.service'
import { emitOrderUpdate } from '../socket'
import { scheduleOrderDelivery } from '../util/autoUpdateStatus'
import { OrderState } from '../api/model/orderModel'

export const startKafkaConsumer = async () => {
  try {
    await consumer.connect()
    console.log('Kafka consumer connected')

    await consumer.subscribe({ topic: 'payment.result', fromBeginning: false })
    await consumer.subscribe({ topic: 'order.updated', fromBeginning: false })

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const data = JSON.parse(message.value!.toString())
          console.log(`Received ${topic}:`, data)

          if (topic === 'payment.result') {
            if (!data.orderId || !data.status) {
              console.warn('Invalid payment.result event payload:', data)
              return
            }

            if (data.status === 'confirmed') {
              await OrderService.changeOrderState(data.orderId, OrderState.CONFIRMED)
              scheduleOrderDelivery(data.orderId)
            } else if (data.status === 'declined') {
              await OrderService.changeOrderState(data.orderId, OrderState.CANCELLED)
            } else {
              console.warn('Unknown payment.result status:', data.status)
              return
            }

            const updatedOrder = await OrderService.getOrder(data.orderId)
            emitOrderUpdate(updatedOrder)
            console.log(`Emit orderUpdated for order ${data.orderId} after payment result`)
          }

          if (topic === 'order.updated') {
            if (!data.orderId || !data.state) {
              console.warn('Invalid order.updated event payload:', data)
              return
            }

            const updatedOrder = await OrderService.getOrder(data.orderId)
            emitOrderUpdate(updatedOrder)
            console.log(`Emit orderUpdated for order ${data.orderId} with state ${data.state}`)
          }
        } catch (err) {
          console.error('Error processing event:', (err as Error).message)
        }
      },
    })
  } catch (error) {
    console.error('Failed to start Kafka consumer:', (error as Error).message)
  }
}
