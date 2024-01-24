import { MultiFormatGroup } from '../multi-format-group';
import { PlainTextMultiFormat } from './plain-text-format';

// group all the multi-format concerning plain data
export const plainFormat = new MultiFormatGroup([new PlainTextMultiFormat()]);
