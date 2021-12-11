FROM node:14-alpine

WORKDIR /request-node
COPY dist/ncc .

RUN ls

# Port configuration
ENV PORT 3000
EXPOSE 3000

# Run
CMD ["node", "index.js"]
