import { KeycloakInstance } from 'keycloak-js';

import { LoginResult, Security }             from './Security';
import { Api }                               from '../api/Api';
import { WindowMode }                        from '../models/WindowMode';
import { PopupResult }                       from '../popup/PopupResult';
import { PopupSigner }                       from '../signer/PopupSigner';
import { Signer, SignerFactory, SignMethod } from '../signer/Signer';
import Utils                                 from '../utils/Utils';
import { Flows }                             from './Flows';
import { PopupOptions }                      from '../popup/Popup';
import { DialogWindow }                      from '../dialog/DialogWindow';

export class VenlyConnect {

    public api!: Api;
    public signUsing: WindowMode;
    public flows: Flows;
    public windowMode: WindowMode;
    public useOverlayWithPopup: boolean;
    public _bearerTokenProvider: () => string;
    public loginResult?: LoginResult;

    private clientId: string;
    private auth?: KeycloakInstance;

    constructor(clientId: string,
                options?: ConstructorOptions) {
        this.clientId = clientId;
        this.windowMode = (options && options.windowMode) || WindowMode.POPUP;
        this.signUsing = (options && options.signUsing as unknown as WindowMode) || this.windowMode;
        this.useOverlayWithPopup = (options && options.useOverlayWithPopup != undefined) ? options.useOverlayWithPopup : true;
        Utils.rawEnvironment = options && options.environment || 'prod';
        this._bearerTokenProvider = options && options.bearerTokenProvider || (() => this.loginResult && this.loginResult.authenticated && this.auth && this.auth.token || '');
        if (this._bearerTokenProvider) {
            this.api = new Api(Utils.urls.api, this._bearerTokenProvider);
        }

        this.flows = new Flows(this, this.clientId);
        DialogWindow.addFonts();
    }

    public get signer() {
        return SignerFactory.createSignerFor(this.windowMode, this._bearerTokenProvider, this.clientId, {useOverlay: this.useOverlayWithPopup});
    }

    public async checkAuthenticated(options?: AuthenticationOptions): Promise<AuthenticationResult> {
        if (this.loginResult) {
            return this.afterAuthentication(this.loginResult);
        } else {
            const authOptions: AuthenticationOptions = {...options};
            authOptions.windowMode = authOptions.windowMode || this.windowMode;
            const loginResult = await Security.checkAuthenticated(this.clientId, authOptions);
            return this.afterAuthentication(loginResult);
        }

    }

    public logout(options?: AuthenticationOptions): Promise<void> {
        this.loginResult = undefined;
        const windowMode = options && options.windowMode || this.windowMode;
        if (windowMode === WindowMode.REDIRECT) {
            return new Promise<void>((resolve: any,
                                      reject: any) => {

                const logoutOptions: Record<string, string> = {};
                if (this.auth) {
                    if (options && options.redirectUri) {
                        logoutOptions.post_logout_redirect_uri = options.redirectUri;
                    }
                    if (this.auth.clientId) {
                        logoutOptions.client_id = this.auth.clientId;
                    }
                    if (this.auth.idToken) {
                        logoutOptions.id_token_hint = this.auth.idToken;
                    }
                    const searchParams = new URLSearchParams(logoutOptions).toString();
                    const logoutURL = `${Utils.urls.login}/realms/Arkane/protocol/openid-connect/logout`

                    Utils.openExternalUrl(searchParams ? `${logoutURL}?${searchParams}` : logoutURL);
                } else {
                    if (options && options.redirectUri) {
                        Utils.openExternalUrl(options.redirectUri);
                    } else {
                        resolve();
                    }
                }
            })
        } else {
            if (this.auth) {
                return Security.logout(this.auth).then(() => this.auth = undefined);
            } else {
                return Promise.resolve()
            }
        }
    }

    public addOnTokenRefreshCallback(tokenRefreshCallback?: (token: string) => void): void {
        if (tokenRefreshCallback) {
            Security.onTokenUpdate = tokenRefreshCallback;
        }
    }

    /* Deprecated - Use VenlyConnect.signer directly instead */
    public createSigner(windowMode?: WindowMode,
                        popupOptions?: PopupOptions): Signer {
        if (!popupOptions || popupOptions.useOverlay == undefined) {
            popupOptions = {useOverlay: this.useOverlayWithPopup}
        }
        return SignerFactory.createSignerFor(windowMode || this.signUsing || this.windowMode, this._bearerTokenProvider, this.clientId, popupOptions);
    }

    public isPopupSigner(signer: Signer): signer is PopupSigner {
        return typeof (<PopupSigner>signer).closePopup !== 'undefined';
    }

    /* Deprecated - Use flows.authenticate instead */
    public async authenticate(options?: AuthenticationOptions): Promise<AuthenticationResult> {
        return this.flows.authenticate(options);
    }

    /* Deprecated - Use flows.manageWallets instead */
    public manageWallets(chain: string,
                         options?: { redirectUri?: string, correlationID?: string, windowMode?: WindowMode }): Promise<PopupResult | void> {
        return this.flows.manageWallets(chain, options);
    }

    /* Deprecated - Use flows.linkWallets instead */
    public linkWallets(options?: { redirectUri?: string, correlationID?: string, windowMode?: WindowMode }): Promise<PopupResult | void> {
        return this.flows.linkWallets(options);
    }

    public _afterAuthenticationForFlowUse(loginResult: LoginResult): AuthenticationResult {
        return this.afterAuthentication(loginResult);
    }

    private afterAuthentication(loginResult: LoginResult): AuthenticationResult {
        // this.auth is needed for the bearerTokenProvider
        this.loginResult = loginResult;
        this.auth = loginResult.keycloak;
        return {
            auth: this.auth,
            isAuthenticated: loginResult.authenticated,
            authenticated(this: AuthenticationResult,
                          callback: (auth: KeycloakInstance) => void) {
                if (loginResult.authenticated && loginResult.keycloak) {
                    callback(loginResult.keycloak);
                }
                return this;
            },
            notAuthenticated(this: AuthenticationResult,
                             callback: (auth?: KeycloakInstance) => void) {
                if (!loginResult.authenticated) {
                    callback(loginResult.keycloak);
                }
                return this;
            },
        };
    }
}

export interface AuthenticationResult {
    auth?: KeycloakInstance,
    isAuthenticated: boolean,
    authenticated: (onAuthenticated: (auth: KeycloakInstance) => void) => AuthenticationResult;
    notAuthenticated: (onNotAuthenticated: (auth?: KeycloakInstance) => void) => AuthenticationResult;
}

export interface ConstructorOptions {
    chains?: string[];
    environment?: string;
    windowMode?: WindowMode;
    signUsing?: SignMethod; // Deprecated, use WindowMode
    bearerTokenProvider?: () => string;
    useOverlayWithPopup?: boolean;
}

export interface AuthenticationOptions {
    redirectUri?: string;
    windowMode?: WindowMode;
    closePopup?: boolean
    idpHint?: 'password' | string;
    emailHint?: string;
    forcePopup?: boolean;
}
