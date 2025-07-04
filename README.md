
# Orders & Payments Microservices

Two simple **Node.js/Express.js** microservices demonstrating order management, payment processing, and state transitions using a **state machine**.

---

## Orders Application  
Manages order lifecycle and communicates with Payments App to process payments.

### **Features**
- Create order
- Cancel order
- Check order status
- Realtime order dashboard
- Order states: `created → confirmed → delivered/cancelled`

---

## Payments Application  
Simulates payment processing with random success/failure responses.

---

## Tech Stack  
- Node.js, Express.js  
- State machine for order state management  
- Pub/Sub kafka for communication among services
- Redis for updated order status
- Build with docker
- Realtime order updating with websocket

---

## Endpoints

### Orders App  
`POST /orders` - Create order  
`PUT /orders/:id/cancel` - Cancel order  
`GET /orders/:id` - Get orders detail
`GET /orders/` - Get orders

### Payments App  
`POST /payments/process` - Process payment  

---

## Run  
```bash
cd orders-app && npm install && npm start  
cd payments-app && npm install && npm start  
```
