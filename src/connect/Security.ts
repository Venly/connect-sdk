import { KeycloakConfig, KeycloakInitOptions, KeycloakInstance, KeycloakLoginOptions } from 'keycloak-js';

import { AuthenticationOptions } from './connect';
import { WindowMode }            from '../models/WindowMode';
import { PopupWindowAsync }      from '../popup/PopupWindowAsync';
import { EventTypes }            from '../types/EventTypes';
import Utils                     from '../utils/Utils';
import { DialogWindow }          from '../dialog/DialogWindow';

export class Security {

    public static onTokenUpdate: (token: string) => void;

    public static getConfig(clientId: string): any {
        return {
            'clientId': clientId,
            'realm': 'Arkane',
            'url': Utils.urls.login,
            'ssl-required': 'external',
            'public-client': 'true',
        };
    }

    public static login(clientId: string,
                        options?: AuthenticationOptions,
                        cid?: string): Promise<LoginResult> {
        if (options && options.idpHint && (options.idpHint === 'twitter' || options.idpHint === 'facebook')) {
            options.idpHint = 'arkane-' + options.idpHint;
        }
        switch (options && options.windowMode) {
            case WindowMode.POPUP:
                return Security.loginPopup(clientId, !!cid ? cid : Utils.uuidv4(), options);
            case WindowMode.DIALOG:
                return DialogWindow.openLoginDialog(clientId, options);
            default:
                return Security.loginRedirect(clientId, options);
        }
    }

    private static loginRedirect(clientId: string,
                                 options?: AuthenticationOptions): Promise<LoginResult> {
        let config = Security.getConfig(clientId);
        const loginOptions: KeycloakLoginOptions = {};
        if (options) {
            if (options.idpHint) {
                loginOptions.idpHint = options.idpHint;
                if (options.idpHint === 'password' && options.emailHint) {
                    loginOptions.loginHint = options.emailHint;
                }
            }
            if (options.redirectUri) {
                loginOptions.redirectUri = options.redirectUri;
            }
        }
        return this.keycloakLogin(config, loginOptions);
    }

    private static loginPopup(clientId: string,
                              cid: string,
                              options?: AuthenticationOptions): Promise<LoginResult> {
        const closePopup = options ? options.closePopup : true;
        return Promise.race([
            Security.initialiseAuthenticatedListener(clientId, EventTypes.AUTHENTICATE, cid, closePopup),
            Security.initialiseLoginPopup(clientId, cid, options),
        ]);
    }

    public static checkAuthenticated(clientId: string, options: AuthenticationOptions): Promise<LoginResult> {
        if ((options && options.windowMode) === WindowMode.REDIRECT) {
            const initOptions: KeycloakInitOptions = {
                onLoad: 'check-sso',
                checkLoginIframe: false,
            };
            if (options.redirectUri) {
                initOptions.redirectUri = options.redirectUri;
            }
            return Security.initKeycloak(Security.getConfig(clientId), initOptions);
        } else {
            const authenticatedPromise = Security.initialiseAuthenticatedListener(clientId, EventTypes.CHECK_AUTHENTICATED, Utils.uuidv4());
            Security.initialiseCheckAuthenticatedIFrame(clientId);
            return authenticatedPromise
        }
    }

