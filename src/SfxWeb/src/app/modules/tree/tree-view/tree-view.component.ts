import { Component, ViewChild, ElementRef, Output, EventEmitter, DoCheck, Input, AfterViewInit } from '@angular/core';
import { TreeService } from 'src/app/services/tree.service';
import { environment } from 'src/environments/environment';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { RestClientService } from 'src/app/services/rest-client.service';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { TelemetryEventNames } from 'src/app/Common/Constants';

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss']
})
export class TreeViewComponent implements DoCheck, AfterViewInit {

  @Input() smallWindowSize = false;
  @Output() treeResize = new EventEmitter<number>();

  public showBeta = environment.showBeta;
  public canExpand = false;
  @ViewChild('treeContainer') treeContainer: ElementRef;
  @ViewChild('tree') tree: ElementRef;
  constructor(public treeService: TreeService,
              private liveAnnouncer: LiveAnnouncer,
              public restClientService: RestClientService,
              private telemService: TelemetryService) { }

  ngAfterViewInit() {
    this.treeService.containerRef = this.treeContainer;
  }

  ngDoCheck(): void {
    if (this.tree) {
      this.canExpand = this.tree.nativeElement.scrollWidth > this.tree.nativeElement.clientWidth;
    }
  }

  leaveBeta() {
    const originalUrl =  location.href.replace('index.html', 'old.html');
    window.location.assign(originalUrl);
  }

  setWidth() {
    this.treeResize.emit(this.tree.nativeElement.scrollWidth + 20);
  }

  setSearchText(text: string) {
    this.treeService.tree.searchTerm = text;
    try {
      this.liveAnnouncer.announce(`${this.treeService.tree.childGroupViewModel.children[0].filtered} search results`);
    } catch {
      this.liveAnnouncer.announce(`0 search results`);

    }
  }

  sendHealthStateTelem() {
    this.telemService.trackActionEvent(TelemetryEventNames.SortByHealth, null, TelemetryEventNames.SortByHealth);
  }
}
