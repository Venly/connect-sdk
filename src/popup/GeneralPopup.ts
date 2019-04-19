import { EVENT_TYPES }  from '../types/EventTypes';
import Popup            from './Popup';
import Utils            from '../utils/Utils';
import { PopupActions } from './PopupActions';
import { PopupResult }  from './PopupResult';

export class GeneralPopup extends Popup {

    public static openNewPopup(action: PopupActions, bearerTokenProvider: () => string, data?: any) {
        const popup = new GeneralPopup(`${Utils.urls.connect}/popup/general/init.html`, bearerTokenProvider);
        window.addEventListener('beforeunload', () => {
            popup.close();
        });
        popup.focus();
        return popup.sendData(action, data && JSON.parse(JSON.stringify(data))).finally(() => {
            popup.close();
        })
    }

    public sendData(
        action: string,
        data: any
    ): Promise<PopupResult> {
        return new Promise((resolve, reject) => {
            this.onPopupMountedQueue.push(this.attachFinishedListener(resolve, reject));
            this.onPopupMountedQueue.push(this.sendDataToPopup(action, data));
            this.processPopupMountedQueue();
        }) as Promise<PopupResult>;
    }

    protected sendDataToPopup(
        action: string,
        data: any
    ): () => void {
        return () => {
            if (this.isOpen()) {
                let params = {action, bearerToken: this.bearerTokenProvider()} as any;
                if (data) {
                    params.data = data;
                }
                this.popupWindow.postMessage(
                    {type: this.sendDataEventType, params},
                    Utils.urls.connect
                );
            }
        };
    }

    protected finishedEventType: EVENT_TYPES = EVENT_TYPES.GENERAL_FINISHED;
    protected sendDataEventType: EVENT_TYPES = EVENT_TYPES.SEND_GENERAL_DATA;

}
