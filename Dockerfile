FROM node:24-alpine AS builder
WORKDIR /app

# PUBLIC_* values are baked into the static build, so they have to be known here, not
# at container start. Pass them with `docker build --build-arg PUBLIC_COMPANY_NAME=…`.
# Left unset, each ARG reaches the build as an empty string; astro.config.mjs treats
# empty as unset, so the build then falls back to a `.env` in the build context.
# A value given here wins over the file, so both ways can coexist.
ARG PUBLIC_COMPANY_NAME
ARG PUBLIC_API_BASE
ARG PUBLIC_PLUGIN_CLAUDE_REPO
ARG PUBLIC_PLUGIN_CLAUDE_RAW
ARG PUBLIC_PLUGIN_COPILOT_REPO
ARG PUBLIC_PLUGIN_COPILOT_RAW
ARG PUBLIC_PLUGIN_OPENCODE_REPO
ARG PUBLIC_PLUGIN_OPENCODE_RAW
ENV PUBLIC_COMPANY_NAME=$PUBLIC_COMPANY_NAME \
    PUBLIC_API_BASE=$PUBLIC_API_BASE \
    PUBLIC_PLUGIN_CLAUDE_REPO=$PUBLIC_PLUGIN_CLAUDE_REPO \
    PUBLIC_PLUGIN_CLAUDE_RAW=$PUBLIC_PLUGIN_CLAUDE_RAW \
    PUBLIC_PLUGIN_COPILOT_REPO=$PUBLIC_PLUGIN_COPILOT_REPO \
    PUBLIC_PLUGIN_COPILOT_RAW=$PUBLIC_PLUGIN_COPILOT_RAW \
    PUBLIC_PLUGIN_OPENCODE_REPO=$PUBLIC_PLUGIN_OPENCODE_REPO \
    PUBLIC_PLUGIN_OPENCODE_RAW=$PUBLIC_PLUGIN_OPENCODE_RAW

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
