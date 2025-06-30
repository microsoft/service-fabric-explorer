import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component,
        ContentChildren, Directive, Input, OnChanges, OnInit, QueryList, TemplateRef } from '@angular/core';
        
export interface IResourceItem {
  title: string;
  displayText?: string;
  boolValue?: boolean;
  selectorName?: string;
  displaySelector?: boolean;
}

interface IResourceItemInternal extends IResourceItem {
  ref?: TemplateRef<any>;
}

@Directive({ selector: '[resourcesTemplate]'})
export class ResourcesTemplateDirective {
  @Input() id: string;

  constructor(public templateRef: TemplateRef<any>) {
  }

  public getId() {
    return this.id;
  }
}

@Component({
  selector: 'service-resources-tile',
  templateUrl: './resources-tile.component.html',
  styleUrls: ['./resources-tile.component.scss']
})
export class ResourcesTileComponent implements AfterViewInit, OnChanges {
  
  @Input() title: string = "";
  @Input() listItems: IResourceItem[] = [];
  @Input() templateRefs: Record<string, TemplateRef<any>>;
  @ContentChildren(ResourcesTemplateDirective, { descendants: true } ) test!: QueryList<ResourcesTemplateDirective>;

  internalList: IResourceItemInternal[] = [];
  viewHasLoaded = false;

  constructor(private detectorRef: ChangeDetectorRef) { }

  ngAfterViewInit(): void {
    this.viewHasLoaded = true;
    this.checkForTemplates();
    this.detectorRef.detectChanges();
  }

  ngOnChanges() {
    this.checkForTemplates();
  }

  checkForTemplates() {
    if (this.viewHasLoaded) {
      this.internalList = this.listItems.map(item => {
        const copy = {...item} as IResourceItemInternal;

        if (copy.displaySelector) {
          copy.ref = this.test.toArray().find(directive => directive.id === copy.selectorName)?.templateRef;
        }

        return copy;
      });
    }
  }
}

