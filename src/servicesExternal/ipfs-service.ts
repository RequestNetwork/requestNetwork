import config from '../config';
import * as Types from '../types';
// import ipfs from 'ipfs-api';
import ipfsAPI = require('ipfs-api');


export default class Ipfs {
	private static _instance:Ipfs;

	public ipfs: any;

	private constructor(_publicIpfs : boolean) {
		let ipfsConfig = config.ipfs.nodeUrlDefault[_publicIpfs?'public':'private'];
		this.ipfs = ipfsAPI(ipfsConfig.host, ipfsConfig.port, {protocol: ipfsConfig.protocol})
	}

    public static init(_publicIpfs : boolean = true) 
    {   
        this._instance = new this(_publicIpfs);
    }

    public static getInstance() 
    {
        return this._instance;
    }

	public addFile(_data:string) : Promise<any>
	{
        return new Promise((resolve, reject) => {
			if(!_data || _data == '') {
				return resolve('');
			}
			let dataParsed = JSON.parse(_data);
        
			this.ipfs.add(Buffer.from(JSON.stringify(dataParsed)), (err:Error, result:any[]) => {
				if(err) return reject(err);
				return resolve(result[0].hash);
			});
		});
	}

	public getFile(_hash:string) : Promise<string>
	{
        return new Promise((resolve, reject) => {
			if(!_hash || _hash == '') {
				return resolve();
			}
			let data = '';
			this.ipfs.cat(_hash, (err:Error, stream:any) => {
				if(err) return reject(err);

				stream.on('data', function(chunk:string) {
				   data += chunk;
				});

				stream.on('end',function(){
				   return resolve(data);
				});

				stream.on('error',function(err:Error){
				   return reject(err);
				});
			});
		});
	}
}