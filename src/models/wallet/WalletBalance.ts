import {SecretType} from '../SecretType';
import { WalletBalanceExchange } from './WalletBalanceExchange';

export class WalletBalance {
    public secretType?: SecretType; // needs to change in API to secretType
    public balance!: number;
    public symbol!: string;
    public gasBalance!: number;
    public gasSymbol!: string;
    public rawBalance!: string;
    public rawGasBalance!: string;
    public decimals!: number;
    public exchange?: WalletBalanceExchange;
}
