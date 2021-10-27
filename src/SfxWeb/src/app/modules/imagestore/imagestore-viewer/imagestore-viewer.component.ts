import { Component, OnInit, Input } from '@angular/core';
import { ImageStore } from 'src/app/Models/DataModels/ImageStore';
import { SettingsService } from 'src/app/services/settings.service';
import { ListColumnSetting, ListSettings, ListColumnSettingWithUtcTime } from 'src/app/Models/ListSettings';
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
    this.setup();
  }

  setup() {
    this.fileListSettings = this.settings.getNewOrExistingListSettings('imagestore', ['name'], [
      new ListColumnSettingWithImageStoreActions(this.imagestoreRoot),
      new ListColumnSettingWithDisplayName(this.imagestoreRoot),
      new ListColumnSettingWithDisplaySize(this.imagestoreRoot),
      new ListColumnSettingWithUtcTime('modifiedDate', 'Date modified'),
      new ListColumnSetting('fileCount', 'Count of Files', {sortPropertyPaths: ['isFolder', 'fileCount']})
    ]);
  }

  openFolder(relativePath: string): void {
    this.imagestoreRoot.expandFolder(relativePath).subscribe();
  }

}
