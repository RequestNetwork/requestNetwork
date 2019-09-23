import GroupMultiFormat from '../group-multi-format';
import Keccak256 from './keccak256-format';

// group all the multi-format concerning the hashing
const group = new GroupMultiFormat([new Keccak256()]);
export default group;
