import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'PRMS — Property Rental Management System API',
      version: '1.0.0',
      description:
        'REST API for managing rental properties, tenants, lease agreements, and payments. ' +
        'Role-based access control (admin / manager / tenant) with Supabase Auth JWTs.',
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Local development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Supabase Auth access token',
        },
      },
      schemas: {
        Property: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            address: { type: 'string' },
            type: { type: 'string', enum: ['apartment', 'house', 'commercial', 'studio'] },
            status: { type: 'string', enum: ['vacant', 'occupied', 'maintenance'] },
            rent: { type: 'number' },
            bedrooms: { type: 'integer' },
            bathrooms: { type: 'integer' },
            manager_id: { type: 'string', format: 'uuid', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Tenant: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid', nullable: true },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Agreement: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            property_id: { type: 'string', format: 'uuid' },
            tenant_id: { type: 'string', format: 'uuid' },
            start_date: { type: 'string', format: 'date' },
            end_date: { type: 'string', format: 'date' },
            rent: { type: 'number' },
            deposit: { type: 'number' },
            status: { type: 'string', enum: ['active', 'expired', 'terminated'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            agreement_id: { type: 'string', format: 'uuid' },
            amount: { type: 'number' },
            due_date: { type: 'string', format: 'date' },
            paid_date: { type: 'string', format: 'date', nullable: true },
            method: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['paid', 'pending', 'overdue'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'manager', 'tenant'] },
            phone: { type: 'string', nullable: true },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Validation failed' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
