import { Template } from '@angular/compiler/src/render3/r3_ast';
import { AfterContentInit, AfterViewInit, Component, ContentChild, ContentChildren, Directive, Input, OnChanges, OnInit, QueryList, TemplateRef } from '@angular/core';

export interface IEssentialListItem {
  displayText?: string;
  copyTextValue?: string;
  descriptionName: string;
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
    console.log("test")
  }

  public getId() {
    return this.id;
  }
}

@Component({
  selector: 'app-essential-health-tile',
  templateUrl: './essential-health-tile.component.html',
  styleUrls: ['./essential-health-tile.component.scss']
})
export class EssentialHealthTileComponent implements OnInit, AfterViewInit, OnChanges {

  @Input() healthState;
  @Input() listItems: IEssentialListItem[] = [];
  @Input() templateRefs: Record<string, TemplateRef<any>>;
  @ContentChildren(EssentialTemplateDirective, { descendants: true } ) test!: QueryList<EssentialTemplateDirective>;
  
  internalList: IEssentialListItemInternal[] = [];
  viewHasLoaded = false;

  constructor() { }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    this.viewHasLoaded = true;
    this.test.changes.subscribe(changes => {
      console.log(changes)
    })  
    console.log(this.test.toArray()[0]);

    console.log(this.internalList)
  }

  ngOnChanges() {

    if(this.viewHasLoaded) {
      this.internalList = this.listItems.map(item => {
        let copy = {...item} as IEssentialListItemInternal;
  
        if(copy.displaySelector) {
          copy.ref = this.test.toArray().find(directive => directive.id === copy.selectorName)?.templateRef;
        }
  
        return copy;
      })
    }
    console.log(this)
  }

}
