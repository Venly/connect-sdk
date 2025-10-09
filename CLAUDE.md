# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Venly Connect SDK is a JavaScript SDK for performing blockchain tasks through Venly's widget interface. It wraps Venly's functionalities in a JavaScript layer to handle operations that are otherwise restricted due to security implications (e.g., creating signatures).

**Main branch for PRs:** `develop` (not `main`)

## Build and Development Commands

```bash
# Clean build artifacts
npm run clean

# Build TypeScript to CommonJS (outputs to dist/)
npm run build-ts

# Build UMD bundle with Webpack (outputs to umd/)
npm run build-js

# Full build (clean + TypeScript + UMD)
npm run build

# Build and create tarball for testing
npm run build-and-pack

# Generate TypeDoc documentation
npm run typedoc
```

## Code Architecture

### Core Entry Point

- **src/index.ts**: Main entry point that exports all public APIs, models, and types. Uses CommonJS module system with ES5 target.

### Three-Layer Architecture

1. **VenlyConnect (src/connect/connect.ts)**: Main SDK class that orchestrates authentication, API access, and signing operations. Manages the Keycloak authentication instance and bearer token provider.

2. **Api (src/api/Api.ts)**: REST API wrapper for Venly backend. Handles all HTTP operations (wallets, profiles, transactions, contracts) using bearer token authentication.

3. **Signer (src/signer/)**: Strategy pattern implementation for transaction signing with two modes:
   - **PopupSigner**: Opens popup windows for signing operations
   - **RedirectSigner**: Uses full-page redirects for signing operations
   - Factory pattern via `SignerFactory.createSignerFor()`

### Key Components

**Flows (src/connect/Flows.ts)**: High-level user flows for authentication, wallet management, wallet linking/claiming, and KYC verification. Handles both POPUP and REDIRECT window modes.

**Security (src/connect/Security.ts)**: Manages Keycloak authentication, token refresh, and login/logout operations.

**Popup System (src/popup/)**: Infrastructure for handling popup window communication with the Venly Connect widget, including result handling and window lifecycle management.

**DialogWindow (src/dialog/)**: Modal dialog system for user interactions that don't require full popup windows.

### Models Structure

- **src/models/**: Type definitions for all API entities
  - **SecretType**: Blockchain types (ETHEREUM, MATIC, ARBITRUM, HEDERA, TRON, VECHAIN, etc.)
  - **transaction/**: Request/response models organized by blockchain (ethereum/, matic/, arbitrum/, hedera/, tron/, vechain/, bitcoin/, etc.)
  - **wallet/**: Wallet models including NFT, TokenBalance, WalletBalance
  - **contract/**: Contract interaction models
  - **profile/**: User profile models

### Window Modes

The SDK supports two interaction modes (WindowMode enum):
- **POPUP**: Opens widget in a popup window (default, better UX for modern apps)
- **REDIRECT**: Full-page redirect to widget (for environments where popups are blocked)
- **DIALOG**: Embedded modal dialog (used by authenticate flow by default)

## TypeScript Configuration

- Target: ES5
- Module: CommonJS
- Strict mode enabled
- Declaration files generated in dist/
- Path alias: `@/*` maps to `src/*`

## Build Output

- **dist/**: TypeScript compilation output (CommonJS, with .d.ts declaration files)
- **umd/**: Webpack UMD bundle for browser usage (accessible as `VenlyConnect` global)

## Release Process

Releases follow a three-branch workflow (develop → release → master):

1. On release branch: `npm version minor` (or major/patch) → `git push` → `git push --tags`
2. Merge release to master
3. On master: `npm install` → `npm run build` → `npm publish`
4. Backmerge master to develop
5. On develop: `npm version preminor --preid=develop --git-tag-version=false` → `git push`

## Key Implementation Patterns

- **Bearer Token Provider**: Function pattern `() => string` used throughout for authentication
- **Promise-based API**: All async operations return Promises
- **Factory Pattern**: `SignerFactory` creates appropriate signer based on WindowMode
- **Type Safety**: Strong TypeScript types with no `var` usage (use const/let)
- **Multi-chain Support**: Models are organized by blockchain type with shared interfaces where appropriate