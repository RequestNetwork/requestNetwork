import { getServerPort } from './config';
import requestNode from './requestNode';

const startNode = async (): Promise<void> => {
  // Initialize request node instance and listen for requests
  const requestNodeInstance = new requestNode();
  await requestNodeInstance.initialize();

  const port = getServerPort();
  requestNodeInstance.listen(port, () => {
    // tslint:disable:no-console
    console.log(`Listening on port ${port}`);
    return 0;
  });
};

startNode().catch(error => {
  throw error;
});
