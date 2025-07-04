const express = require('express')
const { Kafka } = require('kafkajs')
const app = express()
app.use(express.json())

const kafka = new Kafka({ clientId: 'api-gateway', brokers: ['localhost:9092'] })
const producer = kafka.producer()

const run = async () => {
  await producer.connect()

  app.post('/orders', async (req, res) => {
    const { userId, totalAmount } = req.body
    await producer.send({
      topic: 'order-events',
      messages: [{ value: JSON.stringify({ userId, totalAmount, status: 'CREATED' }) }],
    })
    res.json({ message: 'Order created event sent' })
  })

  app.post('/payments', async (req, res) => {
    const { orderId, amount } = req.body
    await producer.send({
      topic: 'payment-events',
      messages: [{ value: JSON.stringify({ orderId, amount, status: 'PAID' }) }],
    })
    res.json({ message: 'Payment event sent' })
  })

  app.listen(3000, () => console.log('API Gateway running on port 3000'))
}

run().catch(console.error)
