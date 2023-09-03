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

function base64DecodeAsBlob(text: string, type = 'text/plain;charset=UTF-8') {
  return fetch(`data:${type};base64,` + text).then(response => response.blob());
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

  set accessToken(accessToken: string) {
    this._accessToken = accessToken;
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
    if (!(options && 'content' in options && options.content) && this._boxAbsPathMap.has(path)) {
      return {
        name: PathExt.basename(path),
        path: path,
        last_modified: '',
        created: '',
        format: null,
        mimetype: '',
        content: null,
        writable: true,
        type: this._boxAbsPathMap.get(path)!.isdir ? 'directory' : 'file'
      };
    }
    var client = new (new BoxSdk()).BasicBoxClient({
      accessToken: this._accessToken, noRequestMode: true});
    var id = await this.get_file_id(path);

    if (options && 'type' in options &&
    (options.type == 'file' || options.type == 'notebook')) {
      return this.get_file_content(client, id, path, options)
    }

    var opt = client.folders.get({id: id, params: {
      fields: "name,item_collection"}});
    var r = await fetch(opt.url, {
      method: opt.method,
      headers: opt.headers,
      mode: opt.mode,
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
        const entry_ext = PathExt.extname(entry.name)
        var entry_type: Contents.ContentType = 'file'
        if (entry_ext == ".ipynb") {
          entry_type = 'notebook'
        }
        content.push({
          name: entry.name,
          path: this.get_abspath_and_set_to_map(path, entry.name, entry.id, false),
          created: '',
          last_modified: '',
          format: null,
          mimetype: '',
          content: null,
          writable: true,
          type: entry_type
        });
      } else {
        content.push({
          name: entry.name,
          path: this.get_abspath_and_set_to_map(path, entry.name, entry.id, true),
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

  async getDownloadUrl(path: string): Promise<string> {
    var client = new (new BoxSdk()).BasicBoxClient({
      accessToken: this._accessToken, noRequestMode: true});
    const id = await this.get_file_id(path)
    var opt = client.files.getDownloadUrl({id: id})
    var r = await fetch(opt.url, {
      method: opt.method,
      headers: opt.headers,
      mode: opt.mode,
      cache: "no-store"
    })
    const res_json = await r.json();
    if (!r.ok) {
      throw new Error();
    }
    return res_json.download_url
  }

  async newUntitled(
    options?: Contents.ICreateOptions
  ): Promise<Contents.IModel> {
    var client = new (new BoxSdk()).BasicBoxClient({
      accessToken: this._accessToken, noRequestMode: true});
    let parentPath = ''
    if (options && options.path) {
      parentPath = options.path
    }

    const type = options?.type || 'directory';
    var namebase = type === 'directory' ? 'Untitled Folder' : 'untitled'
    const ext = options?.ext || 'txt';
    const last_modified = new Date()
    var path
    var entry
    const isdir = type === 'directory'
    if (isdir) {
      /*
      let i = 1;
      while (true) {
        name = `${name} ${i++}`;
      }
      */
      throw new Error('Method not implemented.');
    } else {
      for (let i = 0; true; i++) {
        var name
        if (i == 0) {
          name = `${namebase}`;
        } else {
          name = `${namebase} ${i}`;
        }
        const newname = `${name}${ext}`
  
        path = PathExt.join(parentPath, newname)
        let dirname = PathExt.dirname(path)
        var formData = new FormData();
        formData.append('parent_id', await this.get_file_id(dirname));
        const r = await this.upload_file_content(
          client,
          newname,
          "",
          formData,
          last_modified,
        )
        if (!r.ok && r.status == 409) {
          continue
        }
        const res_json = await r.json();
        entry = res_json.entries[0]
        console.log(entry)
        break
      }
    }

    let data: Contents.IModel = {
      name: entry.name,
      path: this.get_abspath_and_set_to_map(parentPath, entry.name, entry.id, isdir),
      created: new Date(entry.content_created_at).toISOString(),
      last_modified: new Date(entry.content_created_at).toISOString(),
      format: "text",
      mimetype: '',
      content: null,
      writable: true,
      type: 'file'
    }

    this._fileChanged.emit({
      type: 'new',
      oldValue: null,
      newValue: data
    });

    return data;
  }

  async delete(path: string): Promise<void> {
    var client = new (new BoxSdk()).BasicBoxClient({
      accessToken: this._accessToken, noRequestMode: true});

    const id = await this.get_file_id(path)

    const opt = await client.files.delete({id})
    var r = await fetch(opt.url, {
      method: opt.method,
      headers: opt.headers,
      mode: opt.mode,
      cache: "no-store"
    })
    if (!r.ok) {
      throw new Error();
    }

    this.delete_from_map(path)
  }

  async rename(path: string, newPath: string): Promise<Contents.IModel> {
    var client = new (new BoxSdk()).BasicBoxClient({
      accessToken: this._accessToken, noRequestMode: true});

    const id = await this.get_file_id(path)
    const newname = this.get_file_name(newPath)
    let dirname = PathExt.dirname(path)

    const opt = await client.files.updateInfo({id, name: newname})
    var r = await fetch(opt.url, {
      method: opt.method,
      headers: opt.headers,
      mode: opt.mode,
      body: opt.body,
      cache: "no-store"
    })
    const res_json = await r.json();
    this.get_abspath_and_set_to_map(dirname, newname, id, this._boxAbsPathMap.get(path)!.isdir)

    return {
      name: newname,
      path: newPath,
      created: new Date(res_json.content_created_at).toISOString(),
      last_modified: new Date(res_json.content_modified_at).toISOString(),
      format: "text",
      mimetype: '',
      content: null,
      writable: true,
      type: 'file'
    }
  }

  async save(
    path: string,
    options?: Partial<Contents.IModel>
  ): Promise<Contents.IModel> {
    var format = options?.format;
    const content = options?.content;
    var client = new (new BoxSdk()).BasicBoxClient({
      accessToken: this._accessToken, noRequestMode: true});
    let basename = PathExt.basename(path)
    let dirname = PathExt.dirname(path)

    var contentBlob
    if (format == "base64") {
      contentBlob = await base64DecodeAsBlob(content);
    } else if (format == "json") {
      contentBlob = JSON.stringify(content, null, 2);
    } else if (format == "text") {
      contentBlob = content
    } else {
      format = "text"
      contentBlob = content
    }

    var formData = new FormData();

    var name
    if (options && 'name' in options) {
      name = basename
      formData.append('parent_id', await this.get_file_id(dirname));
    } else {
      name = this.get_file_name(path)
      formData.append('id', await this.get_file_id(path));
    }
    const last_modified = new Date()

    const r = await this.upload_file_content(
      client,
      name,
      contentBlob,
      formData,
      last_modified
    )
    console.log(r)
    const res_json = await r.json();
    console.log(res_json)

    this._fileChanged.emit({
      type: 'save',
      oldValue: null,
      newValue: contentBlob
    });

    let data: Contents.IModel;
    try {
      var id = await this.get_file_id(path);
      data = await this.get_file_content(client, id, path, options, last_modified)
    } catch (e) {
      data = {
        name,
        path,
        created: last_modified.toISOString(),
        last_modified: last_modified.toISOString(),
        format: format,
        mimetype: '',
        content: null,
        writable: true,
        type: 'file'
      }
    }
    return data
  }

  async copy(path: string, toLocalDir: string): Promise<Contents.IModel> {
    var client = new (new BoxSdk()).BasicBoxClient({
      accessToken: this._accessToken, noRequestMode: true});
    
    let basename = PathExt.basename(path)
    let dirname = PathExt.dirname(path)

    const id = await this.get_file_id(path)
    const parent_id = await this.get_file_id(toLocalDir)

    const ext = PathExt.extname(basename)
    const namebase = basename.slice(0, basename.length - ext.length)

    for (let i = (dirname === toLocalDir ? 1 : 0); true; i++) {
      var name
      if (i == 0) {
        name = `${namebase}`;
      } else {
        name = `${namebase} ${i}`;
      }
      const newname = `${name}${ext}`

      const opt = await client.files.copy({
        id, name: newname, body: {parent: {id: parent_id}}})
      var r = await fetch(opt.url, {
        method: opt.method,
        headers: opt.headers,
        mode: opt.mode,
        body: opt.body,
        cache: "no-store"
      })
      if (!r.ok && r.status == 409) {
        continue
      }
      const res_json = await r.json();
      const newpath = this.get_abspath_and_set_to_map(toLocalDir, newname, res_json.id, false)
      return {
        name: res_json.name,
        path: newpath,
        last_modified: new Date(res_json.content_modified_at).toISOString(),
        created: new Date(res_json.content_created_at).toISOString(),
        format: null,
        mimetype: '',
        content: '',
        writable: true,
        type: 'file'
      }
    }
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
      mode: opt.mode,
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
      mode: opt.mode,
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
      [
        'md',
        'yml', 'yaml',
        'json',
        'py',
      ].includes(res_json.extension) ||
      [
        "application/x-javascript",
        "image/svg+xml",
      ].includes(mimetype)
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

  private async upload_file_content(
    client: any,
    name: string,
    contentBlob: any,
    formData: FormData,
    last_modified: Date
  ) {
    const file = new File([contentBlob], name, {
      type: "",
      lastModified: last_modified.getTime(),
    })
    formData.append(name, file);

    const optupload = await client.files.upload({body: formData})
    if (optupload.headers && 'Content-Type' in optupload.headers) {
      delete optupload.headers['Content-Type'];
    }
    var r = await fetch(optupload.url, {
      method: optupload.method,
      headers: optupload.headers,
      body: optupload.body,
      mode: optupload.mode,
      cache: "no-store"
    })
    return r
  }
  
  private async get_file_id(path: string): Promise<string> {
    let id = this._boxAbsPathMap.get(path)?.id
    if (id) {
      return id
    }
    let dirname = PathExt.dirname(path)
    if (dirname) {
      await this.get_file_id(dirname)
      await this.get(dirname, {content: true})
    } else {
      await this.get("", {content: true})
      return "0"
    }
    id = this._boxAbsPathMap.get(path)?.id
    if (id) {
      return id
    }
    throw new Error('ID not found for path');
  }

  private get_abspath_and_set_to_map(dirpath: string, name: string, id: string, isdir: boolean): string {
    const path = PathExt.join(dirpath, name)
    this._boxAbsPathMap.set(path, {id: id, isdir: isdir})
    return path
  }

  private delete_from_map(path: string) {
    this._boxAbsPathMap.delete(path)
  }
  
  private get_file_name(path: string): string {
    let basename = PathExt.basename(path)
    return basename
  }
  
  private _isDisposed = false;
  private _fileChanged = new Signal<this, Contents.IChangedArgs>(this);
  private _boxAbsPathMap = new Map([
    ["", {id: "0", isdir: true}],
    ["/", {id: "0", isdir: true}]
  ])
  private _accessToken: string = "";
}
