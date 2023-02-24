import { Contents, ServerConnection } from '@jupyterlab/services';

import { PathExt } from '@jupyterlab/coreutils';

import { ISignal, Signal } from '@lumino/signaling';

declare var BoxSdk: any;

export const DRIVE_NAME = 'Box';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return window.btoa(binary);
}

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
    var accessToken = localStorage.getItem('AccessToken');
    var box = new BoxSdk();
    var client = new box.BasicBoxClient({accessToken: accessToken, noRequestMode: true});
    var id;
    var m = path.match(/.* :([0-9]+)/)
    if (path == '' || m == null) {
      id = "0"
    } else {
      id = m[1]
    }

    if (options && 'type' in options && options.type == 'file') {
      var opt = client.files.get({id: id, params: {fields: [
        "id",
        "name",
        "content_created_at",
        "content_modified_at",
        "extension",
        "item_status",
        "lock",
        "metadata",
        "parent",
        "path_collection",
        "size"
      ].join(",")}});
      var r = await fetch(opt.url, {
          method: opt.method,
          headers: opt.headers,
      })
      const res_json = await r.json();
      // console.log(res_json)

      const url = new URL(opt.url);
      var url_content = [url.protocol, '//', url.host, url.pathname + "/content"].join('')
      var r_content = await fetch(url_content, {
          method: opt.method,
          headers: opt.headers,
      })

      let format: Contents.FileFormat;
      var filetype
      if ([
        'html', 'txt', 'md', 'text',
      ].includes(res_json.extension)) {
        format = "text"
        filetype = "text/plain"
      } else if ([
        'json', 'ipynb',
      ].includes(res_json.extension)) {
        format = "text"
        filetype = "application/json"
      } else {
        format = 'base64';
        filetype = "application/pdf"
      }
      var fileContent
      if (format == "text") {
        fileContent = await r_content.text()
      } else {
        fileContent = arrayBufferToBase64(await r_content.arrayBuffer())
      }
  
      return {
        name: res_json.name,
        path: PathExt.join(path, res_json.name),
        created: new Date(res_json.content_created_at).toISOString(),
        last_modified: new Date(res_json.content_modified_at).toISOString(),
        format,
        mimetype: filetype,
        content: fileContent,
        writable: true,
        type: 'file'
      };
    }

    var opt = client.folders.get({id: id, params: {fields: "name,item_collection"}});
    var r = await fetch(opt.url, {
        method: opt.method,
        headers: opt.headers,
    })
    const res_json = await r.json();

    const content: Contents.IModel[] = [];
    for (const entry of res_json.item_collection.entries) {
      if (entry.type == "file") {
        content.push({
          name: entry.name,
          path: PathExt.join(path, entry.name + ' :' + entry.id),
          created: '',
          last_modified: '',
          format: null,
          mimetype: '',
          content: null,
          writable: true,
          type: 'file'
        });
      } else {
        content.push({
          name: entry.name,
          path: PathExt.join(path, entry.name + ' :' + entry.id),
          created: '',
          last_modified: '',
          format: null,
          mimetype: '',
          content: null,
          writable: true,
          type: 'directory'
        });
      }
    }
    return {
      name: res_json.name,
      path: path,
      last_modified: '',
      created: '',
      format: null,
      mimetype: '',
      content,
      size: undefined,
      writable: true,
      type: 'directory'
    };
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