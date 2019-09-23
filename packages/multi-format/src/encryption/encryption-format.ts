import GroupMultiFormat from '../group-multi-format';
import Aes256Cbc from './aes256-cbc-format';
import Ecies from './ecies-format';

// group all the multi-format concerning the encryption
const group = new GroupMultiFormat([new Aes256Cbc(), new Ecies()]);
export default group;
