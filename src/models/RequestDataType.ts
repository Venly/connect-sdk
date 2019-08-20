import { TransactionRequest }       from './transaction/TransactionRequest';
import { BuildTransferRequestBase } from './transaction/build/BuildTransferRequestBase';
import { GenericSignatureRequest }  from './transaction/GenericSignatureRequest';
import { ConfirmationRequest }      from './ConfirmationRequest';

export type RequestDataType = TransactionRequest | BuildTransferRequestBase | GenericSignatureRequest | ConfirmationRequest | {};
