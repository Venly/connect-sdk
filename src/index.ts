import { VenlyConnect } from './connect/connect';

export * from './api/Api';
export * from './connect/connect';

export { Account }                              from './models/Account';
export { ConfirmationRequest }                  from './models/ConfirmationRequest';
export { ConfirmationRequestType }              from './models/ConfirmationRequestType';
export { Network }                              from './models/Network';
export { RequestDataType }                      from './models/RequestDataType';
export { SecretType }                           from './models/SecretType';
export { SignatureRequestType }                 from './models/SignatureRequestType';
export { TransactionRequestType }               from './models/TransactionRequestType';
export { WindowMode }                           from './models/WindowMode';

export { ContractReadRequest }                  from './models/contract/ContractReadRequest';
export { ContractReadRequestInputParam }        from './models/contract/ContractReadRequestInputParam';
export { ContractReadRequestOutputParam }       from './models/contract/ContractReadRequestOutputParam';
export { ContractReadResult }                   from './models/contract/ContractReadResult';

export * from './models/profile/Profile';

export { GenericSignatureRequest }              from './models/transaction/GenericSignatureRequest';
export { TransactionRequest }                   from './models/transaction/TransactionRequest';
export { TransactionResult }                    from './models/transaction/TransactionResult';
export { TxStatus }                             from './models/transaction/TxStatus';

export { BuildTransactionRequest }              from './models/transaction/build/BuildTransactionRequest';
export { BuildContractExecutionRequestDto }     from './models/transaction/build/BuildContractExecutionRequestDto';
export { BuildTransferRequestDto }              from './models/transaction/build/BuildTransferRequestDto';
export { BuildTokenTransferRequestDto }         from './models/transaction/build/BuildTokenTransferRequestDto';
export { BuildGasTransferRequestDto }           from './models/transaction/build/BuildGasTransferRequestDto';

export *                                        from './models/transaction/ethereum/request/EthereumContractCallExecutionRequest';
export { EthereumErc20TransactionRequest }      from './models/transaction/ethereum/request/EthereumErc20TransactionRequest';
export { EthereumErc721TransactionRequest }     from './models/transaction/ethereum/request/EthereumErc721TransactionRequest';
export { EthereumErcTokenTransactionRequest }   from './models/transaction/ethereum/request/EthereumErcTokenTransactionRequest';
export { EthereumTransactionRequest }           from './models/transaction/ethereum/request/EthereumTransactionRequest';

export { GochainErc20TransactionRequest }       from './models/transaction/gochain/request/GochainErc20TransactionRequest';
export { GochainTransactionRequest }            from './models/transaction/gochain/request/GochainTransactionRequest';

export *                                        from './models/transaction/matic/request/MaticContractCallExecutionRequest';
export { MaticErc20TransactionRequest }         from './models/transaction/matic/request/MaticErc20TransactionRequest';
export { MaticErc721TransactionRequest }        from './models/transaction/matic/request/MaticErc721TransactionRequest';
export { MaticErcTokenTransactionRequest }      from './models/transaction/matic/request/MaticErcTokenTransactionRequest';
export { MaticTransactionRequest }              from './models/transaction/matic/request/MaticTransactionRequest';

export *                                        from './models/transaction/arbitrum/request/ArbitrumContractCallExecutionRequest';
export { ArbitrumErc20TransactionRequest }      from './models/transaction/arbitrum/request/ArbitrumErc20TransactionRequest';
export { ArbitrumErc721TransactionRequest }     from './models/transaction/arbitrum/request/ArbitrumErc721TransactionRequest';
export { ArbitrumErcTokenTransactionRequest }   from './models/transaction/arbitrum/request/ArbitrumErcTokenTransactionRequest';
export { ArbitrumTransactionRequest }           from './models/transaction/arbitrum/request/ArbitrumTransactionRequest';

export *                                        from './models/transaction/tron/request/TronContractCallExecutionRequest';
export { TronTransactionRequest }               from './models/transaction/tron/request/TronTransactionRequest';

export { VechainContractCallExecutionRequest }  from './models/transaction/vechain/request/VechainContractCallExecutionRequest';
export *                                        from './models/transaction/vechain/request/VechainExecutableContractCall';
export *                                        from './models/transaction/vechain/request/VechainTransactionRequest';
export *                                        from './models/transaction/vechain/request/VechainVip180TransactionRequest';

export { BitcoinTransactionRequest }            from './models/transaction/bitcoin/request/BitcoinTransactionRequest';
export { LitecoinTransactionRequest }           from './models/transaction/litecoin/request/LitecoinTransactionRequest';

export { CreateApplicationWalletRequest }       from './models/wallet/CreateApplicationWalletRequest';
export { CreateFirstWalletRequest }             from './models/wallet/CreateFirstWalletRequest';
export { CreateWalletRequest }                  from './models/wallet/CreateWalletRequest';
export { ImportWalletRequest }                  from './models/wallet/ImportWalletRequest';
export *                                        from './models/wallet/NFT';
export { TokenBalance }                         from './models/wallet/TokenBalance';
export *                                        from './models/wallet/Wallet';
export { WalletBalance }                        from './models/wallet/WalletBalance';

export { PopupActions }                         from './popup/PopupActions';
export { PopupResult }                          from './popup/PopupResult';

export * from './signer/PopupSigner';
export * from './signer/RedirectSigner';
export * from './signer/Signer';

export { EventTypes } from './types/EventTypes';

if (typeof window !== 'undefined') {
    (window as any).VenlyConnect = VenlyConnect;
}
