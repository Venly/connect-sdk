import Utils                       from '../utils/Utils';
import { SecretType }              from '../models/SecretType';
import { Wallet, WalletType }      from '../models/wallet/Wallet';
import { Profile }                 from '../models/profile/Profile';
import { WalletBalance }           from '../models/wallet/WalletBalance';
import { TokenBalance }            from '../models/wallet/TokenBalance';
import { NFT, WalletItems }        from '../models/wallet/NFT';
import { TransactionRequest }      from '..';
import { ContractReadRequest }     from '../models/contract/ContractReadRequest';
import { ContractReadResult }      from '../models/contract/ContractReadResult';
import { RestApiResponseTxStatus } from '../models/transaction/status/RestApiResponseTxStatus';
import { EvmTxInfo }               from '../models/transaction/status/EvmTxInfo';
import { TronTxInfo }              from '../models/transaction/status/TronTxInfo';
import { VechainTxInfo }           from '../models/transaction/status/VechainTxInfo';

export class Api {
    private _baseUrl: string;
    private _tokenProvider: any;

    constructor(baseURL: string, tokenProvider?: any) {
        this._baseUrl = baseURL.endsWith('/') ? baseURL.substring(0, baseURL.length - 1) : baseURL;
        this._tokenProvider = tokenProvider;
    }

    private async fetchGet<T>(url: string, queryParams?: any): Promise<T> {
        const bearerToken = this._tokenProvider();
        if (!bearerToken) {
            throw new Error('Not authenticated')
        }
        return await fetch(`${this._baseUrl}/${url}?${new URLSearchParams(queryParams).toString()}`, {
            headers: { Authorization: `Bearer ${bearerToken}` }
        }).then(response => response.json()).then(data => data as T);
    }

