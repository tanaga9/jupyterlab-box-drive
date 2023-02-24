import { Contents, ServerConnection } from '@jupyterlab/services';

// import { PathExt } from '@jupyterlab/coreutils';

import { ISignal, Signal } from '@lumino/signaling';

export const DRIVE_NAME = 'Box';
// const DRIVE_PREFIX = `${DRIVE_NAME}:`;

export class BoxDrive implements Contents.IDrive {
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    Signal.clearData(this);
  }

  get name(): string {
    return DRIVE_NAME;
  }

  get serverSettings(): ServerConnection.ISettings {
    return ServerConnection.makeSettings();
  }

  get fileChanged(): ISignal<Contents.IDrive, Contents.IChangedArgs> {
    return this._fileChanged;
  }

  async get(
    path: string,
    options?: Contents.IFetchOptions
  ): Promise<Contents.IModel> {

    if (true) {
      return {
        name: '',
        path: '',
        created: new Date().toISOString(),
        last_modified: new Date().toISOString(),
        format: null,
        mimetype: '',
        content: null,
        writable: true,
        type: 'directory'
      };
    }
  }

  getDownloadUrl(path: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async newUntitled(
    options?: Contents.ICreateOptions
  ): Promise<Contents.IModel> {
    throw new Error('Method not implemented.');
    // return await this.get(PathExt.join("", ""));;
  }

  async delete(path: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async rename(oldPath: string, newPath: string): Promise<Contents.IModel> {
    throw new Error('Method not implemented.');
    // return this.get(newPath);
  }

  async save(
    path: string,
    options?: Partial<Contents.IModel>
  ): Promise<Contents.IModel> {
    throw new Error('Method not implemented.');
    // return this.get(path);
  }

  async copy(path: string, toLocalDir: string): Promise<Contents.IModel> {
    throw new Error('Method not implemented.');
    // return this.get(path);
  }

  async createCheckpoint(path: string): Promise<Contents.ICheckpointModel> {
    return {
      id: 'test',
      last_modified: new Date().toISOString()
    };
  }

  async listCheckpoints(path: string): Promise<Contents.ICheckpointModel[]> {
    return [
      {
        id: 'test',
        last_modified: new Date().toISOString()
      }
    ];
  }

  restoreCheckpoint(path: string, checkpointID: string): Promise<void> {
    return Promise.resolve(void 0);
  }

  deleteCheckpoint(path: string, checkpointID: string): Promise<void> {
    return Promise.resolve(void 0);
  }

  private _isDisposed = false;
  private _fileChanged = new Signal<Contents.IDrive, Contents.IChangedArgs>(
    this
  );
}