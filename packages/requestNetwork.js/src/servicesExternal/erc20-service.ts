import { Web3Single } from './web3-single';

// @ts-ignore
import * as Web3PromiEvent from 'web3-core-promievent';

const ERC20 = require('../lib/ERC20.json');

/**
 * The Erc20Service class manage the ERC20 token
 */
export default class Erc20Service {
    /**
     * ERC20 contract's abi
     */
    public static abiERC20: any = ERC20.abi;

    private static web3Single: Web3Single;

    /**
     * ERC20 contract's address
     */
    private addressERC20: string;

    /**
     * Erc20 contract's web3 instance
     */
    private instanceERC20: any;

    /**
     * Constructor to Instantiates a new Erc20Service
     * @param   _address       address of the ERC20 token
     */
    public constructor(_address: string) {
        Erc20Service.web3Single = Web3Single.getInstance();
        this.addressERC20 = _address;
        this.instanceERC20 = new Erc20Service.web3Single.web3.eth.Contract(Erc20Service.abiERC20, _address);
    }

    public balanceOf(_address: string): Promise<any> {
        return this.instanceERC20.methods.balanceOf(_address).call();
    }

    public totalSupply(): Promise<any> {
        return this.instanceERC20.methods.totalSupply.call();
    }

    public allowance(_owner: string, _spender: string): Promise<any> {
        return this.instanceERC20.methods.allowance(_owner, _spender).call();
    }

    public approve(_spender: string, _value: any, _options ?: any): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();

        _options = Erc20Service.web3Single.setUpOptions(_options);

        const method = this.instanceERC20.methods.approve(_spender, _value);

        // submit transaction
        Erc20Service.web3Single.broadcastMethod(
            method,
            (hash: string) => {
                return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
            },
            (receipt: any) => {
                // we do nothing here!
            },
            async (confirmationNumber: number, receipt: any) => {
                if (confirmationNumber === _options.numberOfConfirmation) {
                    if ( ! receipt.events.Approval ) {
                        return promiEvent.reject('approve faied');
                    } else {
                        const currentAllowance = await this.allowance(_options.from, _spender);
                        return promiEvent.resolve(currentAllowance);
                    }
                }
            },
            (errBroadcast) => {
                return promiEvent.reject(errBroadcast);
            },
            _options);

        return promiEvent.eventEmitter;
    }

    public transfer(_to: string, _value: any, _options ?: any): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();

        _options = Erc20Service.web3Single.setUpOptions(_options);

        const method = this.instanceERC20.methods.transfer(_to, _value);

        // submit transaction
        Erc20Service.web3Single.broadcastMethod(
            method,
            (hash: string) => {
                return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
            },
            (receipt: any) => {
                // we do nothing here!
            },
            async (confirmationNumber: number, receipt: any) => {
                if (confirmationNumber === _options.numberOfConfirmation) {
                    // const eventRaw = receipt.events[0];
                    // const event = Erc20Service.web3Single.decodeEvent(Erc20Service.abiERC20, 'Transfer', eventRaw);
                    // promiEvent.resolve();
                    if ( ! receipt.events.Transfer ) {
                        return promiEvent.reject('transfer faied');
                    } else {
                        return promiEvent.resolve(true);
                    }
                }
            },
            (errBroadcast) => {
                return promiEvent.reject(errBroadcast);
            },
            _options);

        return promiEvent.eventEmitter;
    }

    public transferFrom(_from: string, _to: string, _value: any, _options ?: any): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();

        _options = Erc20Service.web3Single.setUpOptions(_options);

        const method = this.instanceERC20.methods.transferFrom(_from, _to, _value);

        // submit transaction
        Erc20Service.web3Single.broadcastMethod(
            method,
            (hash: string) => {
                return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
            },
            (receipt: any) => {
                // we do nothing here!
            },
            async (confirmationNumber: number, receipt: any) => {
                if (confirmationNumber === _options.numberOfConfirmation) {
                    if ( ! receipt.events.Transfer ) {
                        return promiEvent.reject('transfer faied');
                    } else {
                        return promiEvent.resolve(true);
                    }
                }
            },
            (errBroadcast) => {
                return promiEvent.reject(errBroadcast);
            },
            _options);

        return promiEvent.eventEmitter;
    }

    public isApprovePossible(_spender: string, _value: any): Promise<boolean> {
        return this.instanceERC20.methods.approve(_spender, _value).call();
    }

    public isTransferPossible(_to: string, _value: any): Promise<boolean> {
        return this.instanceERC20.methods.transfer(_to, _value).call();
    }

    public isTransferFromPossible(_from: string, _to: string, _value: any): Promise<boolean> {
        return this.instanceERC20.methods.transferFrom(_from, _to, _value).call();
    }

    public getAddress(): string {
        return this.addressERC20;
    }
}
