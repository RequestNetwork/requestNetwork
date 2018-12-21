import requestNode from './requestNode';

const defaultPort = 3000;
const port = process.env.PORT || defaultPort;

/**
 * Listen for requests
 */
const server = requestNode.listen(port, () => {
  return 0;
});

export default server;
