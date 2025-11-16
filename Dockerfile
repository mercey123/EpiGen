# --- Build stage ---
    FROM node:20-alpine AS build
    WORKDIR /app

    RUN corepack enable && corepack prepare pnpm@latest --activate
    
    COPY package*.json pnpm-*.yaml ./
    RUN pnpm install
    
    COPY . .
    RUN pnpm build
    
    FROM node:20-alpine AS runner
    WORKDIR /app
    
    COPY --from=build /app/.output ./.output
    
    # EXPOSE 3000
    
    # ENV NITRO_PORT=3000
    # ENV PORT=3000
    
    CMD ["node", ".output/server/index.mjs"]
    