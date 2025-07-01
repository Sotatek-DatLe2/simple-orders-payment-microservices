const { EntitySchema } = require('typeorm')
const { v4: uuidv4 } = require('uuid')

const OrderState = Object.freeze({
  CREATED: 'created',
  CONFIRMED: 'confirmed',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
})

const Order = new EntitySchema({
  name: 'Order',
  tableName: 'orders',
  columns: {
    orderId: {
      primary: true,
      type: 'varchar',
      length: 36,
      generated: false,
      name: 'orderId',
    },
    userId: {
      type: 'varchar',
      length: 36,
      name: 'userId',
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
    state: {
      type: 'varchar',
      length: 20,
    },
    totalAmount: {
      type: 'float',
      nullable: false,
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true,
    },
    cancelledAt: {
      type: 'timestamp',
      nullable: true,
    },
  },
})

module.exports = { Order, OrderState, uuidv4 }
