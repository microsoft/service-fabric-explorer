import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from './logger';

export interface IContext {

}

export class ExtensionsLoader {
  constructor(private logger: Logger, private folderLocation: string, private context: IContext) {

  }

  async loadExtensions() {
    const folders = await fs.readdir(this.folderLocation);
    const results = await Promise.all(folders.map(Extensionfolder => this.loadExtension(path.join(this.folderLocation, Extensionfolder), Extensionfolder)));
    return results;
  }

  async loadExtension(folderLocation: string, folderName: string) {
    let status = {
      message: '',
      exactError: '',
      extension: folderName,
      loaded: true
    }
    const configFile = path.join(folderLocation, 'config.json');
    let config = null;

    try {
      config = await this.loadJsonFile(configFile);
    } catch (e) {
      status.exactError = e;
      status.message = 'Could not load config.json';
      status.loaded = false;
      return status;
    }

    const entryFile = path.join(folderLocation, config.entry);
    let entry = null;

    try {
      entry = (await this.loadFile(entryFile));
    } catch (e) {
      status.exactError = e;
      status.message = `Could not load entry point: ${config.entry}`;
      status.loaded = false;
      return status;
    }

    try {
      await entry.initialize(this.context);
    } catch (e) {
      status.exactError = e;
      status.message = `Could not initialize entry point: ${config.entry}`;
      status.loaded = false;
      return status;
    }

    return status;
  }

  async readExtensionFolder(folder: string) {
    const folders = await fs.readdir(__dirname + '/' + folder);
    const results = await Promise.all(folders.map(async (Extensionfolder) => {
      return await this.loadExtension(path.join(__dirname, folder, Extensionfolder), Extensionfolder);
    }))
  }

  async loadJsonFile(fileLocation: string) {
    return JSON.parse(await fs.readFile(fileLocation, "utf8"));
  }

  async loadFile(fileLocation: string) {
    const jsonFIle = path.resolve(fileLocation);
    const requireDynamically = eval('require');

    return await requireDynamically(jsonFIle)
  }

}