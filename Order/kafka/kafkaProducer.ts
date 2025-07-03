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
