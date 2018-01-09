"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("../config");
// import ipfs from 'ipfs-api';
var ipfsAPI = require('ipfs-api');
/**
 * The Ipfs class is the singleton class containing the ipfs node interface
 */
var Ipfs = /** @class */ (function () {
    /**
     * Private constructor to Instantiates a new Ipfs
     * @param   _publicIpfs   if true, use the public node otherwise a private one
     */
    function Ipfs(_publicIpfs) {
        var ipfsConfig = config_1.default.ipfs.nodeUrlDefault[_publicIpfs ? 'public' : 'private'];
        this.ipfs = ipfsAPI(ipfsConfig.host, ipfsConfig.port, { protocol: ipfsConfig.protocol });
    }
    /**
     * Initialized the class Web3Single
     * @param   _publicIpfs    _publicIpfs   if true, use the public node otherwise a private one
     */
    Ipfs.init = function (_publicIpfs) {
        if (_publicIpfs === void 0) { _publicIpfs = true; }
        this._instance = new this(_publicIpfs);
    };
    /**
     * get the instance of Ipfs
     * @return  The instance of the Ipfs class.
     */
    Ipfs.getInstance = function () {
        return this._instance;
    };
    /**
     * Add a file in ipfs
     * @param    _data    data that will be store in ipfs
     * @return   promise of the hash of the created file
     */
    Ipfs.prototype.addFile = function (_data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_data || _data === '') {
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
    /**
     * get a file from ipfs from its hash
     * @param    _hash    hash of the file to get
     * @return   promise of the data of the file
     */
    Ipfs.prototype.getFile = function (_hash) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_hash || _hash === '') {
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
                stream.on('error', function (errOnStrem) {
                    return reject(errOnStrem);
                });
            });
        });
    };
    return Ipfs;
}());
exports.default = Ipfs;
//# sourceMappingURL=ipfs-service.js.map