import { of } from 'rxjs';
import { ImageStore, ImageStoreFolder } from 'src/app/Models/DataModels/ImageStore';
import { DisplaySizeColumnComponent, ListColumnSettingWithDisplaySize } from './display-size-column.component';

describe('DisplaySizeColumnComponent', () => {
  it('displays the loaded size and refreshes the current folder rows without a root allChildren array', () => {
    const folder = new ImageStoreFolder();
    folder.path = 'Store/Example';
    const rows = [folder];
    const cached: ImageStore['cachedCurrentDirectoryFolderSizes'] = {
      [folder.path]: { size: -1, loading: false }
    };
    const store = {
      cachedCurrentDirectoryFolderSizes: cached,
      currentFolder: { childrenFolders: rows, allChildren: rows },
      getCachedFolderSize: (path: string) => cached[path],
      getFolderSize: () => of({ FolderSize: '18563403' })
    } as unknown as ImageStore;
    const component = new DisplaySizeColumnComponent();
    component.item = folder;
    component.listSetting = new ListColumnSettingWithDisplaySize(store);
    component.ngOnInit();
    expect(component.loadButton).toBeTrue();
    component.loadFolderSize(folder);
    expect(component.size).toBe('17.70 MB');
    expect(component.loading).toBeFalse();
    expect(component.loadButton).toBeFalse();
    expect(folder.size).toBe(18563403);
    expect(store.currentFolder.allChildren).toEqual(rows);
    expect(store.currentFolder.allChildren).not.toBe(rows);
  });
});
