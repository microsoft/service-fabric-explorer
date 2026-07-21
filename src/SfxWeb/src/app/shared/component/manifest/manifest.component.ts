import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-manifest-viewer',
    templateUrl: './manifest.component.html',
    styleUrls: ['./manifest.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ManifestComponent implements OnInit {

  @Input() manifestName = '';
  @Input() manifest = '';

  manifestLines: Array<string> = [];
  constructor() { }

  ngOnInit() {
    this.manifestLines = this.manifest.split(/\r?\n/).map(line => line + '\n');
  }

}
