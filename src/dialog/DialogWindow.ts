import { LoginResult, Security } from '../connect/Security';
import { AuthenticationOptions } from '../connect/connect';
import { WindowMode }            from '../models/WindowMode';
import Utils                     from '../utils/Utils';

declare const lottie: any;

export class DialogWindow {
  public static async openLoginDialog(clientId: string, options?: AuthenticationOptions): Promise<LoginResult> {
    let templateUrl: string;

    switch ((options as AuthenticationOptions).idpHint) {
      case 'google':
        templateUrl = `${Utils.urls.connect}/modal/login/google`;
        break;
      case 'apple':
        templateUrl = `${Utils.urls.connect}/modal/login/apple`;
        break;
      case 'twitter':
      case 'arkane-twitter':
        templateUrl = `${Utils.urls.connect}/modal/login/twitter`;
        break;
      case 'facebook':
      case 'arkane-facebook':
        templateUrl = `${Utils.urls.connect}/modal/login/facebook`;
        break;
      case 'password':
        templateUrl = `${Utils.urls.connect}/modal/login/password`;
        break;
      default:
        templateUrl = `${Utils.urls.connect}/modal/login/none`;
        break;
    }

    return new Promise((resolve, reject) => {
      fetch(templateUrl)
        .then(response => response.text())
        .then(template => {
          const { overlayContainer, container, shadowRoot } = this.createTemplate(template, clientId);

          const { idpHint } = options as AuthenticationOptions;
          if (idpHint === 'register') {
            this.showRefocusLayout();
            Security.login(clientId, {
              ...options,
              idpHint,
              windowMode: WindowMode.POPUP
            }).then(authResult => {
              this.removeBackdrop();
              this.closeRefocusLayout();
              resolve(authResult)
            });
          }
          else {
            overlayContainer.appendChild(container);
            this.addAuthEventListeners(clientId, options as AuthenticationOptions, resolve, shadowRoot);
            document.body.appendChild(overlayContainer);
            this.addCloseListeners(shadowRoot, reject);
          }
        });
    });
  }

  public static async openActionDialog(clientId: string, action: string): Promise<any> {
    const templateUrl = `${Utils.urls.connect}/modal/action/${action}`;

    return new Promise((resolve, reject) => {
      fetch(templateUrl)
        .then(response => response.text())
        .then(template => {
          const { overlayContainer, container, shadowRoot } = this.createTemplate(template, clientId);

          shadowRoot.querySelector('.action-btn')!.addEventListener('click', () => {
            this.closeLoginDialog();
            resolve(true);
          });

          overlayContainer.appendChild(container);
          document.body.appendChild(overlayContainer);
          this.addCloseListeners(shadowRoot, reject);
        });
    });
  }

  public static addFonts() {
    if (typeof window === 'undefined') {
      return;
    }

    const href = `${Utils.urls.connect}/static/css/connect/fonts.css`;

    if (!document.querySelector(`link[href="${href}"]`)) {
      const stylesheet = document.createElement('link');
      stylesheet.setAttribute('rel', 'stylesheet');
      stylesheet.setAttribute('href', href);
      stylesheet.setAttribute('type', 'text/css');
      stylesheet.setAttribute('crossorigin', 'anonymous');
      (document.querySelector('head') as HTMLHeadElement).appendChild(stylesheet);
    }
  }

  private static addAnimationScript(shadowRoot: any) {
    const src = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.10.2/lottie.min.js'

    if (!document.querySelector(`script[src="${src}"]`)) {
      const lootieScript = document.createElement('script');
      lootieScript.setAttribute('src', src);
      lootieScript.setAttribute('integrity', 'sha512-fTTVSuY9tLP+l/6c6vWz7uAQqd1rq3Q/GyKBN2jOZvJSLC5RjggSdboIFL1ox09/Ezx/AKwcv/xnDeYN9+iDDA==');
      lootieScript.setAttribute('crossorigin', 'anonymous');
      lootieScript.setAttribute('referrerpolicy', 'no-referrer');
      (document.querySelector('head') as HTMLHeadElement).appendChild(lootieScript);
    }

    const interval = setInterval(() => {
      const lt = lottie; // TS compiler trick
      if (lt) {
        lt.loadAnimation({
          container: shadowRoot.querySelector('.animation'),
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: `${Utils.urls.connect}/static/animations/login-animation.json`
        });
        clearInterval(interval);
      }
    }, 100);
  }

