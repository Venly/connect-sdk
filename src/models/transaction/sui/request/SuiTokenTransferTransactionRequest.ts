import { SuiTransferTransactionRequest } from './SuiTransferTransactionRequest';

export class SuiTokenTransferTransactionRequest extends SuiTransferTransactionRequest {
    public coinType!: string;
}
