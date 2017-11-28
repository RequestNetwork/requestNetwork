import config from '../config';
import * as Types from '../types';
// import ipfs from 'ipfs-api';
import ipfsAPI = require('ipfs-api');


export default class Ipfs {
	private static _instance:Ipfs = new Ipfs();

	public ipfs: any;

	private constructor() {
		this.ipfs = ipfsAPI(config.ipfs.node_url);
	}

	public static getInstance()
	{
		return this._instance || (this._instance = new this());
	}

	public addFile(	_details:string, 
					_callbackIpfs:Types.CallbackIpfsAddFile) 
	{
		if(!_details || _details == '') {
			return _callbackIpfs(null,'');
		}
		let _data = JSON.parse(_details);
		this.ipfs.add(Buffer.from(JSON.stringify(_data)), (err:Error, result:any[]) => {
			return _callbackIpfs(err,result?result[0].hash:null);
		});
	}

	public addFileAsync(_details:string) : Promise<any>
	{
        return new Promise((resolve, reject) => {
			if(!_details || _details == '') {
				return resolve('');
			}
			let _data = JSON.parse(_details);
        
			this.ipfs.add(Buffer.from(JSON.stringify(_data)), (err:Error, result:any[]) => {
				if(err) return reject(err);
				return resolve(result[0].hash);
			});
		});
	}

	public getFileAsync(_hash:string) : Promise<string>
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

	public getFile(	_hash:string, 
					_callbackIpfs:Types.CallbackIpfsGetFile) 
	{
		if(!_hash || _hash == '') {
			return _callbackIpfs(null,null);
		}
		let data = '';
		this.ipfs.cat(_hash, (err:Error, stream:any) => {
			if(err) return _callbackIpfs(err,null);

			stream.on('data', function(chunk:string) {
			   data += chunk;
			});

			stream.on('end',function(){
			   return _callbackIpfs(err,data);
			});

			stream.on('error',function(err:Error){
			   return _callbackIpfs(err,data);
			});
		});
	}


}