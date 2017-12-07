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
// async function foo() {
//     try {
// 		let result = await rn.requestEthereumService.getRequestAsync("0x0000010000000000000000000000000000000000000000000000000000000000");
// 		console.log('result rn.requestEthereumService getRequestAsync********************');
// 		console.log(result);
//     }
//     catch(err) {
//         console.log('Error: ', err.message);
//     }
// }
// foo();
// async function foo() {
//     try {
//         let result = await rn.requestEthereumService.createRequestAsPayee( 
// 					'0xf17f52151ebef6c7334fad080c5704d77216b732', // 1
// 					200000,
// 					'{"reason":"wine purchased"}'
// 					// ,config.ethereum.contracts.requestSynchroneExtensionEscrow
// 					// ,['0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef'] // 2 
// 					);
// 				console.log('result createRequestAsPayee********************');
// 				console.log(result);
// 				let requestID = result.request.requestId;
// 				result = await rn.requestEthereumService.getRequestAsync(requestID);
// 				console.log('result rn.requestEthereumService getRequestAsync********************');
// 				console.log(result);
// 				// let resultExtension = await RequestSynchroneExtensionEscrowService.getInstance().getRequestAsync(requestID);
// 				// console.log('result requestSynchroneExtensionEscrowService getRequestAsync********************');
// 				// console.log(resultExtension);
// 				// let resultCancel = await rn.requestEthereumService.cancelAsync(requestID);
// 				// console.log('result cancelAsync********************');
// 				// console.log(resultCancel);
// 				// let result2 = await rn.requestEthereumService.getRequestAsync(requestID);
// 				// console.log('result rn.requestEthereumService getRequestAsync********************');
// 				// console.log(result2);
// 				let resultAccept = await rn.requestEthereumService.acceptAsync(requestID,{from:'0xf17f52151ebef6c7334fad080c5704d77216b732'});
// 				console.log('result acceptAsync********************');
// 				console.log(resultAccept);
// 				result = await rn.requestEthereumService.getRequestAsync(requestID);
// 				console.log('result rn.requestEthereumService getRequestAsync********************');
// 				console.log(result);
// 				console.log('######################################### paymentActionAsync #########################################');
// 				let resultPay = await rn.requestEthereumService.paymentActionAsync(requestID,900,0,{from:'0xf17f52151ebef6c7334fad080c5704d77216b732'});
// 				console.log('result resultPay********************');
// 				console.log(resultPay);
// 				result = await rn.requestEthereumService.getRequestAsync(requestID);
// 				console.log('result rn.requestEthereumService getRequestAsync********************');
// 				console.log(result);
// 				// console.log('######################################### releaseToPayeeAsync #########################################');
// 				// let resultReleaseToPayee = await rn.requestSynchroneExtensionEscrowService.releaseToPayeeAsync(requestID,{from:'0xf17f52151ebef6c7334fad080c5704d77216b732'});
// 				// console.log('result releaseToPayeeAsync********************');
// 				// console.log(resultReleaseToPayee);
// 				// result = await rn.requestEthereumService.getRequestAsync(requestID);
// 				// console.log('result rn.requestEthereumService getRequestAsync********************');
// 				// console.log(result);
// 				console.log('######################################### refundActionAsync #########################################');
// 				let resultPayBack = await rn.requestEthereumService.refundActionAsync(requestID,100);
// 				console.log('result refundActionAsync********************');
// 				console.log(resultPayBack);
// 				result = await rn.requestEthereumService.getRequestAsync(requestID);
// 				console.log('result rn.requestEthereumService getRequestAsync********************');
// 				console.log(result);
// 				console.log('######################################### subtractActionAsync #########################################');
// 				let resultsubtractAction = await rn.requestEthereumService.subtractActionAsync(requestID,100);
// 				console.log('result subtractActionAsync********************');
// 				console.log(resultsubtractAction);
// 				result = await rn.requestEthereumService.getRequestAsync(requestID);
// 				console.log('result requestEthereumService getRequestAsync********************');
// 				console.log(result);
// 				console.log('######################################### additionalActionAsync #########################################');
// 				let resultAdditionalAction = await rn.requestEthereumService.additionalActionAsync(requestID,222,{from:'0xf17f52151ebef6c7334fad080c5704d77216b732'});
// 				console.log('result additionalActionAsync********************');
// 				console.log(resultAdditionalAction);
// 				result = await rn.requestEthereumService.getRequestAsync(requestID);
// 				console.log('result requestEthereumService getRequestAsync********************');
// 				console.log(result);
//     }
//     catch(err) {
//         console.log('Error: ', err.message);
//     }
// }
function foo() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        var result, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, rn.requestEthereumService.createRequestAsPayee('0xf17f52151ebef6c7334fad080c5704d77216b732', // 1
                        200000, '{"reason":"wine purchased"}')
                            .on('broadcasted', function (data) { return __awaiter(_this, void 0, void 0, function () {
                            var test;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        console.log('broadcasted');
                                        console.log(data);
                                        return [4 /*yield*/, rn.requestCoreService.getRequestByTransactionHash(data.transactionHash)];
                                    case 1:
                                        test = _a.sent();
                                        console.log('getRequestByTransactionHash');
                                        console.log(test);
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    result = _a.sent();
                    console.log('result');
                    console.log(result);
                    return [4 /*yield*/, rn.requestEthereumService.accept(result.request.requestId, { from: '0xf17f52151ebef6c7334fad080c5704d77216b732' })
                            .on('broadcasted', function (data) { return __awaiter(_this, void 0, void 0, function () {
                            var test_1, err_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        console.log('broadcasted 222222222222222');
                                        console.log(data.transactionHash);
                                        return [4 /*yield*/, rn.requestCoreService.getRequestByTransactionHash(data.transactionHash)];
                                    case 1:
                                        test_1 = _a.sent();
                                        console.log('getRequestByTransactionHash 222222222222222');
                                        console.log(test_1);
                                        return [3 /*break*/, 3];
                                    case 2:
                                        err_2 = _a.sent();
                                        console.log('ErrorXXXXXX: ', err_2.message);
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.log('Error: ', err_1.message);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
foo();
//# sourceMappingURL=test.js.map