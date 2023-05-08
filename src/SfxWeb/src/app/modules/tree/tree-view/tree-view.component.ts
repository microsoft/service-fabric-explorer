import { Component, ViewChild, ElementRef, Output, EventEmitter, DoCheck, Input, AfterViewInit} from '@angular/core';
import { TreeService } from 'src/app/services/tree.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { RestClientService } from 'src/app/services/rest-client.service';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { TelemetryEventNames } from 'src/app/Common/Constants';
import { FocusService } from 'src/app/services/focus.service';

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss']
})
export class TreeViewComponent implements DoCheck, AfterViewInit {

  @Input() smallWindowSize = false;
  @Output() treeResize = new EventEmitter<number>();

  public canExpand = false;
  public focused = false;
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

  goToTroubleshootingGuides(): void {
    window.open('https://aka.ms/sfxtroubleshootingguides', '_blank');
    this.telemService.trackActionEvent(TelemetryEventNames.TroubleShootingGuides, null, TelemetryEventNames.TroubleShootingGuides);
  }

  setFocus(focusState: boolean) {
    this.focused = focusState;
  }
}
