import { Component, OnInit, Input, ViewChild, ComponentFactoryResolver, OnChanges, ComponentRef } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ResolverDirective } from '../resolver.directive';
import { Type } from '@angular/core';
import { ListColumnSetting } from 'src/app/Models/ListSettings';

@Component({
  selector: 'app-detail-table-resolver',
  templateUrl: './detail-table-resolver.component.html',
  styleUrls: ['./detail-table-resolver.component.scss']
})
export class DetailTableResolverComponent implements OnInit, OnChanges {
  @Input() cache: Record<string, any>;

  @Input() item: any;
  @Input() setting: ListColumnSetting;
  @Input() template: Type<any>;
  @Input() itemValue: any;

  ref: ComponentRef<any>;
  @ViewChild(ResolverDirective, {static: true}) templateHost: ResolverDirective;


  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit() {
    this.loadComponent();
  }

  ngOnChanges(data: any) {
    this.loadComponent();
  }

  loadComponent() {

    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.template);

    const viewContainerRef = this.templateHost.viewContainerRef;
    viewContainerRef.clear();

    this.ref = viewContainerRef.createComponent(componentFactory);

    this.setData();
  }

  setData() {
    // if (!this.ref) {
    //   return;
    // }

    (this.ref.instance as DetailBaseComponent).item = this.item;
    (this.ref.instance as DetailBaseComponent).listSetting = this.setting;
    (this.ref.instance as DetailBaseComponent).cache = this.cache;
  }

}
