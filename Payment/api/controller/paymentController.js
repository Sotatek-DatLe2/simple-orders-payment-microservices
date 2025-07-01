// [POST] /api/payments
// Create a new payment
module.exports.createPayment = async (req, res) => {
  const { orderId, amount } = req.body
  const authToken = req.headers['authorization']
  // console.log('Payment Controller: createPayment called with headers:', req.headers);
  // console.log('Payment Controller: createPayment called with body:', req.body);

  if (!authToken) {
    return res.status(403).json({ error: 'Auth token is required in Authorization header' })
  }

  if (!orderId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Order ID and amount are required' })
  }

  try {
    // Mocked payment processing logic
    const isConfirmed = Math.random() > 0.5
    const status = isConfirmed ? 'confirmed' : 'declined'

    const payment = {
      orderId,
      status,
      createdAt: new Date(),
    }

    console.log('Payment status:', payment.status)

    //mocked timeout to simulate payment processing delay for 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000))

    res.status(201).json(payment)
  } catch (error) {
    console.error('Payment Controller: Failed to process payment:', error)
    res.status(500).json({ error: `Failed to process payment: ${error.message}` })
  }
}
