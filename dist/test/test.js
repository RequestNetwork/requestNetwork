"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var config = require('../src/config.json');
var requestNetwork_1 = require("../src/requestNetwork");
var rn = new requestNetwork_1.default();
function foo() {
    return __awaiter(this, void 0, void 0, function () {
        var result, requestID, resultAccept, resultPay, resultReleaseToPayee, resultPayBack, resultdiscount, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 13, , 14]);
                    return [4 /*yield*/, rn.requestEthereumService.createRequestAsPayeeAsync('0xf17f52151ebef6c7334fad080c5704d77216b732', // 1
                        1000, '{"reason":"wine purchased"}', config.ethereum.contracts.requestSynchroneExtensionEscrow, ['0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef'] // 2 
                        )];
                case 1:
                    result = _a.sent();
                    console.log('result createRequestAsPayeeAsync********************');
                    console.log(result);
                    requestID = result.request.requestId;
                    return [4 /*yield*/, rn.requestEthereumService.getRequestAsync(requestID)];
                case 2:
                    result = _a.sent();
                    console.log('result rn.requestEthereumService getRequestAsync********************');
                    console.log(result);
                    return [4 /*yield*/, rn.requestEthereumService.acceptAsync(requestID, { from: '0xf17f52151ebef6c7334fad080c5704d77216b732' })];
                case 3:
                    resultAccept = _a.sent();
                    console.log('result acceptAsync********************');
                    console.log(resultAccept);
                    return [4 /*yield*/, rn.requestEthereumService.getRequestAsync(requestID)];
                case 4:
                    result = _a.sent();
                    console.log('result rn.requestEthereumService getRequestAsync********************');
                    console.log(result);
                    console.log('######################################### payAsync #########################################');
                    return [4 /*yield*/, rn.requestEthereumService.payAsync(requestID, 900, 0, { from: '0xf17f52151ebef6c7334fad080c5704d77216b732' })];
                case 5:
                    resultPay = _a.sent();
                    console.log('result resultPay********************');
                    console.log(resultPay);
                    return [4 /*yield*/, rn.requestEthereumService.getRequestAsync(requestID)];
                case 6:
                    result = _a.sent();
                    console.log('result rn.requestEthereumService getRequestAsync********************');
                    console.log(result);
                    console.log('######################################### releaseToPayeeAsync #########################################');
                    return [4 /*yield*/, rn.requestSynchroneExtensionEscrowService.releaseToPayeeAsync(requestID, { from: '0xf17f52151ebef6c7334fad080c5704d77216b732' })];
                case 7:
                    resultReleaseToPayee = _a.sent();
                    console.log('result releaseToPayeeAsync********************');
                    console.log(resultReleaseToPayee);
                    return [4 /*yield*/, rn.requestEthereumService.getRequestAsync(requestID)];
                case 8:
                    result = _a.sent();
                    console.log('result rn.requestEthereumService getRequestAsync********************');
                    console.log(result);
                    console.log('######################################### paybackAsync #########################################');
                    return [4 /*yield*/, rn.requestEthereumService.paybackAsync(requestID, 100)];
                case 9:
                    resultPayBack = _a.sent();
                    console.log('result paybackAsync********************');
                    console.log(resultPayBack);
                    return [4 /*yield*/, rn.requestEthereumService.getRequestAsync(requestID)];
                case 10:
                    result = _a.sent();
                    console.log('result rn.requestEthereumService getRequestAsync********************');
                    console.log(result);
                    console.log('######################################### discountAsync #########################################');
                    return [4 /*yield*/, rn.requestEthereumService.discountAsync(requestID, 100)];
                case 11:
                    resultdiscount = _a.sent();
                    console.log('result discountAsync********************');
                    console.log(resultdiscount);
                    return [4 /*yield*/, rn.requestEthereumService.getRequestAsync(requestID)];
                case 12:
                    result = _a.sent();
                    console.log('result requestEthereumService getRequestAsync********************');
                    console.log(result);
                    return [3 /*break*/, 14];
                case 13:
                    err_1 = _a.sent();
                    console.log('Error: ', err_1.message);
                    return [3 /*break*/, 14];
                case 14: return [2 /*return*/];
            }
        });
    });
}
foo();
//# sourceMappingURL=test.js.map