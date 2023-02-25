import { Contents, ServerConnection } from '@jupyterlab/services';

import { PathExt } from '@jupyterlab/coreutils';

import { ISignal, Signal } from '@lumino/signaling';

declare var BoxSdk: any;

export const DRIVE_NAME = 'Box';

export const LOCAL_STORAGE_TOKEN_KEY = 'AccessToken';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64DecodeAsBlob(text: string, type = 'text/plain;charset=UTF-8') {
  return fetch(`data:${type};base64,` + text).then(response => response.blob());
}

function build_path(path: string, name: string, id: string): string {
  return PathExt.join(path, id + ": " + name)
}

function get_file_id(path: string): string {
  let basename = PathExt.basename(path)
  var id;
  var m = basename.match(/([0-9]+): .*/)
  if (path == '' || m == null) {
    id = "0"
  } else {
    id = m[1]
  }
  return id
}

function get_file_name(path: string): string {
  let basename = PathExt.basename(path)
  var name;
  var m = basename.match(/[0-9]+: (.*)/)
  if (path == '' || m == null) {
    name = ""
  } else {
    name = m[1]
  }
  return name
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

  get fileChanged(): ISignal<this, Contents.IChangedArgs> {
    return this._fileChanged;
  }

  async get(
    path: string,
    options?: Contents.IFetchOptions
  ): Promise<Contents.IModel> {
    var accessToken = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    var client = new (new BoxSdk()).BasicBoxClient({accessToken: accessToken, noRequestMode: true});
    var id = get_file_id(path);

    if (options && 'type' in options &&
    (options.type == 'file' || options.type == 'notebook')) {
      return this.get_file_content(client, id, path, options)
    }

    var opt = client.folders.get({id: id, params: {
      fields: "name,item_collection"}});
    var r = await fetch(opt.url, {
      method: opt.method,
      headers: opt.headers,
      cache: "no-store"
    })
    if (!r.ok) {
      if (r.status == 404) {
        return this.get_file_content(client, id, path, options)
      }
    }
    const res_json = await r.json();

    const content: Contents.IModel[] = [];
    for (const entry of res_json.item_collection.entries) {
      if (entry.type == "file") {
        content.push({
          name: entry.name,
          path: build_path(path, entry.name, entry.id),
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
          path: build_path(path, entry.name, entry.id),
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
    const format = options?.format;
    const content = options?.content;
    var accessToken = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    var client = new (new BoxSdk()).BasicBoxClient({accessToken: accessToken});
    let basename = PathExt.basename(path)
    let dirname = PathExt.dirname(path)

    var formData = new FormData();

    var contentBlob
    if (format == "base64") {
      contentBlob = await base64DecodeAsBlob(content);
    } else if (format == "json") {
      contentBlob = JSON.stringify(content, null, 2);
    } else {
      contentBlob = content
    }

    var name
    if (options && 'name' in options) {
      name = basename
      formData.append('parent_id', get_file_id(dirname));
      } else {
      name = get_file_name(path)
      formData.append('id', get_file_id(path));
    }

    const last_modified = new Date()
    const file = new File([contentBlob], name, {
      type: "",
      lastModified: last_modified.getTime(),
    })
    formData.append(name, file);
    await client.files.upload({body: formData})

    this._fileChanged.emit({
      type: 'save',
      oldValue: null,
      newValue: contentBlob
    });

    var clientn = new (new BoxSdk()).BasicBoxClient({accessToken: accessToken, noRequestMode: true});
    var id = get_file_id(path);
    return this.get_file_content(clientn, id, path, options, last_modified)
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

  private async get_file_content(
    client: any,
    id: string,
    path: string,
    options?: Contents.IFetchOptions,
    last_modified?: Date
  ): Promise<Contents.IModel> {
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
      cache: "no-store"
    })
    const res_json = await r.json();
    if (!r.ok) {
      throw new Error();
    }
    // console.log(res_json)
  
    const url = new URL(opt.url);
    var url_content = [url.protocol, '//', url.host, url.pathname + "/content"].join('')
    var r_content = await fetch(url_content, {
      method: opt.method,
      headers: opt.headers,
      cache: "no-store"
    })
  
    let type: Contents.ContentType
    if (options && 'type' in options && options.type) {
      type = options.type
    } else {
      type = "file"
    }
  
    /*
      File and Output Formats
      https://jupyterlab.readthedocs.io/en/stable/user/file_formats.html
    */
    let format: Contents.FileFormat;
    var mimetype = r_content.headers.get('content-type')
    if (mimetype == null) {
      mimetype = "text/plain"
      format = 'text';
    } else if (['ipynb'].includes(res_json.extension)) {
      mimetype = ""
      format = 'json';
    } else if (
      ['md', 'yml', 'yaml', 'json'].includes(res_json.extension) ||
      ["application/x-javascript", "image/svg+xml"].includes(mimetype)
    ) {
      mimetype = "text/plain"
      format = 'text';
    } else if (mimetype == "application/json") {
      format = 'json';
    } else if (mimetype && mimetype.split('/')) {
      if (['text'].includes(mimetype.split('/')[0])) {
        format = 'text';
      } else {
        format = 'base64';
      }
    } else {
      format = 'text';
    }
    var fileContent
    if (format == "text") {
      fileContent = await r_content.text()
    } else if (type.toString() == "notebook") {
      fileContent = await r_content.json();
    } else {
      fileContent = arrayBufferToBase64(await r_content.arrayBuffer())
    }
  
    var last_modified_str: string
    if (last_modified) {
      last_modified_str = last_modified.toISOString()
    } else {
      last_modified_str = new Date(res_json.content_modified_at).toISOString()
    }

    return {
      name: res_json.name,
      path: PathExt.join(path, res_json.name),
      created: new Date(res_json.content_created_at).toISOString(),
      last_modified: last_modified_str,
      format,
      mimetype,
      content: fileContent,
      writable: true,
      type
    };
  }

  private _isDisposed = false;
  private _fileChanged = new Signal<this, Contents.IChangedArgs>(this);
}