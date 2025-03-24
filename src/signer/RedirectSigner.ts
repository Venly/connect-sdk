import { ConfirmationRequest }              from '../models/ConfirmationRequest';
import { GenericSignatureRequest }          from '../models/transaction/GenericSignatureRequest';
import { BuildTransactionRequest }          from '../models/transaction/build/BuildTransactionRequest';
import { Signer, SignerResult }             from '../signer/Signer';
import Utils                                from '../utils/Utils';
import { BuildGasTransferRequest }          from '../models/transaction/build/BuildGasTransferRequest';
import { BuildTokenTransferRequest }        from '../models/transaction/build/BuildTokenTransferRequest';
import { BuildNftTransferRequest }          from '../models/transaction/build/BuildNftTransferRequest';
import { BuildSimpleTransactionRequest }    from '../models/transaction/build/BuildSimpleTransactionRequest';
import { BuildTransferRequestBase }         from '../models/transaction/build/BuildTransferRequestBase';
import { BuildGenericTransferRequestDto }   from '../models/transaction/build/BuildGenericTransferRequestDto';
import { BuildTransferRequestDto }          from '../models/transaction/build/BuildTransferRequestDto';
import { BuildTokenTransferRequestDto }     from '../models/transaction/build/BuildTokenTransferRequestDto';
import { BuildNftTransferRequestDto }       from '../models/transaction/build/BuildNftTransferRequestDto';
import { BuildGasTransferRequestDto }       from '../models/transaction/build/BuildGasTransferRequestDto';
import { BuildContractExecutionRequestDto } from '../models/transaction/build/BuildContractExecutionRequestDto';
import { BuildContractExecutionRequest }    from '../models/transaction/build/BuildContractExecutionRequest';
import { BuildMessageSignRequest }          from '../models/transaction/build/BuildMessageSignRequest';
import { BuildMessageSignRequestDto }       from '../models/transaction/build/BuildMessageSignRequestDto';
import { BuildSignRequestBase }             from '../models/transaction/build/BuildSignRequestBase';
import { BuildEip712SignRequestDto }        from '../models/transaction/build/BuildEip712SignRequestDto';
import { BuildEip712SignRequest }           from '../models/transaction/build/BuildEip712SignRequest';
import { ImportWalletRequest }              from '../models/wallet/ImportWalletRequest';

export interface RedirectOptions {
    redirectUri?: string,
    correlationID?: string
}

export class RedirectSigner implements Signer {

    private readonly bearerTokenProvider: () => string;

    constructor(bearerTokenProvider: () => string) {
        this.bearerTokenProvider = bearerTokenProvider;
    }

    public executeNativeTransaction(transactionRequest: any,
                                    redirectOptions?: RedirectOptions): Promise<SignerResult> {
        return new Promise<SignerResult>((resolve,
                                          reject) => {
            Utils.http().postInForm(
                `${Utils.urls.connect}/transaction/execute/${transactionRequest.type.toLowerCase()}`,
                transactionRequest,
                this.bearerTokenProvider,
                redirectOptions
            );
            resolve();
        });
    }

    /** @Deprecated */
    public executeTransaction(buildTransactionRequestOrTransactionId: BuildGenericTransferRequestDto | string,
                              redirectOptions?: RedirectOptions): Promise<SignerResult> {
        if (typeof buildTransactionRequestOrTransactionId === 'string') {
            return this.executeSavedTransaction(buildTransactionRequestOrTransactionId, redirectOptions);
        } else {
            return this.executeProvidedTransaction(BuildTransactionRequest.fromData(buildTransactionRequestOrTransactionId), redirectOptions);
        }
    }

    public executeTransfer(buildTransactionData: BuildTransferRequestDto,
                           redirectOptions?: RedirectOptions): Promise<SignerResult> {
        return this.executeProvidedTransaction(BuildSimpleTransactionRequest.fromData(buildTransactionData), redirectOptions);

    }

    public executeTokenTransfer(buildTransactionData: BuildTokenTransferRequestDto,
                                redirectOptions?: RedirectOptions): Promise<SignerResult> {
        return this.executeProvidedTransaction(BuildTokenTransferRequest.fromData(buildTransactionData), redirectOptions);
    }

    public executeNftTransfer(buildTransactionData: BuildNftTransferRequestDto,
                              redirectOptions?: RedirectOptions): Promise<SignerResult> {
        return this.executeProvidedTransaction(BuildNftTransferRequest.fromData(buildTransactionData), redirectOptions);
    }

