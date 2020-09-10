import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-manifest-viewer',
  templateUrl: './manifest.component.html',
  styleUrls: ['./manifest.component.scss']
})
export class ManifestComponent {

  @Input() manifestName = '';
  @Input() manifest = '';

  constructor() { }
}
