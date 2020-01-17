import { Component, OnInit } from '@angular/core';
import { TreeService } from './services/tree.service';
import { RefreshService } from './services/refresh.service';
import { AdalService } from './services/adal.service';
import { SettingsService } from './services/settings.service';
import { StorageService } from './services/storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{

  treeWidth: string = "450px";

  constructor(public treeService: TreeService,
              private refreshService: RefreshService,
              public adalService: AdalService,
              private storageService: StorageService) {

  }

  ngOnInit() {
    this.treeService.init();
    this.refreshService.init();

    this.treeWidth = this.storageService.getValueString("treeWidth", "450px");
  }
  
  resize($event: number): void {
    //have to subtract the offset
    this.treeWidth = ($event + 5).toString() + 'px';
    this.storageService.setValue("treeWidth", this.treeWidth);
  }
}
