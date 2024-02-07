export abstract class ChainAbstract {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly testnet: boolean = false,
  ) {}
}
