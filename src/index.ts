import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the jupyterlab-box-drive extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-box-drive:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jupyterlab-box-drive is activated!');
  }
};

export default plugin;
