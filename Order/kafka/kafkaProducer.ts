import { producer } from './kafka'
export interface OrderCreatedEvent {
  orderId: string
  totalAmount: number
}

export const emitOrderCreatedKafka = async (payload: OrderCreatedEvent) => {
  try {
    await producer.send({
      topic: 'order.created',
      messages: [{ value: JSON.stringify(payload) }],
    })
    console.log(`Emitted order.created for order ${payload.orderId}`)
  } catch (error) {
    console.error(`Failed to emit order.created for order ${payload.orderId}:`, (error as Error).message)
  }
}

export const publishOrderUpdatedEvent = async (orderId: string, state: string) => {
  try {
    await producer.send({
      topic: 'order.updated',
      messages: [{ value: JSON.stringify({ orderId, state }) }],
    })
    console.log(`Emitted order.updated for order ${orderId} with state ${state}`)
  } catch (error) {
    console.error(`Failed to emit order.updated for order ${orderId}:`, (error as Error).message)
  }
}
