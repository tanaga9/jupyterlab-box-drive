import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { URLExt } from '@jupyterlab/coreutils';

import { ToolbarButton, showDialog } from '@jupyterlab/apputils';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { ITranslator } from '@jupyterlab/translation';

import { treeViewIcon, launchIcon, pasteIcon } from '@jupyterlab/ui-components';

import { BoxDrive } from './drive';

// ---------- Temporary Hack: Get the current URL ----------
const current = (function() {
  const currentScript = document.currentScript
  if (currentScript) {
    // @ts-ignore
    return URLExt.parse(currentScript.src).pathname + "/../";
  } else {
    const scripts = document.getElementsByTagName('script');
    const script = scripts[scripts.length-1];
    if (script.src) {
      return URLExt.parse(script.src).pathname + "/../";
    } else {
      return "/lab/extensions/jupyterlab-box-drive/static/"
    }
  }
})();
// ---------- Temporary Hack: Get the current URL ----------

function loadJS(FILE_URL: string) {
  let scriptElement = document.createElement("script");
  scriptElement.setAttribute("src", FILE_URL);
  scriptElement.setAttribute("type", "text/javascript");
  document.body.appendChild(scriptElement);
}

/**
 * Initialization data for the jupyterlab-box-drive extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-box-drive:plugin',
  requires: [IFileBrowserFactory, ITranslator],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    browser: IFileBrowserFactory,
    translator: ITranslator
  ) => {
    console.log('JupyterLab extension jupyterlab-box-drive is activated!');

    const { serviceManager } = app;
    const { createFileBrowser } = browser;

    const trans = translator.load('jupyterlab-box-drive');

    loadJS(current + "assets/BoxSdk.min.js");
    const drive = new BoxDrive();

    serviceManager.contents.addDrive(drive);

    const widget = createFileBrowser('jp-box-browser', {
      driveName: drive.name,
      restore: true
    });
    widget.title.caption = trans.__('Box');
    widget.title.icon = treeViewIcon;

    // https://github.com/jupyterlab/jupyterlab/tree/main/packages/ui-components/style/icons/toolbar

    const getTokenButton = new ToolbarButton({
      icon: launchIcon,
      onClick: async () => {
        cwindow = window.open(
          current + 'assets/auth.html',
          'BoxAuth', "width=600,height=600");
      },
      tooltip: trans.__('Box | Login'),
      label: trans.__('Box | Login')
    });
    widget.toolbar.insertItem(0, 'get-token', getTokenButton);
    getTokenButton.removeClass("jp-Toolbar-item");
    getTokenButton.addClass("jp-Toolbar-item-BoxDrive");

    const getJsonButton = new ToolbarButton({
      icon: pasteIcon,
      onClick: async () => {
        if (RefreshToken && navigator.clipboard) {
          navigator.clipboard.writeText(JSON.stringify({
            'oauth': {
              'client_id': ClientID,
              'client_secret': ClientSecret,
              'access_token': AccessToken,
            }
          })).then(() => {
            showDialog({
              title: 'Copied OAuth2 info to clipboard',
            })
          }, () => {
            alert('The Clipboard API is not available')
          });
        }
      },
      tooltip: trans.__('Copy OAuth2 info to clipboard')
    });
    widget.toolbar.insertItem(1, 'get-json', getJsonButton);

    app.shell.add(widget, 'left');

    var cwindow: any = null
    var TokenEndpoint: string
    var ClientID: string
    var ClientSecret: string
    var RefreshToken: string = ""
    var AccessToken: string = ""
    var ExpiresAt: Number = 0

    const getAccessToken = async function(){
      var form_data = new FormData();
      form_data.append('client_id', ClientID);
      form_data.append('client_secret', ClientSecret);
      form_data.append('grant_type', 'refresh_token');
      form_data.append('refresh_token', RefreshToken);
      var res = await fetch(TokenEndpoint , {
        method: "POST",
        body: form_data
      })
      const res_json = await res.json();
      if (!res.ok) {
        throw new Error(res_json);
      }
      RefreshToken = res_json.refresh_token
      ExpiresAt = (new Date()).getTime() + res_json.expires_in * 1000
      AccessToken = res_json.access_token
      drive.accessToken = AccessToken
    }
    const timer = async function(){
      try {
        if (cwindow && cwindow.RefreshToken) {
          TokenEndpoint = cwindow.TokenEndpoint
          ClientID = cwindow.ClientID
          ClientSecret = cwindow.ClientSecret
          RefreshToken = cwindow.RefreshToken
          await getAccessToken()
          cwindow.close()
          cwindow = null
        } else if (RefreshToken && ExpiresAt > 0 &&
          (new Date()).getTime() + 10 * 60 * 1000 > ExpiresAt) {
          await getAccessToken()
        }
      } catch (e) {
        console.error(e)
      }
      setTimeout(timer, 3000);
    }
    timer();
  }
};

export default plugin;
