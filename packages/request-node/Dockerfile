FROM yarnpkg/node-yarn

# Adding necessary files and folders
ADD package.json package.json

# Add compiled sources
ADD dist dist

# Installing necessary packages
RUN yarn install

# Port configuration
ENV PORT 3000
EXPOSE 3000

# Run
CMD ["yarn", "run", "start"]
