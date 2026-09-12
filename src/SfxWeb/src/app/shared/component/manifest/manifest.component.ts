import { Component, OnChanges, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { ExperienceService } from 'src/app/services/experience.service';

@Component({
    selector: 'app-manifest-viewer',
    templateUrl: './manifest.component.html',
    styleUrls: ['./manifest.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ManifestComponent implements OnChanges {
  experience = inject(ExperienceService);

  @Input() manifestName = '';
  @Input() manifest = '';

  manifestLines: Array<string> = [];
  constructor() { }

  ngOnChanges() {
    this.manifestLines = this.manifest.split(/\r?\n/).map(line => line + '\n');
  }

}
