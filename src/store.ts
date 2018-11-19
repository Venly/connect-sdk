import Vue from 'vue';
import Vuex from 'vuex';
import Api from './api';
import {Wallet} from './models/Wallet';
import {Snack, SnackType} from './models/Snack';
import {Profile} from './models/Profile';
import {RestApiResponse} from './api/RestApi';
import {SupportedChains} from '@/models/SupportedChains';
import {ImportKeystoreCommand, ImportPrivateKeyCommand} from '@/models/Commands';
import {RestApiResponseError} from '@/api/RestApi';
import Utils from '@/utils/Utils';

Vue.use(Vuex);

export default new Vuex.Store(
    {
        state: {
            hasMasterPin: false,
            userId: '',
            auth: {},
            config: {},
            tokens: {},
            wallets: [],
            chain: {},
            thirdPartytoken: {},
            loading: false,
            snack: {},
            hasBlockingError: false,
            showModal: false,
            transactionWallet: {},
            clearPincodeTrigger: 0,
        },
        mutations: {
            setProfile: (state: any, {userId, hasMasterPin}) => {
                state.userId = userId;
                state.hasMasterPin = hasMasterPin;
            },
            setAuth: (state: any, auth: any) => {
                state.auth = auth;
            },
            setHasMasterPin: (state: any, hasMasterPin: boolean) => {
                state.hasMasterPin = hasMasterPin;
            },
            setWallets: (state: any, wallets: Wallet[]) => {
                state.wallets = wallets;
            },
            addWallet: (state: any, wallet: Wallet) => {
                state.wallets = [...state.wallets, wallet];
            },
            setChain: (state: any, chain: string) => {
                state.chain = SupportedChains.getByName(chain);
            },
            setThirdPartyToken: (state: any, thirdPartytoken: any) => {
                state.thirdPartytoken = thirdPartytoken;
            },
            setLoading: (state: any, isLoading: boolean) => {
                state.loading = isLoading;
            },
            setSnack: (state: any, snack: Snack) => {
                state.snack = snack;
            },
            setHasBlockingError: (state: any, hasBlockingError: boolean) => {
                state.hasBlockingError = hasBlockingError;
            },
            setShowModal: (state: any, showModal: boolean) => {
                state.showModal = showModal;
            },
            setTransactionWallet: (state: any, wallet: Wallet) => {
                state.transactionWallet = wallet;
            },
            triggerClearPincode: (state: any) => {
                state.clearPincodeTrigger++;
            },
        },
        actions: {
            fetchUserData: async (store: any): Promise<Profile> => {
                return Api.getProfile().then((profile: Profile) => {
                    store.commit('setProfile', profile);
                    return profile;
                });
            },
            fetchUserWallets: async (store: any): Promise<Wallet[]> => {
                return Api.getWallets().then((wallets: Wallet[]) => {
                    wallets.sort((wallet1, wallet2) => Utils.caseInsensitiveStringCompare(wallet1.description || '', wallet2.description || ''));
                    store.commit('setWallets', wallets);
                    return wallets;
                });
            },
            updateMasterPin: async (store: any, {oldMasterPin, masterPin}): Promise<boolean> => {
                const success = await Api.setMasterPin(masterPin, oldMasterPin);
                if (success) {
                    store.commit('setHasMasterPin', true);
                }
                return success;
            },
            setMasterPin: async (store: any, masterPin: string): Promise<boolean> => {
                const success = await Api.setMasterPin(masterPin);
                store.commit('setHasMasterPin', success);
                return success;
            },
            createWallet: async (store: any, {secretType, pincode, clients}): Promise<Wallet | RestApiResponseError[]> => {
                return Api.createWallet({pincode, secretType, clients})
                    .then((response: RestApiResponse<Wallet>) => {
                        return new Promise<Wallet>((resolve, reject) => {
                            if (response.success) {
                                store.commit('addWallet', response.result);
                                resolve(response.result);
                            } else {
                                reject(response.errors);
                            }
                        });
                    });
            },
            importPrivateKey: async (store: any, command: ImportPrivateKeyCommand): Promise<Wallet> => {
                const wallet: Wallet = await Api.importPrivateKey(command);
                store.commit('addWallet', wallet);
                return wallet;
            },
            importKeystore: async (store: any, command: ImportKeystoreCommand): Promise<Wallet> => {
                const wallet: Wallet = await Api.importKeystore(command);
                store.commit('addWallet', wallet);
                return wallet;
            },
            startLoading: (store: any): void => {
                store.commit('setLoading', true);
            },
            stopLoading: (store: any): void => {
                store.commit('setLoading', false);
            },
            setWarning: async (store: any, message) => {
                if (!(store.state.snack.type && store.state.snack.type === SnackType.DANGER)) {
                    store.commit('setSnack', {type: SnackType.WARNING, message, blocking: false});
                }
            },
            setError: async (store: any, message: string) => {
                if (!(store.state.snack.type && store.state.snack.type === SnackType.DANGER && store.state.snack.blocking)) {
                    store.commit('setSnack', {type: SnackType.DANGER, message, blocking: false});
                }
            },
            setBlockingError: async (store: any, message) => {
                store.commit('setHasBlockingError', true);
                store.commit('setShowModal', true);
                store.commit('setSnack', {type: SnackType.DANGER, message, blocking: true});
            },
            resetError: async (store: any) => {
                store.commit('setSnack', {});
            },
            showModal: async (store: any) => {
                store.commit('setShowModal', true);
            },
            hideModal: async (store: any) => {
                store.commit('setShowModal', false);
            },
            setTransactionWallet: async (store: any, wallet: Wallet) => {
                store.commit('setTransactionWallet', wallet);
            },
            triggerClearPincode: async (store: any) => {
                store.commit('triggerClearPincode');
            },
        },
        getters: {
            secretType: (state) => {
                return state.chain.secretType;
            },
            thirdPartyClientId: (state) => {
                return state.thirdPartytoken.azp;
            },
        },
    },
);
