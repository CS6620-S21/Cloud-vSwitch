FROM node:14-alpine as base

# Install easy-rsa
RUN apk update
RUN apk add openssl
RUN apk add easy-rsa
ENV PATH="$PATH:/usr/share/easy-rsa"

# Set up app directory and port
WORKDIR /usr/src/app
COPY package*.json ./
EXPOSE 8000

# Production stage
FROM base as production
ENV NODE_ENV=production
# Build code for production (without devDependencies)
RUN npm ci --only=production
COPY . .
ENTRYPOINT [ "node", "server.js" ]

# Development stage
FROM base as dev
ENV NODE_ENV=development
# Build code for development
RUN npm install -g nodemon && npm install
ENTRYPOINT [ "nodemon", "server.js" ]
