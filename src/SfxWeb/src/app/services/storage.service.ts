import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor(){
  }

  public getValueNumber(key: string, defaultValue: number): number {
      return this.getValueT<number>(key, (item) => Number(item), defaultValue);
  }

  public getValueString(key: string, defaultValue: string): string {
      return this.getValueT<string>(key, (item) => item, defaultValue);
  }

  public getValueBoolean(key: string, defaultValue: boolean): boolean {
      return this.getValueT<boolean>(key, (item) => item === 'true', defaultValue);
  }

  public getValueT<T>(key: string, convert: (item) => T, defaultValue: T): T {
      const value = localStorage.getItem(key);
      if (value !== null) {
          return convert(value);
      }
      return defaultValue;
  }

  public clear(key: string): void {
      if (this.isDefined(key)) {
          localStorage.removeItem(key);
      }
  }

  public isDefined(key: string): boolean {
      return !!localStorage.getItem(key);
  }

  public setValue(key: string, newValue: any) {
      const oldValue = localStorage.getItem(key) || '';
      if (oldValue !== newValue.toString()) {
          localStorage.setItem(key, newValue.toString());
      }
  }
}
