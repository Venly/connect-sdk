import { KeycloakInstance } from 'keycloak-js';
import { Wallet }           from './wallet/Wallet';

export interface Account {
    wallets: Wallet[],
    auth: KeycloakInstance,
    isAuthenticated: boolean
}
