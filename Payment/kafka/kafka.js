const { Kafka } = require('kafkajs')

const kafka = new Kafka({
  clientId: 'payment-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
})

const producer = kafka.producer()
const consumer = kafka.consumer({ groupId: 'payment-service-group' })

module.exports = { producer, consumer, kafka }
