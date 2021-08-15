import {
  AbstractFile,
  AbstractReadStream,
  AbstractWriteStream,
  createError,
  OpenOptions,
  OpenWriteOptions,
  path,
} from "isomorphic-fs";
import { WfsWriteStream } from "./WfsWriteStream";
import { WfsFileSystem } from "./WfsFileSystem";
import { WfsReadStream } from "./WfsReadStream";

export class WfsFile extends AbstractFile {
  constructor(file: WfsFileSystem, path: string) {
    super(file, path);
  }

  public async _createReadStream(
    options: OpenOptions
  ): Promise<AbstractReadStream> {
    return new WfsReadStream(this, options);
  }

  public async _createWriteStream(
    options: OpenWriteOptions
  ): Promise<AbstractWriteStream> {
    const fs = await (this.fs as WfsFileSystem)._getFS();
    if (options.create) {
      await new Promise<void>((resolve, reject) => {
        const fullPath = path.joinPaths(this.fs.repository, this.path);
        fs.root.getFile(
          fullPath,
          { create: true },
          () => resolve(),
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
    return new WfsWriteStream(this, options);
  }

  public async _rm(): Promise<void> {
    const fs = await (this.fs as WfsFileSystem)._getFS();
    return new Promise<void>((resolve, reject) => {
      const fullPath = path.joinPaths(this.fs.repository, this.path);
      fs.root.getFile(
        fullPath,
        { create: false },
        (entry) =>
          entry.remove(resolve, (e) =>
            reject(
              createError({
                repository: this.fs.repository,
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
