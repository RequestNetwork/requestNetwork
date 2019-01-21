import requestNode from './requestNode';

const defaultPort = 3000;
const port = process.env.PORT || defaultPort;

/**
 * Listen for requests
 */
const server = requestNode.listen(port, () => {
  console.log(`Listening on port ${port}`);
  return 0;
});

export default server;
