import requestNode from './requestNode';

const defaultPort = 3000;
const port = process.env.PORT || defaultPort;

// Listen for HTTP requests
const server = requestNode.listen(port, () => {
  // tslint:disable:no-console
  console.log(`Listening on port ${port}`);
  return 0;
});

export default server;