    private async fetchPost<T>(url: string, body?: any): Promise<T> {
        const bearerToken = this._tokenProvider();
        if (!bearerToken) {
            throw new Error('Not authenticated')
        }
        return await fetch(`${this._baseUrl}/${url}`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 
              Authorization: `Bearer ${bearerToken}`, 
              'Content-Type': 'application/json' 
            }
        }).then(response => response.json()).then(data => data as T);
    }

    private async fetchDelete<T>(url: string): Promise<T> {
        const bearerToken = this._tokenProvider();
        if (!bearerToken) {
            throw new Error('Not authenticated')
        }
        return await fetch(`${this._baseUrl}/${url}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${bearerToken}` }
        }).then(response => response.json()).then(data => data as T);
    }

    ////////////
    // Chains //
    ////////////
    public getAvailableSecretTypes = (): Promise<SecretType[]> => {
        const response = this.fetchGet<SecretType[]>(`chains`);
        return this.processResponse<SecretType[]>(response);
    };

    ////////////
    // Wallet //
    ////////////
    public getWallets = (params?: { secretType?: SecretType, walletType?: WalletType, includeBalance?: boolean }): Promise<Wallet[]> => {
        params = (params && Utils.removeNulls(params)) || {};
        const response = this.fetchGet<Wallet[]>('wallets', params);
        return this.processResponse<Wallet[]>(response);
    };

    public getWallet = (walletId: string): Promise<Wallet> => {
        const response = this.fetchGet<Wallet>(`wallets/${walletId}`);
        return this.processResponse<Wallet>(response);
    };

    public getBalance = (walletId: string): Promise<WalletBalance> => {
        const response = this.fetchGet<WalletBalance>(`wallets/${walletId}/balance`);
        return this.processResponse<WalletBalance>(response);
    };

    public getBalanceByAddress = (secretType: SecretType, walletAddress: string): Promise<WalletBalance> => {
        const response = this.fetchGet<WalletBalance>(`wallets/${secretType}/${walletAddress}/balance`);
        return this.processResponse<WalletBalance>(response);
    };

    public getTokenBalances = (walletId: string): Promise<TokenBalance[]> => {
        const response = this.fetchGet<TokenBalance[]>(`wallets/${walletId}/balance/tokens`);
        return this.processResponse<TokenBalance[]>(response);
    };

    public getTokenBalancesByAddress = (secretType: SecretType, walletAddress: string): Promise<TokenBalance[]> => {
        const response = this.fetchGet<TokenBalance[]>(`wallets/${secretType}/${walletAddress}/balance/tokens`);
        return this.processResponse<TokenBalance[]>(response);
    };

    public getTokenBalance = (walletId: string,
                              tokenAddress: string): Promise<TokenBalance> => {
        const response = this.fetchGet<TokenBalance>(`wallets/${walletId}/balance/tokens/${tokenAddress}`);
        return this.processResponse<TokenBalance>(response);
    };

    public getTokenBalanceByAddress = (secretType: SecretType, walletAddress: string,
                              tokenAddress: string): Promise<TokenBalance> => {
        const response = this.fetchGet<TokenBalance>(`wallets/${secretType}/${walletAddress}/balance/tokens/${tokenAddress}`);
        return this.processResponse<TokenBalance>(response);
    };

    public getNonfungibles = (walletId: string): Promise<NFT[]> => {
        const response = this.fetchGet<NFT[]>(`wallets/${walletId}/nonfungibles`);
        return this.processResponse<NFT[]>(response);
    };

    public getNonfungiblesByAddress = (secretType: SecretType, walletAddress: string): Promise<NFT[]> => {
        const response = this.fetchGet<NFT[]>(`wallets/${secretType}/${walletAddress}/nonfungibles`);
        return this.processResponse<NFT[]>(response);
    };

    public getAllNonfungibles = (secretTypes?: SecretType[]): Promise<WalletItems[]> => {
        const queryParams: string = secretTypes && secretTypes.length > 0
            ? "?" + secretTypes.map(st => "secretType=" + st).join("&")
            : "";
        const response = this.fetchGet<WalletItems[]>(`wallets/nonfungibles`, queryParams);
        return this.processResponse<WalletItems[]>(response);
    };

    public unlink = (walletId: string): Promise<void> => {
        const response = this.fetchGet<void>(`wallets/${walletId}/link`);
        return this.processResponse<void>(response);
    };

    /////////////
    // Profile //
    /////////////
    public getProfile = (): Promise<Profile> => {
        const response = this.fetchGet<Profile>('profile');
        return this.processResponse<Profile>(response);
    };

    private processResponse<T>(responsePromise: Promise<T>): Promise<T> {
        return new Promise<T>((resolve: any,
                               reject: any) => {
            responsePromise.then((response: any) => {
                            if (response.success) {
                                if (response.result) {
                                    resolve(response.result);
                                } else {
                                    resolve();
                                }
                            } else {
                                reject(response.errors)
                            }
                        })
                        .catch((error) => {
                            if (error.response && error.response.data) {
                                reject(error.response.data.errors);
                            } else if (error.message) {
                                let code = error.message.indexOf('authenticat') >= 0 ? 'auth.error' : 'unknown.error';
                                reject([{code: code, message: error.message}]);
                            } else {
                                reject([{code: 'unknown.error', message: 'An unknown error occured'}]);
                            }
                        });
        });
    }

    //////////////////
    // Transactions //
    //////////////////
    public getPendingTransactions = (): Promise<TransactionRequest[]> => {
        const response = this.fetchGet<TransactionRequest[]>('transactions');
        return this.processResponse<TransactionRequest[]>(response);
    };

    public deleteTransaction = (transactionId: string): Promise<any> => {
        const response = this.fetchDelete<any>(`transactions/${transactionId}`);
        return this.processResponse<any>(response);
    };

    public getTransactionStatus = (transactionHash: string,
                                   secretType: SecretType): Promise<RestApiResponseTxStatus> => {
        const response = this.fetchGet<RestApiResponseTxStatus>(`transactions/${secretType}/${transactionHash}/status`);
        return this.mapTransactionData(secretType, response);
    };

    private mapTransactionData = (secretType: SecretType,response: any): Promise<RestApiResponseTxStatus> => {
        switch (secretType) {
            case SecretType.AVAC || SecretType.BSC || SecretType.ETHEREUM || SecretType.GOCHAIN || SecretType.MATIC || SecretType.ARBITRUM:
                return this.processResponse<EvmTxInfo>(response);
            case SecretType.TRON:
                return this.processResponse<TronTxInfo>(response);
            case SecretType.VECHAIN:
                return this.processResponse<VechainTxInfo>(response);
            default:
                return this.processResponse<RestApiResponseTxStatus>(response);
        }
    }

    ///////////////
    // Contracts //
    ///////////////
    public readContract = (contractReadRequest: ContractReadRequest): Promise<ContractReadResult> => {
        const response = this.fetchPost<ContractReadResult>('contracts/read', contractReadRequest);
        return this.processResponse<ContractReadResult>(response);
    };
}

export interface RestApiResponseError {
    code: string;
    message: string;
}

export interface RestApiResponse<T> {
    success: boolean;
    errors: RestApiResponseError[];
    result: T;
}
