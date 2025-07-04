import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { OrderEntity } from '../api/model/orderModel'
import { OrderHistoryEntity } from '../api/model/orderState'
import * as dotenv from 'dotenv'

dotenv.config()

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [OrderEntity, OrderHistoryEntity],
  synchronize: true,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // logging: true,
})
