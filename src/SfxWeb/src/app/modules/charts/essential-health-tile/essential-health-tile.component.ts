import { AfterContentChecked, AfterContentInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChild, ContentChildren, Directive, Input, OnChanges, OnInit, QueryList, TemplateRef } from '@angular/core';

export interface IEssentialListItem {
  displayText?: string;
  copyTextValue?: string;
  descriptionName?: string;
  selectorName?: string;
  displaySelector?: boolean;
}

interface IEssentialListItemInternal extends IEssentialListItem {
  ref?: TemplateRef<any>;
}

@Directive({ selector: '[essentialTemplate]'})
export class EssentialTemplateDirective {
  @Input() id: string;

  constructor(public templateRef: TemplateRef<any>) {
  }

  public getId() {
    return this.id;
  }
}

@Component({
  selector: 'app-essential-health-tile',
  templateUrl: './essential-health-tile.component.html',
  styleUrls: ['./essential-health-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EssentialHealthTileComponent implements OnInit, AfterViewInit, OnChanges {

  @Input() healthState;
  @Input() listItems: IEssentialListItem[] = [];
  @Input() templateRefs: Record<string, TemplateRef<any>>;
  @ContentChildren(EssentialTemplateDirective, { descendants: true } ) test!: QueryList<EssentialTemplateDirective>;
  
  internalList: IEssentialListItemInternal[] = [];
  viewHasLoaded = false;

  constructor(private detectorRef: ChangeDetectorRef) { }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    this.viewHasLoaded = true;
    this.checkForTemplates();
    this.detectorRef.detectChanges();
  }

  ngOnChanges() {
    this.checkForTemplates()
    console.log(this)
  }

  checkForTemplates() {
    if(this.viewHasLoaded) {
      this.internalList = this.listItems.map(item => {
        let copy = {...item} as IEssentialListItemInternal;
  
        if(copy.displaySelector) {
          copy.ref = this.test.toArray().find(directive => directive.id === copy.selectorName)?.templateRef;
        }
  
        return copy;
      })
    }
  }

}
