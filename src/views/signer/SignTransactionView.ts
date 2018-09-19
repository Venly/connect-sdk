import {Component, Vue} from 'vue-property-decorator';
import Numpad from '../../components/molecules/Numpad.vue';
import {EVENT_TYPES} from '../../types/EventTypes';
import ResponseBody from '../../api/ResponseBody';
import {State} from 'vuex-class';
import Security from '../../Security';

declare const window: Window;

@Component({
    components: {
        Numpad,
    },
})
export default class SignTransactionView extends Vue {
    public loadingText = 'Initializing signer ...';

    public transactionData?: any;
    public errorText = '';

    @State
    public auth: any;

    private parentWindow!: Window;
    private parentOrigin!: string;
    private hasTransactionData: boolean = false;

    public created() {
        if (!this.auth) {
            this.loadingText = 'Not authenticated, going back in 3 seconds.';
            setTimeout(() => {
                (window as any).close();
            }, 3000);
        }
    }

    public noTriesLeftMessage() {
        this.errorText = 'You entered a wrong pincode too many times.';
    }

    public wrongPincodeMessage() {
        this.errorText = 'Wrong pincode';
    }

    public mounted() {
        this.addEventListeners();
        window.opener.postMessage({type: EVENT_TYPES.SIGNER_MOUNTED}, '*');
    }

    private sendTransactionSignedMessage(result: ResponseBody) {
        this.parentWindow.postMessage({
            type: EVENT_TYPES.TRANSACTION_SIGNED,
            data: result,
        }, this.parentOrigin);
    }

    private get isInitialised() {
        return Security.isLoggedIn && this.hasTransactionData;
    }

    private addEventListeners() {
        window.addEventListener('message', (event: MessageEvent) => {
            const data = event.data;
            if (data && data.type === EVENT_TYPES.SEND_TRANSACTION_DATA) {
                this.transactionData = {...data.params};
                this.parentOrigin = event.origin;
                this.parentWindow = (event.source as Window);
                this.hasTransactionData = true;
            }
        }, false);

        window.addEventListener('beforeunload', () => {
            this.parentWindow.postMessage({type: EVENT_TYPES.POPUP_CLOSED}, this.parentOrigin);
        });
    }
}