  private static addAuthEventListeners(
    clientId: string,
    options: AuthenticationOptions,
    authResolver: (value?: LoginResult | PromiseLike<LoginResult> | undefined) => void,
    root: ShadowRoot
  ) {
    const authActions = root.querySelectorAll('.auth-action');
    Array.from(authActions).forEach((authAction: any) => {
      authAction.addEventListener('click', (event: MouseEvent) => {
        const idpHint = (event.target as any).dataset.idpHint || (event.target as any).parentElement.dataset.idpHint;

        Security.login(clientId, {
          ...options,
          idpHint,
          windowMode: WindowMode.POPUP
        }).then(authResult => {
          this.removeBackdrop();
          this.closeRefocusLayout(options.closePopup);

          authResolver(authResult)
        });

        this.closeLoginDialog();
        this.showRefocusLayout();
      });
    });

    const selectAnotherOption = root.querySelector('.select-another-option');
    if (selectAnotherOption) {
      selectAnotherOption.addEventListener('click', () => {
        this.closeLoginDialog();
        this.removeBackdrop();
        delete options.idpHint;
        authResolver(this.openLoginDialog(clientId, options));
      });
    }
  }

  private static addCloseListeners(root: ShadowRoot, reject: (reason?: any) => void) {
    const close = root.querySelector('.venly-connect-close-dialog');
    if (close) {
      close.addEventListener('click', () => {
        this.closeLoginDialog();
        this.removeBackdrop();
        reject({ status: 'ABORTED', errors: [] });
      });
    }
  }

  private static closeLoginDialog() {
    document.querySelectorAll('.venly-connect-dialog-container').forEach(e => e.remove());
  }

  public static removeBackdrop() {
    document.querySelectorAll('.overlay-container').forEach(e => e.remove());
  }

  public static showRefocusLayout(id?: string, focus?: Function) {
    fetch(`${Utils.urls.connect}/modal/re-focus-layout`)
      .then(response => response.text())
      .then(template => {
        const overlayContainer = this.createOverlayContainer(id);
        const container = document.createElement('div');
        const shadowRoot = container.attachShadow({ mode: 'open' });
        container.classList.add('venly-connect-refocus-container');
        shadowRoot.innerHTML = template;
        container.style.position = 'absolute';
        container.style.top = 'calc(50% - 218px)';
        container.style.left = 'calc(50% - 147.5px)';
        container.style.zIndex = '2147483647';

        const existingContainer = document.querySelector('.overlay-container');
        if (existingContainer)
          existingContainer.appendChild(container);
        else {
          overlayContainer.appendChild(this.createBackdrop());
          overlayContainer.appendChild(container);
          document.body.appendChild(overlayContainer);
        }

        this.addRefocusListeners(shadowRoot, focus);
      });
  }

  public static closeRefocusLayout(closePopup: boolean = true) {
    document.querySelectorAll('.overlay-container').forEach(e => e.remove());
    document.querySelectorAll('.venly-connect-refocus-container').forEach(e => e.remove());
    if (closePopup)
      Security.closePopupWindow();
  }

  private static addRefocusListeners(root: ShadowRoot, focus: Function = Security.focusPopupWindow) {
    const reopenAction = root.querySelector('.venly-connect-re-focus-wrapper .reopen-action');
    if (reopenAction)
      reopenAction.addEventListener('click', () => focus());
  }

  private static createOverlayContainer(id: string = 'venly-overlay-container'): HTMLDivElement {
    const overlayContainer = document.createElement('div');
    overlayContainer.id = id;
    overlayContainer.classList.add('overlay-container');
    overlayContainer.style.position = 'fixed';
    overlayContainer.style.zIndex = '2147483647';
    overlayContainer.style.top = '0';
    overlayContainer.style.left = '0';
    overlayContainer.style.height = '100%';
    overlayContainer.style.background = 'rgba(33, 37, 41, 0.70)';
    overlayContainer.style.width = '100%';

    return overlayContainer;
  }

  private static createBackdrop(): HTMLDivElement {
      const backdrop = document.createElement('div');
      backdrop.classList.add('venly-connect-dialog-backdrop');
      backdrop.style.position = 'fixed';
      backdrop.style.width = '100%';
      backdrop.style.height = '100%';
      backdrop.style.zIndex = '2147483647';
      (backdrop.style as any).backdropFilter = 'blur(5px)';

      return backdrop;
  }

  private static createTemplate(template: string, clientId: string) {
      const container = document.createElement('div');
      const shadowRoot = container.attachShadow({ mode: 'open' });
      container.classList.add('venly-connect-dialog-container');
      shadowRoot.innerHTML = template;
      container.style.position = 'absolute';
      container.style.zIndex = '2147483647';
      container.style.display = 'flex';
      container.style.justifyContent = 'center';
      container.style.width = '100%';
      container.style.height = '100%';


      const companyLogo = shadowRoot.querySelector('.connect-company-logo');
      (companyLogo as HTMLImageElement).src = `${Utils.urls.storage}/clients/logos/${clientId}.png`;

      const overlayContainer = this.createOverlayContainer();
      overlayContainer.appendChild(this.createBackdrop());
      this.addFonts();
      this.addAnimationScript(shadowRoot);
      overlayContainer.appendChild(container);

      return { overlayContainer, container, shadowRoot };
  }
}
