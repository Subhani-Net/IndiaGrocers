import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV !== "production" ? "supersecret" : undefined),
      cookieSecret: process.env.COOKIE_SECRET || (process.env.NODE_ENV !== "production" ? "supersecret" : undefined),
    },
  },
  modules: [
    {
      key: "notification",
      resolve: "@medusajs/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/notification-local",
            id: "local",
            options: {
              name: "Local Notification Provider",
              channels: ["feed"],
            },
          },
          ...(process.env.SENDGRID_API_KEY
            ? [
                {
                  resolve: "@medusajs/notification-sendgrid",
                  id: "sendgrid",
                  options: {
                    channels: ["email"],
                    api_key: process.env.SENDGRID_API_KEY,
                    from:
                      process.env.SENDGRID_FROM ||
                      "noreply@indiagrocers.co.uk",
                  },
                },
              ]
            : []),
        ],
      },
    },
  ],
  plugins: [
    {
      resolve: "@medusajs/payment-stripe",
      options: {
        apiKey: process.env.STRIPE_SECRET_KEY || "",
      },
    },
  ],
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
  },
})
