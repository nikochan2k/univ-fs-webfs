import {
  AbstractFile,
  AbstractReadStream,
  AbstractWriteStream,
  createError,
  joinPaths,
  OpenOptions,
  OpenWriteOptions,
  SeekOrigin,
} from "univ-fs";
import { WfsFileSystem } from "./WfsFileSystem";
import { WfsReadStream } from "./WfsReadStream";
import { WfsWriteStream } from "./WfsWriteStream";

export class WfsFile extends AbstractFile {
  constructor(public wfsFS: WfsFileSystem, path: string) {
    super(wfsFS, path);
  }

  public async _createReadStream(
    options: OpenOptions
  ): Promise<AbstractReadStream> {
    return new WfsReadStream(this, options);
  }

  public async _createWriteStream(
    options: OpenWriteOptions
  ): Promise<AbstractWriteStream> {
    const wfsFS = this.wfsFS;
    const fs = await wfsFS._getFS();
    if (options.create) {
      await new Promise<void>((resolve, reject) => {
        const fullPath = joinPaths(wfsFS.repository, this.path);
        fs.root.getFile(
          fullPath,
          { create: true, exclusive: true },
          () => resolve(),
          (e) =>
            reject(
              createError({
                repository: wfsFS.repository,
                path: this.path,
                e,
              })
            )
        );
      });
    }
    const ws = new WfsWriteStream(this, options);
    if (!options.create) {
      if (options.append) {
        await ws.seek(0, SeekOrigin.End);
      } else {
        await ws._truncate(0);
      }
    }
    return ws;
  }

  public async _rm(): Promise<void> {
    const wfsFS = this.wfsFS;
    const fs = await wfsFS._getFS();
    return new Promise<void>((resolve, reject) => {
      const fullPath = joinPaths(wfsFS.repository, this.path);
      fs.root.getFile(
        fullPath,
        { create: false },
        (entry) =>
          entry.remove(resolve, (e) =>
            reject(
              createError({
                repository: wfsFS.repository,
                path: this.path,
                e,
              })
            )
          ),
        (e) =>
          reject(
            createError({
              repository: this.fs.repository,
              path: this.path,
              e,
            })
          )
      );
    });
  }
}
