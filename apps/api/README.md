# With-NestJs | API

## Getting Started

### Environment Variables

Create a `.env` file in the `apps/api` directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/rank_everything?schema=public"

# JWT
JWT_SECRET="your-secret-key-change-in-production"

# Deepseek AI API (Optional - will fallback to mock if not configured)
DEEPSEEK_API_KEY="your-deepseek-api-key"
DEEPSEEK_API_URL="https://api.deepseek.com/v1/chat/completions"

# AI Usage Control (Optional - defaults shown)
AI_CACHE_TTL=86400000  # 24 hours in milliseconds
AI_CACHE_MAX_SIZE=1000  # Maximum cache entries
AI_DAILY_LIMIT=50  # Daily API calls per tenant
AI_MONTHLY_LIMIT=1000  # Monthly API calls per tenant

# Notifications (Optional)
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
EMAIL_ENABLED=false

# Frontend URL (for notification links)
FRONTEND_URL="http://localhost:3001"

# PDF Output Directory (Optional)
PDF_OUTPUT_DIR="./storage/pdfs"
```

### Running the Server

First, run the development server:

```bash
pnpm run dev
# Also works with NPM, YARN, BUN, ...
```

By default, your server will run at [localhost:3000](http://localhost:3000).

## 💡 API Documentation (Swagger)

This project uses Swagger for API documentation. Once the server is running, you can access the interactive API documentation at:

- **Swagger UI**: [http://localhost:3000/api](http://localhost:3000/api)

You can use the Swagger UI to explore and test the available endpoints directly from your browser. Alternatively, you can use your favorite API platform like [Insomnia](https://insomnia.rest/) or [Postman](https://www.postman.com/).

### Important Note 🚧

If you plan to `build` or `test` the app. Please make sure to build the `packages/*` first.

## Learn More

Learn more about `NestJs` with following resources:

- [Official Documentation](https://docs.nestjs.com) - A progressive Node.js framework for building efficient, reliable and scalable server-side applications.
- [Official NestJS Courses](https://courses.nestjs.com) - Learn everything you need to master NestJS and tackle modern backend applications at any scale.
- [GitHub Repo](https://github.com/nestjs/nest)
