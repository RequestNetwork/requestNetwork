import GroupMultiFormat from '../group-multi-format';
import PlainText from './plain-text-format';

// group all the multi-format concerning plain data
const group = new GroupMultiFormat([new PlainText()]);
export default group;
