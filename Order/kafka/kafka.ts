import { Kafka } from 'kafkajs'

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
})

export const producer = kafka.producer()
export const consumer = kafka.consumer({ groupId: 'order-service-group' })

export const connectKafka = async () => {
  try {
    await producer.connect()
    console.log('Kafka producer connected')
  } catch (error) {
    console.error('Failed to connect Kafka producer:', (error as Error).message)
  }
}
