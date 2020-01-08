import { Component, OnInit, Input } from '@angular/core';
import { ImageStore, ImageStoreItem } from 'src/app/Models/DataModels/ImageStore';
import { SettingsService } from 'src/app/services/settings.service';
import { ListColumnSetting, ListSettings } from 'src/app/Models/ListSettings';
import { ListColumnSettingWithDisplaySize } from '../display-size-column/display-size-column.component';
import { ListColumnSettingWithDisplayName } from '../display-name-column/display-name-column.component';
import { ListColumnSettingWithImageStoreActions } from '../folder-actions/folder-actions.component';

@Component({
  selector: 'app-imagestore-viewer',
  templateUrl: './imagestore-viewer.component.html',
  styleUrls: ['./imagestore-viewer.component.scss']
})
export class ImagestoreViewerComponent implements OnInit {

  @Input() imagestoreRoot: ImageStore;

  fileListSettings: ListSettings;

  constructor(private settings: SettingsService) { }

  ngOnInit() {
    console.log(this.imagestoreRoot)
    this.setup();
  }

  //TODO MAKE SURE SIZE ALWAYS DISPLAYS PROPERLY AND ADD A TABLE LAYOUT FOR THE OPTIONS
  setup() {
    this.fileListSettings = this.settings.getNewOrExistingListSettings("imagestore", ["name"], [
      // new ListColumnSetting("", "", null, true, (item: ImageStoreItem, property) => {
      //     if (this.$scope.imagestoreRoot.data.actionsEnabled()) {
      //         return `<sfx-image-store-file-view item="item"></sfx-image-store-file-view>`;
      //     }

      //     return "";
      // }),
      new ListColumnSettingWithImageStoreActions(this.imagestoreRoot),
      new ListColumnSettingWithDisplayName(this.imagestoreRoot),
      new ListColumnSettingWithDisplaySize(this.imagestoreRoot),
      new ListColumnSetting("modifiedDate", "Date modified"),
      new ListColumnSetting("fileCount", "Count of Files", ["isFolder", "fileCount"])
  ]);
  }

  openFolder(relativePath: string): void {
    this.imagestoreRoot.expandFolder(relativePath).subscribe();
  }

}
