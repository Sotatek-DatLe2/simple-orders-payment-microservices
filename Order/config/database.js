// const { DataSource } = require('typeorm')
// const { Order } = require('../api/model/orderModel')
// const { OrderHistory } = require('../api/model/orderState')

// const AppDataSource = new DataSource({
//   type: 'postgres',
//   host: process.env.ORDER_DB_HOST || 'localhost',
//   port: process.env.ORDER_DB_PORT || 5432,
//   username: process.env.ORDER_DB_USER || 'ad',
//   password: process.env.ORDER_DB_PASSWORD || '1',
//   database: process.env.ORDER_DB_NAME || 'Orders',
//   entities: [Order, OrderHistory],
//   synchronize: true,
//   // logging: true,
// })

// module.exports = { AppDataSource }

const { DataSource } = require('typeorm')
const { Order } = require('../api/model/orderModel')
const { OrderHistory } = require('../api/model/orderState')

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Order, OrderHistory],
  synchronize: true,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // logging: true,
})

module.exports = { AppDataSource }
