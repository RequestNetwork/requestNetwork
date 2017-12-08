"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("../config");
// import ipfs from 'ipfs-api';
var ipfsAPI = require("ipfs-api");
var Ipfs = /** @class */ (function () {
    function Ipfs() {
        this.ipfs = ipfsAPI(config_1.default.ipfs.nodeUrlDefault.host, config_1.default.ipfs.nodeUrlDefault.port, { protocol: config_1.default.ipfs.nodeUrlDefault.protocol });
    }
    Ipfs.getInstance = function () {
        return this._instance || (this._instance = new this());
    };
    Ipfs.prototype.addFile = function (_data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_data || _data == '') {
                return resolve('');
            }
            var dataParsed = JSON.parse(_data);
            _this.ipfs.add(Buffer.from(JSON.stringify(dataParsed)), function (err, result) {
                if (err)
                    return reject(err);
                return resolve(result[0].hash);
            });
        });
    };
    Ipfs.prototype.getFile = function (_hash) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_hash || _hash == '') {
                return resolve();
            }
            var data = '';
            _this.ipfs.cat(_hash, function (err, stream) {
                if (err)
                    return reject(err);
                stream.on('data', function (chunk) {
                    data += chunk;
                });
                stream.on('end', function () {
                    return resolve(data);
                });
                stream.on('error', function (err) {
                    return reject(err);
                });
            });
        });
    };
    Ipfs._instance = new Ipfs();
    return Ipfs;
}());
exports.default = Ipfs;
//# sourceMappingURL=ipfs-service.js.map