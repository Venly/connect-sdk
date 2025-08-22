import { TransactionRequest } from '../../TransactionRequest';

export class SuiTransactionRequest extends TransactionRequest {
    public gasPrice?: number;
    public gasBudget?: number;
    public value!: number;
    public data: string = '';
    public to!: string;
}
