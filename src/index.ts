import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ToolbarButton } from '@jupyterlab/apputils';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { ITranslator } from '@jupyterlab/translation';

import { listIcon, folderIcon } from '@jupyterlab/ui-components';

import { BoxDrive } from './drive';

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

    loadJS("/files/src/BoxSdk.js");
    // loadJS("/BoxSdk.js");
    // loadJS("/build/BoxSdk.js");
    const drive = new BoxDrive();

    serviceManager.contents.addDrive(drive);

    const widget = createFileBrowser('jp-box-browser', {
      driveName: drive.name,
      restore: true
    });
    widget.title.caption = trans.__('Box');
    widget.title.icon = listIcon;

    const openDirectoryButton = new ToolbarButton({
      icon: folderIcon,
      onClick: async () => {
        window.open('/static/lab/auth.html', '_blank');
      },
      tooltip: trans.__('Log in - Box')
    });

    widget.toolbar.insertItem(0, 'open-directory', openDirectoryButton);

    app.shell.add(widget, 'left');
  }
};

export default plugin;
