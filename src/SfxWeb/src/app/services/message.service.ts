import { Injectable } from '@angular/core';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { StorageService } from './storage.service';

export enum MessageSeverity {
  Info = 'Info',
  Warn = 'Warning',
  Err = 'Error'
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

  static readonly LOCALSTORAGE_KEY_SUPPRES = 'SFX-supress-message';

  toasts: IToast[] = [];
  _suppressMessages = false;
  constructor(private storageService: StorageService) {
    this.suppressMessage = this.storageService.getValueBoolean(MessageService.LOCALSTORAGE_KEY_SUPPRES, false);
  }

  remove(toast: IToast) {
    this.toasts = this.toasts.filter(t => t != toast);
  }

  getClass(severity: MessageSeverity): string {
    const colors = {};
    colors[MessageSeverity.Info] = 'bg-info';
    colors[MessageSeverity.Warn] = 'bg-warning';
    colors[MessageSeverity.Err] = 'bg-danger';

    return colors[severity];
  }

  public get suppressMessage() {
    return this._suppressMessages;
  }

  public set suppressMessage(b: boolean) {
    this.storageService.setValue(MessageService.LOCALSTORAGE_KEY_SUPPRES, b);
    this._suppressMessages = b;
  }

  public showMessage(message: string, severity: MessageSeverity, header: string = '', duration: number = 5000) {
    if (!this.suppressMessage) {
      this.toasts.push({
        header: `${severity} ${header}`,
        body: message,
        duration,
        class: this.getClass(severity)
      });
    }
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
