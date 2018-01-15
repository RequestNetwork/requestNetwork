import config from '../config';
import * as Types from '../types';

// import ipfs from 'ipfs-api';
const ipfsAPI = require('ipfs-api');

/**
 * The Ipfs class is the singleton class containing the ipfs node interface
 */
export default class Ipfs {
    /**
     * Initialized the class Web3Single
     * @param   _publicIpfs    _publicIpfs   if true, use the public node otherwise a private one
     */
    public static init(_publicIpfs: boolean = true) {
        this._instance = new this(_publicIpfs);
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
     * @param   _publicIpfs   if true, use the public node otherwise a private one
     */
    private constructor(_publicIpfs: boolean) {
        const ipfsConfig = config.ipfs.nodeUrlDefault[_publicIpfs ? 'public' : 'private'];
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
            let data = '';
            this.ipfs.cat(_hash, (err: Error, stream: any) => {
                if (err) return reject(err);

                stream.on('data', (chunk: any) => {
                   data += chunk;
                });

                stream.on('end', () => {
                   return resolve(data);
                });

                stream.on('error', (errOnStrem: Error) => {
                   return reject(errOnStrem);
                });
            });
        });
    }
}
