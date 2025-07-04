const { producer } = require('./kafka')

const emitPaymentResult = async (orderId, status) => {
  await producer.send({
    topic: 'payment.result',
    messages: [{ value: JSON.stringify({ orderId, status }) }],
  })
  console.log(`Emitted payment.result for order ${orderId} with status ${status}`)
}

module.exports = { emitPaymentResult }
