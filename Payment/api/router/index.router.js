const PaymentRouter = require("./payment.router");

const setupRoutes = (app) => {
  app.use('/api', PaymentRouter);
};


module.exports = setupRoutes;