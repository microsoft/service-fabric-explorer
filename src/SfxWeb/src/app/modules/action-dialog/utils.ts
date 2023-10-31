import { Type } from "@angular/core";
import { DialogBodyDirective } from "./dialog-body.directive";
import { DialogBodyComponent } from "./DialogBodyComponent";

export class ActionDialogUtils {

    public static createChildComponent(parent: DialogBodyDirective, inputs: any, template: Type<DialogBodyComponent>, disableSubmit?: (boolean)=>void) : DialogBodyComponent {
    
        var child: DialogBodyComponent = parent.viewContainerRef.createComponent(template).instance;
        child.inputs = inputs;    
        if (child.disableSubmit && disableSubmit) {
            child.disableSubmit.subscribe((value) => disableSubmit(value));
        }

        return child;
    }
}