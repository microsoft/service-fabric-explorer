import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-manifest-document', standalone: true, imports: [CommonModule, FormsModule],
  template: `<section class="document" aria-label="Manifest document">
    <header><strong>{{name || 'Manifest.xml'}}</strong><span>{{lines.length}} lines</span><div class="actions"><input type="search" aria-label="Find in manifest" placeholder="Find in manifest" [(ngModel)]="query"><label><input type="checkbox" [(ngModel)]="wrap"> Wrap lines</label><button type="button" (click)="copy()">Copy XML</button><button type="button" (click)="download()">Download</button></div></header>
    <div class="code-view" tabindex="0" aria-label="Manifest XML" [class.wrap]="wrap"><ol>@for (line of lines; track $index) { <li [class.match]="query && line.toLowerCase().includes(query.toLowerCase())"><code>{{line || ' '}}</code></li> }</ol></div>
    <footer>{{query ? matchCount + ' matching lines' : 'Read-only XML document'}}<span role="status">{{status}}</span></footer>
  </section>`,
  styles: [`:host{display:block;color:#e6edf3;font:15px/1.6 var(--font-family-ui)}.document{border:1px solid #30363d;border-radius:6px;overflow:hidden;background:#0d1117}header{display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:16px;background:#161b22}header>span,footer{font-size:15px;color:#8b949e}.actions{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin-left:auto}button,input{font:inherit;color:inherit}button,input[type=search]{background:#21262d;border:1px solid #484f58;border-radius:5px;padding:6px 10px}button{cursor:pointer}label{display:flex;gap:6px;align-items:center}button:focus-visible,input:focus-visible,.code-view:focus-visible{outline:2px solid #58a6ff;outline-offset:2px}.code-view{max-height:70vh;overflow:auto;padding:12px 0}.code-view ol{margin:0;padding-left:64px;min-width:max-content}.code-view.wrap ol{min-width:0}.code-view li{padding-left:12px;padding-right:20px;color:#6e7681;white-space:pre;font:15px/1.7 var(--font-family-mono)}.code-view.wrap li{white-space:pre-wrap;overflow-wrap:anywhere}code{color:#c9d1d9;font:inherit}.match{background:#9e6a0340}footer{display:flex;justify-content:space-between;gap:12px;padding:10px 16px;border-top:1px solid #30363d}@media(max-width:700px){.actions{margin-left:0}.actions input[type=search]{width:100%}}`],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class ManifestDocumentComponent implements OnChanges {
  @Input() name = '';
  @Input() xml = '';
  lines: string[] = [];
  query = '';
  wrap = false;
  status = '';
  private cdr = inject(ChangeDetectorRef);
  get matchCount() { return this.lines.filter(line => line.toLowerCase().includes(this.query.toLowerCase())).length; }
  ngOnChanges() { this.lines = this.xml.split(/\r?\n/); }
  async copy() {
    try { await navigator.clipboard.writeText(this.xml); this.status = 'XML copied.'; }
    catch { this.status = 'Clipboard unavailable. Select the XML to copy it.'; }
    this.cdr.markForCheck();
  }
  download() {
    const url = URL.createObjectURL(new Blob([this.xml], { type: 'application/xml' }));
    const link = document.createElement('a'); link.href = url; link.download = `${(this.name || 'Manifest').replace(/[^a-z0-9_.-]/gi, '_').replace(/\.xml$/i, '')}.xml`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
