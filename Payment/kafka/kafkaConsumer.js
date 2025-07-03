const { consumer, producer } = require('./kafka')
const { emitPaymentResult } = require('./kafkaProducer')

const startKafkaConsumer = async () => {
  await producer.connect()
  await consumer.connect()

  await consumer.subscribe({ topic: 'order.created', fromBeginning: false })

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value.toString())
      console.log('Received order.created:', data)

      // Mock logic thanh toán
      const status = Math.random() < 0.5 ? 'confirmed' : 'declined'

      await emitPaymentResult(data.orderId, status)
    },
  })
}

module.exports = { startKafkaConsumer }
