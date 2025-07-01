const { EntitySchema } = require('typeorm')
const { v4: uuidv4 } = require('uuid')

const OrderHistory = new EntitySchema({
  name: 'OrderHistory',
  tableName: 'order_history',
  columns: {
    Id: {
      primary: true,
      type: 'varchar',
      length: 36,
      generated: false,
      name: 'Id',
    },
    orderId: {
      type: 'varchar',
      length: 36,
      name: 'orderId',
    },
    state: {
      type: 'varchar',
      length: 20,
    },
    previousState: {
      type: 'varchar',
      length: 20,
      nullable: true,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
})

module.exports = { OrderHistory, uuidv4 }
