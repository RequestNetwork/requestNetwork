import '/packages/request-client.js/dist/requestnetwork.min.js';
import '/packages/web3-signature/dist/web3-signature.min.js';
import '/packages/epk-decryption/dist/epk-decryption.min.js';
import '/packages/epk-signature/dist/epk-signature.min.js';

import './basic.test.js';
import './encryption.test.js';
import './metamask.test.js';

mocha.checkLeaks();
mocha.run();
