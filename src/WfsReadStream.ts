import {
  AbstractReadStream,
  createError,
  OpenReadOptions,
  joinPaths,
  Source,
  SourceType,
} from "univ-fs";
import { WfsFile } from "./WfsFile";
import { WfsFileSystem } from "./WfsFileSystem";

export class WfsReadStream extends AbstractReadStream {
  constructor(file: WfsFile, options: OpenReadOptions) {
    super(file, options);
  }

  public async _close(): Promise<void> {
    this._dispose();
  }

  public async _read(size?: number): Promise<Source | null> {
    const file = await this._open();
    const fileSize = file.size;
    if (fileSize <= this.position) {
      return null;
    }
    let end = this.position + (size == null ? this.bufferSize : size);
    if (fileSize < end) {
      end = fileSize;
    }
    return file.slice(this.position, end);
  }

  protected async _seek(start: number): Promise<void> {
    this.position = start;
  }

  protected getDefaultSourceType(): SourceType {
    return "Blob";
  }

  private _dispose() {}

  private async _open(): Promise<File> {
    const file = this.file as WfsFile;
    const wfs = file.fs as WfsFileSystem;
    const fs = await wfs._getFS();
    return new Promise<File>(async (resolve, reject) => {
      const repository = wfs.repository;
      const path = file.path;
      const handle = (e: any) => reject(createError({ repository, path, e }));
      const fullPath = joinPaths(repository, path);
      fs.root.getFile(
        fullPath,
        { create: false },
        (entry) => {
          entry.file((file) => {
            resolve(file);
          }, handle);
        },
        handle
      );
    });
  }
}