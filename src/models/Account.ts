import KeycloakType from '../types/keycloak';
import { Wallet }   from './wallet/Wallet';

export interface Account {
    wallets: Wallet[],
    auth: KeycloakType,
    isAuthenticated: boolean
}
