import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-manifest-viewer',
  templateUrl: './manifest.component.html',
  styleUrls: ['./manifest.component.scss']
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
