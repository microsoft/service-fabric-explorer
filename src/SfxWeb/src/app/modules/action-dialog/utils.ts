import { Type } from "@angular/core";
import { DialogBodyDirective } from "./dialog-body.directive";
import { DialogBodyComponent } from "./DialogBodyComponent";

export class ActionDialogUtils {

    public static createChildComponent(parent: DialogBodyDirective, child: DialogBodyComponent, inputs: any, template: Type<DialogBodyComponent>, disableSubmit?: (boolean)=>void) : DialogBodyComponent {
    
        child = parent.viewContainerRef.createComponent(template).instance;
        child.inputs = inputs;    
        if (child.disableSubmit) {
            child.disableSubmit.subscribe((value) => disableSubmit(value));
        }

        return child;
    }
}