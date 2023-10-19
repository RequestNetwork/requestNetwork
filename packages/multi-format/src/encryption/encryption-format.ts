import GroupMultiFormat from '../group-multi-format.js';
import Aes256Cbc from './aes256-cbc-format.js';
import Aes256Gcm from './aes256-gcm-format.js';
import Ecies from './ecies-format.js';

// group all the multi-format concerning the encryption
const group = new GroupMultiFormat([new Aes256Cbc(), new Ecies(), new Aes256Gcm()]);
export default group;