    public executeGasTransfer(buildTransactionData: BuildGasTransferRequestDto,
                              redirectOptions?: RedirectOptions): Promise<SignerResult> {
        return this.executeProvidedTransaction(BuildGasTransferRequest.fromData(buildTransactionData), redirectOptions);
    }

    public executeContract(buildTransactionData: BuildContractExecutionRequestDto,
                           redirectOptions?: RedirectOptions): Promise<SignerResult> {
        return this.executeProvidedTransaction(BuildContractExecutionRequest.fromData(buildTransactionData), redirectOptions);
    }

    public executeSavedTransaction(transactionId: string,
                                   redirectOptions?: RedirectOptions) {
        return new Promise<SignerResult>((resolve,
                                          reject) => {
            Utils.http().postInForm(`${Utils.urls.connect}/transaction/execute/${transactionId}`, {}, this.bearerTokenProvider, redirectOptions);
            resolve();
        });
    }

    public resubmitTransaction(transactionId: string,
                               redirectOptions?: RedirectOptions): Promise<SignerResult> {
        return new Promise<SignerResult>((resolve,
                                          reject) => {
            Utils.http().postInForm(`${Utils.urls.connect}/transaction/resubmit/${transactionId}`, {}, this.bearerTokenProvider, redirectOptions);
            resolve();
        });
    }

    public cancelTransaction(transactionId: string,
                             redirectOptions?: RedirectOptions): Promise<SignerResult> {
        return new Promise<SignerResult>((resolve,
                                          reject) => {
            Utils.http().postInForm(`${Utils.urls.connect}/transaction/cancel/${transactionId}`, {}, this.bearerTokenProvider, redirectOptions);
            resolve();
        });
    }

    private executeProvidedTransaction(buildTransactionData: BuildTransferRequestBase,
                                       redirectOptions?: RedirectOptions) {
        return new Promise<SignerResult>((resolve,
                                          reject) => {
            Utils.http().postInForm(`${Utils.urls.connect}/transaction/execute`, buildTransactionData, this.bearerTokenProvider, redirectOptions);
            resolve();
        });
    }

    public sign(signatureRequest: GenericSignatureRequest,
                redirectOptions?: RedirectOptions): Promise<SignerResult> {
        return new Promise<SignerResult>((resolve,
                                          reject) => {
            Utils.http().postInForm(`${Utils.urls.connect}/transaction/sign/${signatureRequest.type.toLowerCase()}`, signatureRequest, this.bearerTokenProvider, redirectOptions);
            resolve();
        });
    }

    public signMessage(buildData: BuildMessageSignRequestDto,
                       redirectOptions?: RedirectOptions): Promise<SignerResult> {
        return this.signProvidedSignature(BuildMessageSignRequest.fromData(buildData), redirectOptions);
    }

    public signEip712(buildData: BuildEip712SignRequestDto,
                      redirectOptions?: RedirectOptions): Promise<SignerResult> {
        return this.signProvidedSignature(BuildEip712SignRequest.fromData(buildData), redirectOptions);
    }

    private signProvidedSignature(buildSignatureData: BuildSignRequestBase,
                                  redirectOptions?: RedirectOptions) {
        return new Promise<SignerResult>((resolve,
                                          reject) => {
            Utils.http().postInForm(`${Utils.urls.connect}/transaction/sign`, buildSignatureData, this.bearerTokenProvider, redirectOptions);
            resolve();
        });
    }

    /** Deprecated since v1.1.9: Use 'sign' instead. */
    public signTransaction(signatureRequest: GenericSignatureRequest,
                           redirectOptions?: RedirectOptions): Promise<SignerResult> {
        return this.sign(signatureRequest, redirectOptions);
    }

    public async importWallet(request: ImportWalletRequest,
                              redirectOptions?: RedirectOptions): Promise<SignerResult> {
        return this.confirm(ImportWalletRequest.fromData(request), redirectOptions);
    }

    public async confirm(request: ConfirmationRequest,
                         redirectOptions?: RedirectOptions): Promise<SignerResult> {
        return new Promise<SignerResult>((resolve,
                                          reject) => {
            Utils.http().postInForm(`${Utils.urls.connect}/confirm/${request.confirmationRequestType.toLowerCase()}`, request, this.bearerTokenProvider, redirectOptions);
            resolve();
        });
    }
}
