import GroupMultiFormat from '../group-multi-format';
import Aes256Cbc from './aes256-cbc-format';
import Aes256Gcm from './aes256-gcm-format';
import Ecies from './ecies-format';

// group all the multi-format concerning the encryption
const group = new GroupMultiFormat([new Aes256Cbc(), new Ecies(), new Aes256Gcm()]);
export default group;
