import { ArkaneConnect, SecretType, SignatureRequestType, SignMethod, Wallet, WindowMode } from "@arkane-network/arkane-connect"
import { EIP712TypedData, PartialTxParams }                                                from "@0x/subproviders";
import { BaseWalletSubprovider }                                                           from "@0x/subproviders/lib/src/subproviders/base_wallet_subprovider";
import { ArkaneSubProviderOptions }                                                        from "./index";
import { ConstructorOptions }                                                              from '@arkane-network/arkane-connect/dist/src/connect/connect';

export class ArkaneSubProvider extends BaseWalletSubprovider {

    readonly arkaneConnect: ArkaneConnect;
    private wallets: Wallet[] = [];

    constructor(options: ArkaneSubProviderOptions) {
        super();
        const connectConstructorOptions: ConstructorOptions = {
            environment: options.environment || 'production',
            bearerTokenProvider: options.bearerTokenProvider,
        };
        if (options.signMethod) {
            Object.assign(connectConstructorOptions, {signUsing: options.signMethod == 'POPUP' ? SignMethod.POPUP : SignMethod.REDIRECT});
        }
        if (options.windowMode) {
            Object.assign(connectConstructorOptions, {windowMode: options.windowMode == 'POPUP' ? WindowMode.POPUP : WindowMode.REDIRECT});
        }
        this.arkaneConnect = new ArkaneConnect(options.clientId, connectConstructorOptions);
    }

    public async loadData() {
        const currentClass = this;
        return this.arkaneConnect.api.getWallets({secretType: SecretType.ETHEREUM})
                   .then(returnedWallets => {
                       currentClass.wallets = returnedWallets;
                   });
    }

    /**
     * Retrieve the accounts associated with the eth-lightwallet instance.
     * This method is implicitly called when issuing a `eth_accounts` JSON RPC request
     * via your providerEngine instance.
     *
     * @return An array of accounts
     */
    public async getAccountsAsync(): Promise<string[]> {
        return this.loadData()
                   .then(() => {
                       return this.wallets.map((wallet) => wallet.address)
                   });
    }

    /**
     * Signs a transaction with the account specificed by the `from` field in txParams.
     * If you've added this Subprovider to your app's provider, you can simply send
     * an `eth_sendTransaction` JSON RPC request, and this method will be called auto-magically.
     * If you are not using this via a ProviderEngine instance, you can call it directly.
     * @param txParams Parameters of the transaction to sign
     * @return Signed transaction hex string
     */
    public async signTransactionAsync(txParams: PartialTxParams): Promise<string> {
        let signer = this.arkaneConnect.createSigner();
        return signer.signTransaction(this.constructEthereumTransationSignatureRequest(txParams))
                     .then((result) => {
                         if (result.status === 'SUCCESS') {
                             return result.result.signedTransaction;
                         } else {
                             throw new Error((result.errors && result.errors.join(", ")));
                         }
                     });
    }

    private constructEthereumTransationSignatureRequest(txParams: PartialTxParams) {
        console.debug(txParams);
        const retVal = {
            gasPrice: txParams.gasPrice ? parseInt(txParams.gasPrice, 16) : txParams.gasPrice,
            gas: txParams.gas ? parseInt(txParams.gas, 16) : txParams.gas,
            to: txParams.to,
            nonce: txParams.nonce ? parseInt(txParams.nonce, 16) : txParams.nonce,
            data: (txParams.data) || '0x',
            value: txParams.value ? parseInt(txParams.value, 16) : 0,
            submit: false,
            type: SignatureRequestType.ETHEREUM_TRANSACTION,
            walletId: this.getWalletIdFrom(txParams.from)
        };
        return retVal;
    }

    /**
     * Sign a personal Ethereum signed message. The signing account will be the account
     * associated with the provided address.
     * If you've added this Subprovider to your app's provider, you can simply send an `eth_sign`
     * or `personal_sign` JSON RPC request, and this method will be called auto-magically.
     * If you are not using this via a ProviderEngine instance, you can call it directly.
     * @param data Hex string message to sign
     * @param address Address of the account to sign with
     * @return Signature hex string (order: rsv)
     */
    public async signPersonalMessageAsync(data: string, address: string): Promise<string> {
        const signer = this.arkaneConnect.createSigner();
        return signer.signTransaction({
                         type: SignatureRequestType.ETHEREUM_RAW,
                         walletId: this.getWalletIdFrom(address),
                         data: data
                     })
                     .then((result) => {
                         if (result.status === 'SUCCESS') {
                             return result.result.signature;
                         } else {
                             throw new Error((result.errors && result.errors.join(", ")));
                         }
                     });
    }

    /**
     * Sign an EIP712 Typed Data message. The signing address will associated with the provided address.
     * If you've added this Subprovider to your app's provider, you can simply send an `eth_signTypedData`
     * JSON RPC request, and this method will be called auto-magically.
     * If you are not using this via a ProviderEngine instance, you can call it directly.
     * @param address Address of the account to sign with
     * @param data the typed data object
     * @return Signature hex string (order: rsv)
     */
    public async signTypedDataAsync(address: string, typedData: EIP712TypedData): Promise<string> {
        return Promise.reject('Not implemented yet');
    }

    private getWalletIdFrom(address: string):
        string {
        let foundWallet = this.wallets.find((wallet) => {
            return wallet.address === address;
        });
        return (foundWallet && foundWallet.id) || '';
    }
}
