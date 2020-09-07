# Install necessary modules for the nodes
FROM node:14 as installer

WORKDIR /app
ADD package.json .
RUN npm install

# Build request-node
ADD src src
RUN npm install -g typescript
ADD docker/docker-tsconfig.json tsconfig.json
RUN tsc -b

# Launch the server
FROM node:14-alpine

WORKDIR /request-node
COPY --from=installer /app/node_modules node_modules
COPY --from=installer /app/dist dist
ADD package.json .

# Port configuration
ENV PORT 3000
EXPOSE 3000

# Run
CMD ["node", "dist/server.js"]
