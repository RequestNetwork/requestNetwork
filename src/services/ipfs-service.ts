import config from '../config';
import * as Types from '../types';
// import ipfs from 'ipfs-api';
import ipfsAPI = require("ipfs-api");
//QmSbfaY3FRQQNaFx8Uxm6rRKnqwu8s9oWGpRmqgfTEgxWz


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

	public addFile(	_data:any, 
					_callbackIpfs:Types.CallbackIpfsAddFile) 
	{
		this.ipfs.add(Buffer.from(JSON.stringify(_data)), (err:Error, result:any[]) => {
			return _callbackIpfs(err,result?result[0].hash:null);
		});
	}

	public addFileAsync(_data:any) : Promise<any>
	{
        var myThis = this;
        return new Promise(function(resolve, reject) {
			myThis.ipfs.add(Buffer.from(JSON.stringify(_data)), (err:Error, result:any[]) => {
				if(err) return reject(err);
				return resolve(result[0].hash);
			});
		});
	}


	public getFile(	_hash:string, 
					_callbackIpfs:Types.CallbackIpfsGetFile) 
	{
		let data = "";
		this.ipfs.cat(_hash, (err:Error, stream:any) => {
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