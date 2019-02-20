import { TransactionRequest } from '../../TransactionRequest';

export class BitcoinTransactionRequest extends TransactionRequest {
    public pincode!: string;
    public value!: number;
    public to!: string;
    public feePerByte?: number;
}
