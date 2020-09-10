import { DataModelBase } from './Base';
import { IRawImageStoreContent, IRawStoreFolderSize, IRawStoreFolder, IRawStoreFile } from '../RawDataTypes';
import { DataService } from 'src/app/services/data.service';
import { ClusterManifest } from './Cluster';
import { Utils } from 'src/app/Utils/Utils';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { of, Observable, observable } from 'rxjs';
import { map, catchError, mergeMap } from 'rxjs/operators';
import { MessageSeverity } from 'src/app/services/message.service';

export class ImageStore extends DataModelBase<IRawImageStoreContent> {
    public static reservedFileName = '_.dir';

    // These start as true to not display prematurely while loading correct state.
    public isAvailable = true;
    public isNative = true;
    public connectionString: string;
    public root: ImageStoreFolder = new ImageStoreFolder();
    public initialized = false;
    public cachedCurrentDirectoryFolderSizes: { [path: string]: {size: number, loading: boolean, date?: Date } } = {};

    public currentFolder: ImageStoreFolder;
    public pathBreadcrumbItems: IStorePathBreadcrumbItem[] = [];
    public allChildren: ImageStoreItem[];
    public isLoadingFolderContent = false;


    // helper to determine which way for slashes to be added in.
    public static slashDirection(path: string): boolean {
        return path.indexOf('\\') > -1;
    }

    public static chopPath(path: string): string[] {
        if (ImageStore.slashDirection(path)) {
            return path.split('\\');
        }

        return path.split('/');
    }

    constructor(public data: DataService) {
        super(data);
        this.root.path = '';
        this.root.displayName = 'Image Store';

        this.currentFolder = this.root;
        this.pathBreadcrumbItems = [{ path: this.root.path, name: this.root.displayName} as IStorePathBreadcrumbItem];

        const manifest = new ClusterManifest(data);
        manifest.refresh().subscribe(() => {
            this.connectionString = manifest.imageStoreConnectionString;
            this.isNative = this.connectionString.toLowerCase() === 'fabric:imagestore';

            if (this.isNative) {
                    // if we get an actual request error. i.e a 400 that means this cluster does not have the API
                    this.expandFolder(this.currentFolder.path).subscribe( () => {
                        this.isAvailable = true;
                        this.initialized = true;
                    }, err => {
                        this.isAvailable = false;
                        this.initialized = true;
                    });
            }
        });

    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawImageStoreContent> {
        if (!this.isNative || this.isLoadingFolderContent || !this.initialized) {
            return of(null);
        }
        return this.expandFolder(this.currentFolder.path);
    }

    protected updateInternal(): Observable<any> | void {
        return of(true);
    }

    public expandFolder(path: string, clearCache: boolean = false): Observable<IRawImageStoreContent> {
        if (this.isLoadingFolderContent) {
            return;
        }

        return Observable.create(observer => {
            this.isLoadingFolderContent = true;
            this.loadFolderContent(path).subscribe(raw => {
                this.setCurrentFolder(path, raw, clearCache);

                const index = this.pathBreadcrumbItems.findIndex(item => item.path === this.currentFolder.path);
                if (index > -1) {
                    this.pathBreadcrumbItems = this.pathBreadcrumbItems.slice(0, index + 1);
                } else {
                    this.pathBreadcrumbItems.push({ path: this.currentFolder.path, name: this.currentFolder.displayName } as IStorePathBreadcrumbItem);
                }

                this.isLoadingFolderContent = false;
                observer.next(raw);
            }, err => {
                this.isLoadingFolderContent = false;
                if (err.status === 400) {
                    observer.error(err);
                }else if (err.status === 404) {
                    this.data.message.showMessage(
                        `Directory ${path} does not appear to exist anymore. Navigating back to the base of the image store directory.`, MessageSeverity.Warn);
                    // go to the base directory
                    return this.expandFolder(this.root.path).subscribe( raw => {
                        observer.next(raw);
                    });
                }else{
                    observer.next(null);
                }
            });
        });
    }

    public deleteContent(path: string): Observable<any> {
        if (!path) {
            return of(null);
        }

        let item: ImageStoreItem = this.currentFolder.childrenFolders.find(folder => folder.path === path);
        if (!item) {
            item = this.currentFolder.childrenFiles.find(file => file.path === path);
        }

        if (!item || item.isReserved) {
            return of(null);
        }

        return this.data.restClient.deleteImageStoreContent(path).pipe(map(() => this.refresh()));
    }

    public getCachedFolderSize(path: string): {size: number, loading: boolean, date?: Date } {
        let cachedData = this.cachedCurrentDirectoryFolderSizes[path];
        if (!cachedData) {
            cachedData = {size: -1, loading: false};
            this.cachedCurrentDirectoryFolderSizes[path] = cachedData;
        }
        return cachedData;
    }

    public getFolderSize(path: string): Observable<IRawStoreFolderSize> {
        return this.data.restClient.getImageStoreFolderSize(path);
    }

    private setCurrentFolder(path: string, content: IRawImageStoreContent, clearFolderSizeCache: boolean): void {
        if (clearFolderSizeCache) {
            this.cachedCurrentDirectoryFolderSizes = {};
        }
        const folder: ImageStoreFolder = new ImageStoreFolder();
        folder.path = path;
        const pathSegements = ImageStore.chopPath(path);
        folder.displayName = pathSegements[pathSegements.length - 1];

        folder.childrenFolders = content.StoreFolders.map(f => {
            const childFolder = new ImageStoreFolder(f);
            if (childFolder.path in this.cachedCurrentDirectoryFolderSizes) {
                childFolder.size = this.cachedCurrentDirectoryFolderSizes[childFolder.path].size;
            }

            return childFolder;
        });

        folder.childrenFiles = content.StoreFiles.map(f => new ImageStoreFile(f));
        folder.allChildren = [].concat(folder.childrenFiles).concat(folder.childrenFolders);
        folder.fileCount = folder.childrenFiles.length;

        this.currentFolder = folder;
    }

    private loadFolderContent(path: string, refresh: boolean = false): Observable<IRawImageStoreContent> {
        /*
        Currently only used to open up to a different directory/reload currently directory in the refresh interval loop

        Attempt to load that directory and if it recieves a 404, indicating a folder does not exist then attempt to load the base
        directory.

        If the base directory does not exist(really only due to nothing existing in the image store), then load in place of it an 'empty' image store base.

        */

        return Observable.create(observer => {
            this.data.restClient.getImageStoreContent(path).subscribe(raw => {
                if (refresh) {
                    this.setCurrentFolder(path, raw, false);
                }
                observer.next(raw);
            }, err => {
                // handle bug if root directory does not exist.
                if (err.status === 404 && path === this.root.path) {
                    observer.next({StoreFiles: [], StoreFolders: []});
                }else {
                    observer.error(err);
                }
            },
            () => {observer.complete(); });
        });
    }
}

export class ImageStoreItem {
    // Used for name based sorting in the table
    public isFolder: number;

