import express, { Express, Request, Response, NextFunction } from 'express'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import swaggerJsDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import cors from 'cors'
import OrderService from './api/service/order.service'
import setupRoutes from './api/router/index.router' // Import setupRoutes

// Initialize environment variables
dotenv.config()

// Initialize Express app
const app: Express = express()
const port: string | number = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(bodyParser.json({ limit: '100mb' }))
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }))
app.use(cookieParser())

// Swagger setup
const swaggerOptions: swaggerJsDoc.Options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Order Service API',
      version: '1.0.0',
      description: 'API documentation for the Order Service',
    },
    servers: [
      {
        url: `http://localhost:${port}/api`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'Custom string token for API authentication',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./api/router/*.ts'],
}

const swaggerDocs = swaggerJsDoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

// Routes
setupRoutes(app) // Call setupRoutes with the Express app

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.stack)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: err.message,
  })
})

// Start server
let server: ReturnType<typeof app.listen>

const startServer = async (): Promise<void> => {
  try {
    await OrderService.initialize() // Initialize PostgreSQL connection
    server = app.listen(port, () => {
      console.log(`Order Service running on port ${port}`)
      console.log(`API documentation is available at http://localhost:${port}/api-docs`)
    })
  } catch (error) {
    console.error('Failed to start Order Service:', error)
    process.exit(1)
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer()
}

// Export app and server for testing
export { app, server }
