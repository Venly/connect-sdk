# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Removed
- **BREAKING:** Hedera transaction and signature requests, as Venly no longer supports Hedera. `SecretType.HEDERA` is kept for existing wallets. Removed:
  - `HederaTokenAssociationTransactionRequest` (root export)
  - `TransactionRequestType` entries `HBAR_TRANSFER`, `HEDERA_TOKEN_TRANSFER`, `HEDERA_NFT_TRANSFER`, `HEDERA_TOKEN_ASSOCIATION`, `HEDERA_APPROVE_ALLOWANCE`
  - `SignatureRequestType` entries `HEDERA_HBAR_TRANSFER`, `HEDERA_RAW`
  - Deep-importable from `dist/`: `HbarTransferTransactionRequest`, `HederaTokenTransferTransactionRequest`, `HederaNftTransferTransactionRequest`, the `HederaApproveAllowanceTransactionRequest` module (its class was misnamed `HederaTokenAssociationTransactionRequest`) with `AllowanceType`, and `HederaTxInfo` with `HederaTransfer` and `HederaTokenTransfer`
- Removing these exports requires a major version bump.

## [2.4.0]
### Added
- Preload fonts when `VenlyConnect` is initialized in order to minimize font/layout shifting.

### Fixed
- Fix issue with `getAccount()` always triggering authentication

## [2.3.1]
### Fixed
- Fix issue with authentication popup staying open during `getAccount()`

## [2.3.0]
### Added
- New modals for all actions in `VenlyConnect.flows`. 
  - Users must click on the modal to initiate the popup. This should prevent issues with popup blocking.

## [2.0.0]
### Added
- Redesign login flow + new UI
- Add `options.authenticationOptions.closePopup` option. If set to false, Venly popup will be kept open after authenticating.
  - For cases when you need to perform an action immediately after authenticating (such as signing a message)

### Changed
- **BREAKING:** All types/objects are now imported directly from `@venly/connect` instead of `@venly/connect/dist/src`
- **BREAKING:** Change filepath for head script tags
  - To use with npm install: `<script src="/node_modules/@venly/connect/umd/index.js"></script>`
  - To use directly from a CDN: `<script src="https://unpkg.com/@venly/connect/umd/index.js"></script>`

### Removed
- 

### Fixed
- Fix `readContract` method to use the correct `Content-Type` header