    public path: string;
    public displayName: string;
    public isReserved: boolean;
    public displayedSize: string;
    public size: number;

    public uniqueId: string;

    constructor(path: string) {
        this.uniqueId = path;
        this.path = path;

        const pathSegements = ImageStore.chopPath(path);
        this.displayName = pathSegements[pathSegements.length - 1];
        this.isReserved = pathSegements[0] === 'Store' || pathSegements[0] === 'WindowsFabricStore' || this.displayName === ImageStore.reservedFileName;
    }
}

export class ImageStoreFolder extends ImageStoreItem {
    public isFolder = -1;
    public size = -1; // setting to -1 for sorting
    public fileCount: number;
    public isExpanded = false;
    public childrenFolders: ImageStoreFolder[];
    public childrenFiles: ImageStoreFile[];
    public allChildren: ImageStoreItem[];

    constructor(raw?: IRawStoreFolder) {
        super(raw ? raw.StoreRelativePath : '');
        if (!raw) {
            return;
        }

        this.path = raw.StoreRelativePath;
        this.fileCount = +raw.FileCount;
    }
}

export class ImageStoreFile extends ImageStoreItem {
    public isFolder = 1;

    public version: string;
    public modifiedDate: string;
    public size = 0;

    constructor(raw?: IRawStoreFile) {
        super(raw ? raw.StoreRelativePath : '');

        if (!raw) {
            return;
        }

        this.path = raw.StoreRelativePath;
        this.size = Number(raw.FileSize);
        this.displayedSize = Utils.getFriendlyFileSize(this.size);
        this.version = raw.FileVersion ? raw.FileVersion.VersionNumber : '';
        this.modifiedDate = raw.ModifiedDate;
    }
}

export interface IStorePathBreadcrumbItem {
    path: string;
    name: string;
}