    public static logout(auth: Keycloak.KeycloakInstance): Promise<void> {
        if (auth.authenticated && auth.clientId) {
            return new Promise<void>(async (resolve: () => void,
                                            reject: (reason?: any) => void) => {
                if (auth.clientId) {
                    const params: any = {
                        client_id: auth.clientId,
                        id_token_hint: auth.idToken
                    };

                    const searchParams = Object.keys(params).map((key) => {
                        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
                    }).join('&');

                    await fetch(Utils.urls.login + '/realms/Arkane/protocol/openid-connect/logout', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                        },
                        body: searchParams
                    });

                    Security.logoutListener = await Security.createLogoutListener(EventTypes.LOGOUT, auth, resolve, reject);
                    window.addEventListener('message', Security.logoutListener);
                    Security.initialiseLogoutIFrame(auth.clientId);
                }
            });
        } else {
            return Promise.resolve();
        }
    }

    public static hasPopupWindow() {
        return !!this.popupWindow;
    }

    public static closePopupWindow() {
        if (Security.popupWindow && !Security.popupWindow.closed) {
            Security.popupWindow.close();
            delete Security.popupWindow;
        }
    }

    public static focusPopupWindow() {
        if (Security.popupWindow && !Security.popupWindow.closed) {
            Security.popupWindow.focus();
        }
    }

    private static keycloak: KeycloakInstance;

    private static updateTokenInterval: any;
    private static authenticatedListeners: Map<EventTypes, any> = new Map<EventTypes, any>();
    private static popupWindow: PopupWindowAsync;
    private static logoutListener: any;
    private static isLoginPopupClosedInterval?: any;

    private static readonly AUTH_IFRAME_ID = 'venly-auth-iframe';
    private static readonly LOGOUT_IFRAME_ID = 'venly-logout-iframe';

    private static readonly THIRD_PARTY_COOKIES_DISABLED = 'Third party cookies are disabled';

    private static get checkAuthenticatedURI() {
        return `${Utils.urls.connect}/checkAuthenticated`;
    }

    private static get authenticateURI() {
        return `${Utils.urls.connect}/authenticate`;
    }

    private static get logoutURI() {
        return `${Utils.urls.connect}/logout`;
    }

    private static initialiseAuthenticatedListener = async function(clientId: string,
                                                                    eventType: EventTypes,
                                                                    cid: string,
                                                                    closePopup?: boolean) {
        return new Promise((resolve: (value: LoginResult) => void,
                            reject: any) => {
            const newListener = async (message: MessageEvent) => {
                if (message && message.origin === Utils.urls.connect) {
                    if (message.data && message.data.type === eventType) {
                        const auth = message.data;
                        if (Security.isLoginPopupClosedInterval) {
                            Security.clearIsLoginPopupClosedInterval();
                        }
                        try {
                            if (auth.success) {
                                if (auth.authenticated) {
                                    Security.cleanUp(eventType, cid, closePopup);
                                    const keycloakResult = auth.keycloak;
                                    const initOptions: KeycloakInitOptions = {
                                        onLoad: 'check-sso',
                                        token: keycloakResult.token,
                                        refreshToken: keycloakResult.refreshToken,
                                        idToken: keycloakResult.idToken,
                                        timeSkew: keycloakResult.timeSkew,
                                        checkLoginIframe: false,
                                    };
                                    // Remove the login state from the URL when tokens are already present (the checkAuthenticated iframe already handled it)
                                    Security.removeLoginState();
                                    const loginResult = await Security.initKeycloak(Security.getConfig(clientId), initOptions);
                                    resolve({
                                        keycloak: loginResult.keycloak,
                                        authenticated: loginResult.authenticated,
                                    })
                                } else {
                                    resolve({authenticated: false});
                                }
                            } else if (auth.reason && auth.reason === Security.THIRD_PARTY_COOKIES_DISABLED) {
                                const loginResult = await Security.initKeycloak(Security.getConfig(clientId), {onLoad: 'check-sso', checkLoginIframe: false});
                                resolve({
                                    keycloak: loginResult.keycloak,
                                    authenticated: loginResult.authenticated,
                                })
                            } else {
                                reject({error: auth.reason});
                            }
                        } catch (e) {
                            reject({error: e});
                        }
                    }
                    return message;
                }
            };

            window.addEventListener('message', newListener);
            if (Security.authenticatedListeners.has(eventType)) {
                window.removeEventListener('message', Security.authenticatedListeners.get(eventType));
            }
            Security.authenticatedListeners.set(eventType, newListener);
        });
    };

    private static createLogoutListener = async function(eventType: EventTypes,
                                                         auth: Keycloak.KeycloakInstance,
                                                         resolve: () => void,
                                                         reject: any) {
        return (message: MessageEvent) => {
            if (message && message.origin === Utils.urls.connect && message.data && message.data.type === eventType) {
                if (auth.authenticated) {
                    if (!message.data.authenticated) {
                        auth.onAuthLogout && auth.onAuthLogout();
                        resolve();
                    } else {
                        reject();
                    }
                } else {
                    resolve();
                }
            }
        }
    };

    private static async initialiseLoginPopup(clientId: string,
                                              cid: string,
                                              options?: AuthenticationOptions): Promise<LoginResult> {
        const origin = window.location.href.replace(window.location.search, '');
        let url = `${Security.authenticateURI}?${new URLSearchParams({clientId: clientId, origin: origin, env: Utils.rawEnvironment}).toString()}`;
        if (options && options.idpHint) {
            let kcIdpHint = options.idpHint;
            url += "&" + new URLSearchParams({kc_idp_hint: kcIdpHint}).toString();
        }
        if (options
            && options.emailHint
            && options.idpHint === 'password') {
            const loginHint = options.emailHint;
            url += "&" + new URLSearchParams({login_hint: loginHint}).toString();
        }
        this.popupWindow = await PopupWindowAsync.openNew(url, cid, {useOverlay: false});
        return Security.initialiseIsLoginPopupClosedInterval(cid);
    }

    private static initialiseIsLoginPopupClosedInterval(cid: string): Promise<LoginResult> {
        return new Promise((resolve: (value: LoginResult) => void,
                            reject: any) => {
            Security.isLoginPopupClosedInterval = window.setInterval(() => {
                let popupWindow = Security.popupWindow;
                if (popupWindow && popupWindow.closed) {
                    Security.clearIsLoginPopupClosedInterval();
                    Security.cleanUp(EventTypes.AUTHENTICATE, cid);
                    resolve({authenticated: false});
                }
            }, 2000);
        });
    }

    private static clearIsLoginPopupClosedInterval() {
        clearInterval(Security.isLoginPopupClosedInterval);
        delete Security.isLoginPopupClosedInterval;
    }

    private static initialiseCheckAuthenticatedIFrame(clientId: string): HTMLIFrameElement {
        return this.initialiseIFrame(clientId, Security.AUTH_IFRAME_ID, Security.checkAuthenticatedURI);
    }

    private static initialiseLogoutIFrame(clientId: string): HTMLIFrameElement {
        return this.initialiseIFrame(clientId, Security.LOGOUT_IFRAME_ID, Security.logoutURI);
    }

    private static initialiseIFrame(clientId: string,
                                    iframeID: string,
                                    uri: string): HTMLIFrameElement {
        let iframe = document.getElementById(iframeID) as HTMLIFrameElement;
        let isIframeInBody = true;
        if (!iframe) {
            isIframeInBody = false;
            iframe = document.createElement('iframe') as HTMLIFrameElement;
        }

        const origin = window.location.href.replace(window.location.search, '');
        iframe.src = `${uri}?${new URLSearchParams({clientId: clientId, origin: origin, env: Utils.rawEnvironment}).toString()}`;
        iframe.hidden = true;
        iframe.id = iframeID;
        iframe.setAttribute('style', 'display: none!important;');
        document.body.appendChild(iframe);
        if (!isIframeInBody) {
            document.body.appendChild(iframe);
        }
        return iframe;
    }

    private static setUpdateTokenInterval() {
        if (Security.updateTokenInterval) {
            clearInterval(Security.updateTokenInterval);
            Security.updateTokenInterval = null;
        }
        Security.updateTokenInterval = setInterval(
            async () => {
                new Promise((resolve,
                             reject) => {
                    if (Security.keycloak) {
                        Security.keycloak.updateToken(70).then((refreshed: any) => {
                            resolve(refreshed);
                        });
                    } else {
                        reject(false);
                    }
                }).then((refreshed: any) => {
                    if (refreshed) {
                        if (Security.onTokenUpdate && Security.keycloak.token) {
                            Security.onTokenUpdate(Security.keycloak.token);
                        }
                    }
                }).catch(() => {
                    (console as any).error('failed to refresh token');
                    clearInterval(Security.updateTokenInterval);
                    Security.updateTokenInterval = null;
                });
            },
            60000,
        );
    }

    public static async forceUpdateToken(): Promise<void> {
        const refreshed = await Security.keycloak?.updateToken(300);
        if (refreshed) {
            if (Security.onTokenUpdate && Security.keycloak.token) {
                Security.onTokenUpdate(Security.keycloak.token);
            }
        }
    }

    private static async keycloakLogin(config: any,
                                       loginOptions?: KeycloakLoginOptions): Promise<LoginResult> {
        const Keycloak: { default: (config?: KeycloakConfig | string | undefined) => KeycloakInstance } = await import ('keycloak-js');
        Security.keycloak = Keycloak.default(config);
        return new Promise((resolve,
                            reject) => {
            Security.keycloak
                    .init({})
                    .then(() => Security.keycloak
                                        .login(loginOptions)
                                        .then((authenticated: any) => {
                                            if (authenticated) {
                                                Security.setUpdateTokenInterval();
                                            }
                                            resolve({
                                                keycloak: Security.keycloak,
                                                authenticated,
                                            } as LoginResult);
                                        })
                                        .catch((e) => {
                                            reject(e);
                                        }));

        });
    }

    private static async initKeycloak(config: any,
                                      initOptions: Keycloak.KeycloakInitOptions): Promise<LoginResult> {
        const Keycloak: { default: (config?: KeycloakConfig | string | undefined) => KeycloakInstance } = await import ('keycloak-js');
        Security.keycloak = Keycloak.default(config);
        return new Promise((resolve,
                            reject) => {
            Security.keycloak
                    .init(initOptions)
                    .then((authenticated: any) => {
                        if (authenticated) {
                            Security.setUpdateTokenInterval();
                        }
                        resolve({
                            keycloak: Security.keycloak,
                            authenticated,
                        } as LoginResult);
                    })
                    .catch((e) => {
                        reject(e);
                    });
        });
    }

    private static removeLoginState(): void {
        const url = window.location.href;
        const fragmentIndex = url.indexOf('#');
        if (fragmentIndex !== -1) {
            const newURL = url.substring(0, fragmentIndex);
            window.history.replaceState({}, '', newURL);
        }
    }

    private static cleanUp(eventType: EventTypes,
                           cid: string,
                           closePopup: boolean = true) {
        if (Security.authenticatedListeners.has(eventType)) {
            window.removeEventListener('message', Security.authenticatedListeners.get(eventType));
            Security.authenticatedListeners.delete(eventType);
        }
        if (eventType === EventTypes.CHECK_AUTHENTICATED) {
            const iframe = document.getElementById(Security.AUTH_IFRAME_ID);
            if (iframe) {
                iframe.remove();
            }
        } else if (eventType === EventTypes.AUTHENTICATE) {
            if (closePopup) {
                if (Security.popupWindow && !Security.popupWindow.closed) {
                    Security.popupWindow.close();
                }
                delete Security.popupWindow;
            }
        }
    }
}

export interface LoginResult {
    keycloak?: KeycloakInstance;
    authenticated: boolean;
    popupWindow?: PopupWindowAsync;
}
