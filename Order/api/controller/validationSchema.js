const Joi = require('joi')

const getOrdersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('createdAt', 'totalAmount', 'state').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').insensitive().default('desc'),
  startDate: Joi.alternatives()
    .try(
      Joi.date().iso(),
      Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .custom((value, helpers) => {
          const date = new Date(value)
          if (isNaN(date.getTime())) {
            return helpers.error('date.base')
          }
          return date
        }, 'date string')
    )
    .optional()
    .allow(null, ''),
  endDate: Joi.alternatives()
    .try(
      Joi.date().iso(),
      Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .custom((value, helpers) => {
          const date = new Date(value)
          if (isNaN(date.getTime())) {
            return helpers.error('date.base')
          }
          return date
        }, 'date string')
    )
    .optional()
    .allow(null, '')
    .when('startDate', {
      is: Joi.exist(),
      then: Joi.alternatives()
        .try(
          Joi.date().iso().min(Joi.ref('startDate')),
          Joi.string()
            .pattern(/^\d{4}-\d{2}-\d{2}$/)
            .custom((value, helpers) => {
              const date = new Date(value)
              if (isNaN(date.getTime())) {
                return helpers.error('date.base')
              }
              if (new Date(value) < new Date(helpers.state.ancestors[0].startDate)) {
                return helpers.error('date.min', { limit: helpers.state.ancestors[0].startDate })
              }
              return date
            }, 'date string')
        )
        .optional(),
    }),
  status: Joi.string().valid('CREATED', 'CONFIRMED', 'DELIVERED', 'CANCELLED').optional().allow(null, ''), // Allow null or empty string to mean "no filter"
}).unknown(false)

const createOrderSchema = Joi.object({
  userId: Joi.string().required(),
  totalAmount: Joi.number().positive().required(),
})

const orderIdSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
})

module.exports = { getOrdersSchema, createOrderSchema, orderIdSchema }
