const OrderRouter = require("./order.router");

const setupRoutes = (app) => {
  app.use('/api', OrderRouter);
};


module.exports = setupRoutes;