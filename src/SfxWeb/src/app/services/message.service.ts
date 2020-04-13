import { Injectable } from '@angular/core';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

export enum MessageSeverity {
  Info = "Info", 
  Warn = "Warning", 
  Err = "Error"
}

export interface IToast {
  header: string;
  body: string;
  duration: number;
  class: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  toasts: IToast[] = [];

  constructor() { }

  remove(toast: IToast) {
    this.toasts = this.toasts.filter(t => t != toast);
  }

  getClass(severity: MessageSeverity): string {
    const colors = {}
    colors[MessageSeverity.Info] = "bg-info";
    colors[MessageSeverity.Warn] = "bg-warning";
    colors[MessageSeverity.Err] = "bg-danger";

    return colors[severity];
  }

  public showMessage(message: string, severity: MessageSeverity, header: string = "", duration: number = 50000) {
    this.toasts.push({
      header: `${severity} ${header}`,
      body: message,
      duration,
      class: this.getClass(severity)
    })
  }

  public getSuccessMessage(apiDesc: string, response: HttpResponse<any>): string {
    return null;
  }

  public getErrorMessage(apiDesc: string, response: HttpErrorResponse): string {
      if (response.status === 404) {
          // By default exclude 404 error for all get requests
          return null;
      }
      return this.getErrorMessageInternal(apiDesc, response);
  }

  protected getErrorMessageInternal(apiDesc: string, response: HttpErrorResponse): string {
      let message = `${apiDesc} failed`;
      if (response.error.Error && response.error.Error.Code && response.error.Error.Message) {
          message += `.\r\nCode: ${response.error.Error.Code}\r\nMessage: ${response.error.Error.Message}`;
      } else if (response.statusText) {
          message += ` (${response.statusText})`;
      }
      return message;
  }
}
