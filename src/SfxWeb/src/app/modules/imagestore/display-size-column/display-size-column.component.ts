import { Component, OnInit, OnChanges } from '@angular/core';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ImageStore, ImageStoreItem } from 'src/app/Models/DataModels/ImageStore';
import { Utils } from 'src/app/Utils/Utils';

@Component({
  selector: 'app-display-size-column',
  templateUrl: './display-size-column.component.html',
  styleUrls: ['./display-size-column.component.scss']
})
export class DisplaySizeColumnComponent implements OnChanges, OnInit, DetailBaseComponent {

  item: ImageStoreItem;
  listSetting: ListColumnSettingWithDisplaySize;

  date: any;
  loadButton: boolean;
  size = '';
  loading = false;
  constructor() { }

  ngOnInit() {
    this.ngOnChanges();
  }

  ngOnChanges() {
    if (this.item.isFolder === 1){
     return;
    }
    const sizeData = this.listSetting.imagestore.getCachedFolderSize(this.item.path);
    this.size = sizeData.size > -1 ? Utils.getFriendlyFileSize(sizeData.size) : '';
    const loading = sizeData.loading ? 'rotate' : '';
    this.date = sizeData.date ? sizeData.date.toLocaleString() : '';
    this.loadButton = this.size.length === 0 && !loading;
    this.loading = sizeData.loading;
  }

  loadFolderSize(item: ImageStoreItem) {
    if (item.isFolder === -1) {
      const sizeData = this.listSetting.imagestore.getCachedFolderSize(item.path);
      if (!sizeData.loading) {
          this.listSetting.imagestore.cachedCurrentDirectoryFolderSizes[item.path].loading = true;
          sizeData.loading = true;
          this.loading = true;
      }else {
          return;
      }

      this.listSetting.imagestore.getFolderSize(item.path).subscribe(size => {
        this.listSetting.imagestore.cachedCurrentDirectoryFolderSizes[item.path] = {size: +size.FolderSize,
                                                                                      loading: false,
                                                                                      date: new Date() };
        item.size = +size.FolderSize;
        item.displayedSize = Utils.getFriendlyFileSize(+size.FolderSize);
        this.listSetting.imagestore.currentFolder.childrenFolders.find(folder => folder.path === item.path).size = +size.FolderSize;
        this.listSetting.imagestore.allChildren = [].concat(this.listSetting.imagestore.allChildren);
        this.ngOnChanges();
      }, () => {
        this.listSetting.imagestore.cachedCurrentDirectoryFolderSizes[item.path].loading = false;
        this.loading = false;
      });

      this.ngOnChanges();
    }
  }
}


export class ListColumnSettingWithDisplaySize extends ListColumnSetting {
  template = DisplaySizeColumnComponent;
  imagestore: ImageStore;
  public constructor(imagestore: ImageStore) {
      super('displayedSize', 'Size', ['isFolder', 'size', 'displayName']);
      this.imagestore = imagestore;
  }
}
