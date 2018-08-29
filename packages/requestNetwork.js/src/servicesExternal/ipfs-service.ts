import config from '../config';
import * as Types from '../types';

// import ipfs from 'ipfs-api';
const ipfsAPI = require('ipfs-api');

/**
 * The Ipfs class is the singleton class containing the ipfs node interface
 * @ignore
 */
export default class Ipfs {
    /**
     * Initialized the class ipfs
     * @param   _ipfsNode   if boolean and true, use the default public node if false the default private one
     *                        if an object must contains: {host, port, protocol}
     *                        NOTE: This weird object (object | boolean) is a hotfix waiting for a better configuration management
     */
    public static init(_ipfsNode: any) {
        this._instance = new this(_ipfsNode);
    }

    /**
     * get the instance of Ipfs
     * @return  The instance of the Ipfs class.
     */
    public static getInstance() {
        return this._instance;
    }

    private static _instance: Ipfs;

    public ipfs: any;
    /**
     * Private constructor to Instantiates a new Ipfs
     * @param   _ipfsNode   if boolean and true, use the default public node if false the default private one
     *                        if an object must contains: {host, port, protocol}
     *                        NOTE: This weird object (object | boolean) is a hotfix waiting for a better configuration management
     */
    private constructor(_ipfsNode: any) {
        let ipfsConfig;
        if (typeof _ipfsNode === 'boolean' || typeof _ipfsNode === 'undefined') {
            ipfsConfig = config.ipfs.nodeUrlDefault[_ipfsNode ? 'public' : 'private'];
        } else if (_ipfsNode.host && _ipfsNode.port && _ipfsNode.protocol) {
            ipfsConfig = _ipfsNode;
        } else {
            throw new Error('_ipfsNode must be a boolean or an oject {host, port, protocol}');
        }

        this.ipfs = ipfsAPI(ipfsConfig.host,
                            ipfsConfig.port,
                            {protocol: ipfsConfig.protocol});
    }

    /**
     * Add a file in ipfs
     * @param    _data    data that will be store in ipfs
     * @return   promise of the hash of the created file
     */
    public addFile(_data: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!_data || _data === '') {
                return resolve('');
            }
            const dataParsed = JSON.parse(_data);

            this.ipfs.add(Buffer.from(JSON.stringify(dataParsed)), (err: Error, result: any) => {
                if (err) return reject(err);
                return resolve(result[0].hash);
            });
        });
    }

    /**
     * get a file from ipfs from its hash
     * @param    _hash    hash of the file to get
     * @return   promise of the data of the file
     */
    public getFile(_hash: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!_hash || _hash === '') {
                return resolve();
            }
            this.ipfs.cat(_hash, {timeout: config.ipfs.timeout}, (err: Error, data: any) => {
                if (err) {
                    return reject(err);
                }
                return resolve(data.toString());
            });
        });
    }
}
