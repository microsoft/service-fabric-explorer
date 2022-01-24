import { Component, ElementRef, HostListener, Injector, Input, OnChanges, TemplateRef, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Node } from 'src/app/Models/DataModels/Node';
import { DataService } from 'src/app/services/data.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent extends BaseControllerDirective implements OnChanges {
  static readonly baseScale = 'scale(1)';

  @Input() listTemplate: TemplateRef<any>;
  @Input() nodes: Node[] = [];
  @Input() groupByNodeType = false;

  matrix: Record<string, Node[]>;

  showScaleButton = false;
  scaleToFit = false;
  scale = MapComponent.baseScale;

  @ViewChild('container') private container: ElementRef;
  @ViewChild('map') private map: ElementRef;

  constructor(public data: DataService, injector: Injector) {
    super(injector);
  }

  ngOnChanges() {
    this.updateNodes(this.nodes);
    this.onResize();
  }

  @HostListener('window:resize')
  onResize() {
    if (this.map && this.container) {
      const scale = Math.min(1, this.container.nativeElement.clientWidth / (this.map.nativeElement.clientWidth + 20));

      this.showScaleButton = scale < 1;

      if (this.showScaleButton && this.scaleToFit) {
        this.scale = `scale(${scale})`;
      }else{
        this.scale = MapComponent.baseScale;
      }
    }else{
      this.scale = MapComponent.baseScale;
    }
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.data.nodes.refresh(messageHandler);
  }

  public updateNodes(nodes: Node[]) {
    this.data.nodes.ensureInitialized().subscribe(() => {
      const matrix = {};

      this.data.nodes.faultDomains.forEach(fd => {
        matrix[fd] = [];

        this.data.nodes.upgradeDomains.forEach(ud => {
          matrix[`${fd}${ud}`] = [];
          matrix[ud] = [];
        });
      });

      nodes.forEach(node => {
        matrix[node.faultDomain + node.upgradeDomain].push(node);
        matrix[node.faultDomain].push(node);
        matrix[node.upgradeDomain].push(node);
      });

      this.matrix = matrix;
    });

  }

  trackByFn(index, udOrFd: string) {
    return udOrFd;
  }
}
