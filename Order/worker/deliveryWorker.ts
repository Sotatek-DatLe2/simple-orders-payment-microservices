import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import OrderService from '../api/service/order.service'
import { OrderState } from '../api/model/orderModel'
import { emitOrderUpdate } from '../socket'
import { publishOrderUpdatedEvent } from '../kafka/kafkaProducer'
import { producer } from '../kafka/kafka'

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
})

async function startWorker() {
  try {
    await OrderService.initialize()
    await producer.connect()

    const deliveryWorker = new Worker(
      'orderDelivery',
      async (job) => {
        const { orderId } = job.data
        console.log(`Processing delivery for order ${orderId}`)

        const order = await OrderService.getOrder(orderId)
        if (order.state === OrderState.CONFIRMED) {
          await OrderService.changeOrderState(orderId, OrderState.DELIVERED)

          const updatedOrder = await OrderService.getOrder(orderId)
          await publishOrderUpdatedEvent(updatedOrder.orderId, updatedOrder.state)
        } else {
          console.log(`Order ${orderId} is not confirmed, skipping delivery.`)
        }
      },
      { connection }
    )

    deliveryWorker.on('completed', (job) => {
      console.log(`Job ${job.id} completed.`)
    })

    deliveryWorker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err)
    })
  } catch (error) {
    console.error('Failed to start worker:', error)
    process.exit(1)
  }
}

startWorker()
