module Sfx {
    export class HttpClientProxy {
        public get defaults(): angular.IHttpProviderDefaults {
            throw new Error("Property not implemented.");
        }

        public get pendingRequests(): angular.IRequestConfig[] {
            throw new Error("Property not implemented.");
        }

        constructor(private httpClient: any) {
        }

        public get<T>(url: string, config?: angular.IRequestShortcutConfig): angular.IHttpPromise<T> {
            return <angular.IHttpPromise<T>>this.httpClient.getAsync(url);
        }

        public delete<T>(url: string, config?: angular.IRequestShortcutConfig): angular.IHttpPromise<T> {
            return <angular.IHttpPromise<T>>this.httpClient.deleteAsync(url);
        }

        public head<T>(url: string, config?: angular.IRequestShortcutConfig): angular.IHttpPromise<T> {
            return <angular.IHttpPromise<T>>this.httpClient.headAsync(url);
        }

        public jsonp<T>(url: string, config?: angular.IRequestShortcutConfig): angular.IHttpPromise<T> {
            throw new Error("Method not implemented.");
        }

        public post<T>(url: string, data: any, config?: angular.IRequestShortcutConfig): angular.IHttpPromise<T> {
            return <angular.IHttpPromise<T>>this.httpClient.postAsync(url, data);
        }

        public put<T>(url: string, data: any, config?: angular.IRequestShortcutConfig): angular.IHttpPromise<T> {
            return <angular.IHttpPromise<T>>this.httpClient.putAsync(url, data);
        }

        public patch<T>(url: string, data: any, config?: angular.IRequestShortcutConfig): angular.IHttpPromise<T> {
            return <angular.IHttpPromise<T>>this.httpClient.patchAsync(url, data);
        }
    }
}
