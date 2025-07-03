import { EntitySchema } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

export enum OrderState {
  CREATED = 'created',
  CONFIRMED = 'confirmed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface Order {
  orderId: string
  userId: string
  createdAt: Date
  state: OrderState
  totalAmount: number
  updatedAt?: Date
  cancelledAt?: Date | null
}

export const OrderEntity = new EntitySchema<Order>({
  name: 'Order',
  tableName: 'orders',
  columns: {
    orderId: {
      primary: true,
      type: 'varchar',
      length: 36,
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

export { uuidv4 }
