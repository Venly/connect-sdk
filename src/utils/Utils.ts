import ENV              from '../env';
import { EVENT_TYPES }  from '../types/EventTypes';
import * as QueryString from "querystring";

export default class Utils {
    public static environment: string = 'prod';

    public static get env() {
        return ENV;
    }

    public static get urls() {
        let prefix = '';
        let environment = Utils.environment.split('-');
        switch (environment[0]) {
            case 'local':
                prefix = '-tst1';
                break;
            case 'prod':
            case 'production':
                prefix = '';
                break;
            default:
                prefix = '-' + environment[0];
        }

        return {
            api: `https://api${prefix}.arkane.network/api`,
            connect: Utils.environment === 'local' || (environment.length >= 2 && environment[1]) == 'local' ? 'http://localhost:8181' : `https://connect${prefix}.arkane.network`,
            login: `https://login${prefix}.arkane.network/auth`,
        };
    }

    public static removeNulls(obj: any): any {
        return Object.keys(obj)
                     .filter((key) => obj[key] !== null && obj[key] !== undefined)  // Remove undef. and null.
                     .reduce((newObj, key) => {
                         if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                             return Object.assign(newObj, {[key]: Utils.removeNulls(obj[key])});
                         } else {
                             return Object.assign(newObj, {[key]: obj[key]});
                         }
                     }, {});
    }

    public static removeNullsAndEmpty(obj: any): any {
        return Object.keys(obj)
                     .filter((key) => obj[key] !== null && obj[key] !== undefined && obj[key] !== '')  // Remove undef. and null.
                     .reduce((newObj, key) => {
                         if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                             return Object.assign(newObj, {[key]: Utils.removeNullsAndEmpty(obj[key])});
                         } else {
                             return Object.assign(newObj, {[key]: obj[key]});
                         }
                     }, {});
    }


    public static messages() {
        return {
            hasValidOrigin: (message: MessageEvent) => {
                return message.origin === Utils.urls.connect;
            },
            hasType: (message: MessageEvent) => {
                return message.data && message.data.type && message.data.type !== '';
            },
            isOfType: (message: MessageEvent, eventType: EVENT_TYPES) => {
                return Utils.messages().hasType(message) && message.data.type === eventType.toString();
            },
            hasCorrectCorrelationID(message: MessageEvent, correlationID: string) {
                return message.data && message.data.correlationID === correlationID;
            }
        };
    }

    public static formatNumber(value: number, minDecimals: number = 2, maxDecimals: number = minDecimals) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: minDecimals,
            maximumFractionDigits: maxDecimals,
        }).format(value);
    }

    public static rawValue() {
        return {
            toTokenValue: (rawValue: number, decimals: number) => rawValue / Math.pow(10, decimals),
            toGwei: (rawValue: number) => rawValue / Math.pow(10, 9),
        };
    }

    public static gwei() {
        return {
            toRawValue: (rawValue: number) => rawValue * Math.pow(10, 9),
        };
    }

    public static openExternalUrl(url: string, targetBlank: boolean = true): Window | null {
        if (targetBlank) {
            const newWindow = window.open('', '_blank');
            if (newWindow) {
                newWindow.opener = null;
                newWindow.location.assign(url);
            }

            return newWindow;
        } else {
            window.location.href = url;
            return window;
        }
    }

    public static zeroIfUndefined(numberToVerify?: number): number {
        return numberToVerify ? numberToVerify : 0;
    }

    public static http() {
        return {
            postInForm: (to: string, data: any, bearerTokenProvider: () => string, options?: { redirectUri?: string, correlationID?: string }): void => {
                const form = document.createElement('form');
                form.action = Utils.http().buildUrl(to, options);
                form.method = 'POST';

                const inputBearer = document.createElement('input');
                inputBearer.type = 'hidden';
                inputBearer.name = 'bearerToken';
                inputBearer.value = bearerTokenProvider();
                form.appendChild(inputBearer);

                const inputData = document.createElement('input');
                inputData.type = 'hidden';
                inputData.name = 'data';
                inputData.value = JSON.stringify({...data});
                form.appendChild(inputData);

                document.body.appendChild(form);
                form.submit();
            },
            buildUrl: (to: string, options ?: { redirectUri?: string; correlationID?: string }): string => {
                if (options && (options.redirectUri || options.correlationID)) {
                    const params: { [key: string]: string } = {};
                    if (options.redirectUri) {
                        params.redirectUri = options.redirectUri;
                    }
                    if (options.correlationID) {
                        params.cid = options.correlationID;
                    }
                    return Utils.http().addRequestParams(to, params);
                }
                return to;
            },
            addRequestParams: (url: string, params: { [key: string]: string }): string => {
                if (url && params) {
                    const paramsAsString = QueryString.stringify(params);
                    if (url && url.indexOf('?') > 0) {
                        return `${url}&${paramsAsString}`;
                    } else {
                        return `${url}?${paramsAsString}`;
                    }
                }
                return url;
            }
        };
    }
}
