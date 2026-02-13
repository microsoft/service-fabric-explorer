import { Component, OnInit, Input } from '@angular/core';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';

hljs.registerLanguage('xml', xml);

@Component({
  selector: 'app-manifest-viewer',
  templateUrl: './manifest.component.html',
  styleUrls: ['./manifest.component.scss']
})
export class ManifestComponent implements OnInit {

  @Input() manifestName = '';
  @Input() manifest = '';

  highlightedManifest = '';
  constructor() { }

  ngOnInit() {
    this.highlightedManifest = hljs.highlight(this.manifest, { language: 'xml' }).value;
  }

}
