import { EntitySchema } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

export interface OrderHistory {
  Id: string
  orderId: string
  state: string
  previousState?: string | null
  createdAt: Date
}

export const OrderHistoryEntity = new EntitySchema<OrderHistory>({
  name: 'OrderHistory',
  tableName: 'order_history',
  columns: {
    Id: {
      primary: true,
      type: 'varchar',
      length: 36,
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

export { uuidv4 }
