import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, Directive, Input, OnChanges, OnInit, QueryList, TemplateRef, inject } from '@angular/core';

export interface IEssentialListItem {
  displayText?: string;
  copyTextValue?: string;
  descriptionName?: string;
  selectorName?: string;
  displaySelector?: boolean;
  allowWrap?: boolean;
}

interface IEssentialListItemInternal extends IEssentialListItem {
  ref?: TemplateRef<any>;
}

@Directive({
    selector: '[appEssentialTemplate]',
    standalone: false
})
export class EssentialTemplateDirective {
  templateRef = inject<TemplateRef<any>>(TemplateRef);

  @Input() id: string;

  public getId() {
    return this.id;
  }
}

@Component({
    selector: 'app-essential-health-tile',
    templateUrl: './essential-health-tile.component.html',
    styleUrls: ['./essential-health-tile.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class EssentialHealthTileComponent implements AfterViewInit, OnChanges {
  private detectorRef = inject(ChangeDetectorRef);


  @Input() healthState;
  @Input() listItems: IEssentialListItem[] = [];
  @Input() templateRefs: Record<string, TemplateRef<any>>;
  @ContentChildren(EssentialTemplateDirective, { descendants: true } ) test!: QueryList<EssentialTemplateDirective>;

  internalList: IEssentialListItemInternal[] = [];
  viewHasLoaded = false;

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
        const copy = {...item} as IEssentialListItemInternal;

        if (copy.displaySelector) {
          copy.ref = this.test.toArray().find(directive => directive.id === copy.selectorName)?.templateRef;
        }

        return copy;
      });
    }
  }

}
