// src/socket/index.ts
import { Server, Socket } from 'socket.io'

let io: Server

export const setupSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  })

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id)

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })
}

export const emitOrderUpdate = (order: any) => {
  if (io) {
    console.log('Emit orderUpdated', order)
    io.emit('orderUpdated', order)
  }
}

export const emitOrderCreated = (order: any) => {
  if (io) {
    console.log('Emit orderCreated', order)
    io.emit('orderCreated', order)
  }
}
