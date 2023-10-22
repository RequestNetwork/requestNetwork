import GroupMultiFormat from '../group-multi-format.js';
import PlainText from './plain-text-format.js';

// group all the multi-format concerning plain data
const group = new GroupMultiFormat([new PlainText()]);
export default group;
