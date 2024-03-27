import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { URLExt } from '@jupyterlab/coreutils';

import {
  createToolbarFactory,
  setToolbar,
  IToolbarWidgetRegistry,
  ToolbarButton,
  showDialog,
  /* Notification */
} from '@jupyterlab/apputils';

import {
  IFileBrowserFactory,
  FileBrowser,
  Uploader
} from '@jupyterlab/filebrowser';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import {
  launchIcon,
  pasteIcon,
  IScore,
  FilenameSearcher,
  treeViewIcon
} from '@jupyterlab/ui-components';

import { DRIVE_NAME, BoxDrive } from './drive';

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
 * The class name added to the filebrowser filterbox node.
 */
const FILTERBOX_CLASS = 'jp-FileBrowser-filterBox';

/**
 * Initialization data for the jupyterlab-box-drive extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-box-drive:plugin',
  requires: [IFileBrowserFactory, ITranslator],
  optional: [ISettingRegistry, IToolbarWidgetRegistry],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    browser: IFileBrowserFactory,
    translator: ITranslator,
    settingRegistry: ISettingRegistry | null,
    toolbarRegistry: IToolbarWidgetRegistry | null
  ) => {
    console.log('JupyterLab extension jupyterlab-box-drive is activated!');

    const { serviceManager } = app;
    const { createFileBrowser } = browser;

    const trans = translator.load('jupyterlab-box-drive');

    loadJS(current + "assets/BoxSdk.min.js");
    const drive = new BoxDrive();

    serviceManager.contents.addDrive(drive);

    const widget = createFileBrowser('jp-box-browser', {
      refreshInterval: 5000, // The time interval for browser refreshing, in ms.
      driveName: drive.name
    });
    widget.title.caption = trans.__('Box cloud content storage');
    widget.title.icon = treeViewIcon;

    // GET List items in folder API
    // https://developer.box.com/reference/resources/folder--full/
    // items have no last updated date
    // https://developer.box.com/reference/resources/items/
    // N+1 query problem
    widget.showLastModifiedColumn = false;
    widget.showFileSizeColumn = false;
    widget.showFileCheckboxes = false;

    const toolbar = widget.toolbar;
    toolbar.id = 'jp-boxdrive-toolbar';

    if (toolbarRegistry && settingRegistry) {
      // Set toolbar
      setToolbar(
        toolbar,
        createToolbarFactory(
          toolbarRegistry,
          settingRegistry,
          DRIVE_NAME,
          plugin.id,
          translator ?? nullTranslator
        ),
        toolbar
      );

      toolbarRegistry.addFactory(
        DRIVE_NAME,
        'get-token',
        (browser: FileBrowser) => {
          const getTokenButton = new ToolbarButton({
            icon: launchIcon,
            onClick: async () => {
              cwindow = window.open(
                current + 'assets/auth.html',
                'BoxAuth', "width=600,height=600");
            },
            // https://github.com/jupyterlab/jupyterlab/tree/main/packages/ui-components/style/icons/toolbar
            tooltip: trans.__('Box | Login'),
            label: trans.__('Box | Login')      
          });
          getTokenButton.removeClass("jp-Toolbar-item");
          getTokenButton.addClass("jp-Toolbar-item-BoxDrive");      
          return getTokenButton;
        }
      );

      toolbarRegistry.addFactory(
        DRIVE_NAME,
        'get-json',
        (browser: FileBrowser) => {
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
                  // Notification.emit('Copied info for JupyterlabBoxDrive to clipboard', "default", {autoClose: 3000});
                }, () => {
                  // alert('The Clipboard API is not available')
                  showDialog({
                    title: 'The Clipboard API is not available',
                  });
                });
              }
            },
            tooltip: trans.__('Copy OAuth2 info to clipboard')
          });
          return getJsonButton;
        }
      );

      toolbarRegistry.addFactory(
        DRIVE_NAME,
        'uploader',
        (browser: FileBrowser) =>
          new Uploader({
            model: widget.model,
            translator
          })
      );

      toolbarRegistry.addFactory(
        DRIVE_NAME,
        'filename-searcher',
        (browser: FileBrowser) => {
          const searcher = FilenameSearcher({
            updateFilter: (
              filterFn: (item: string) => Partial<IScore> | null,
              query?: string
            ) => {
              widget.model.setFilter(value => {
                return filterFn(value.name.toLowerCase());
              });
            },
            useFuzzyFilter: true,
            placeholder: trans.__('Filter files by name'),
            forceRefresh: false
          });
          searcher.addClass(FILTERBOX_CLASS);
          return searcher;
        }
      );
    }

    app.shell.add(widget, 'left', { type: 'BoxDrive' });

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
        } else if (RefreshToken && ExpiresAt > new Number(0) &&
          (new Number((new Date()).getTime() + 10 * 60 * 1000)) > ExpiresAt) {
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
