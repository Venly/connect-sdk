import {TransactionRequest} from '../../TransactionRequest';

export class SuiTransferTransactionRequest extends TransactionRequest {
    public gasPrice?: number;
    public gasBudget?: number;
    public value!: number;
    public to!: string;
}
