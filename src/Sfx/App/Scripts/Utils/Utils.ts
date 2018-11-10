//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class Utils {
        private static SingleUrlRegExp = new RegExp("^https?:\/\/[^;,]+");

        /**
         * Check if the input value is numeric.
         * Solution comes from http://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric
         * @param value
         */
        public static isNumeric(value: any): boolean {
            return !isNaN(parseFloat(value)) && isFinite(value);
        }

        /**
         * Retrieve data object returned by IHttpPromise
         * @param promise
         */
        public static getHttpResponseData<T>(promise: angular.IHttpPromise<T>): angular.IPromise<T> {
            return promise.then(response => {
                return response.data;
            });
        }

        /**
         * Extract resolved property from nested object.
         *   e.g. result({ 'a': { 'b': { 'c': 1 } } }, "a.b.c") returns 1
         * Lodash version of result does not work here because b and c might
         * be function where _.result only call function when it is the last
         * element in the chain.
         * @param item
         * @param propertyPath
         */
        public static result(item: any, propertyPath: string) {
            let value = item;
            _.forEach(propertyPath.split("."), path => { value = _.result(value, path); });
            return value;
        }

        /**
         * Check if a giving object represents a Badge object
         * @param item
         */
        public static isBadge(item: any) {
            return item && item.hasOwnProperty("text") && item.hasOwnProperty("badgeId");
        }

        public static getParsedHealthEvaluations(rawUnhealthyEvals: IRawUnhealthyEvaluation[], level: number = 0, parent: HealthEvaluation = null, data: DataService) : HealthEvaluation[] {
            let healthEvals: HealthEvaluation[] = new Array(0);

            if (rawUnhealthyEvals) {
                rawUnhealthyEvals.forEach(item => {
                    let healthEval: IRawHealthEvaluation = item.HealthEvaluation;
                    let health = new HealthEvaluation(healthEval, level, parent);
                    if (healthEval) {
                        console.log(healthEval)
                        health.viewPathUrl = Utils.getViewPathUrl(healthEval, data);
                        healthEvals.push(health);

                        healthEvals = healthEvals.concat(Utils.getParsedHealthEvaluations(healthEval.UnhealthyEvaluations, level + 1, health, data));
                    }
                });
            }
            console.log(healthEvals);
            return healthEvals;
        }

        public static getViewPathUrl(healthEval: IRawHealthEvaluation, data: DataService): string{
            let viewPathUrl = "";
            let replaceText = "";

            switch(healthEval.Kind){
                case "Nodes" : {
                    viewPathUrl = data.routes.getNodesViewPath();
                    break;
                }
                case "Node" : {
                    let nodeName = healthEval['NodeName'];
                    viewPathUrl = data.routes.getNodeViewPath(nodeName);
                    replaceText = nodeName;
                    break;
                }
                case "Applications" : {
                    viewPathUrl = data.routes.getAppsViewPath();
                    break;
                }
                case "Application" : {
                    let applicationName = healthEval['ApplicationName'];
                    let appName = applicationName.split('/')[1]; //remove fabric:/
                    viewPathUrl = data.apps.find(appName).viewPath;
                    replaceText = appName;
                    break;
                }
                case "Service" : {
                    //add check for system services
                    let exactServiceName = healthEval['ServiceName'];
                    let deconstructedServiceName = exactServiceName.split('/');

                    let appId = deconstructedServiceName[1];
                    let app = data.apps.find(appId);
                    let appTypeName = app.raw.TypeName;
                    let serviceName = `${appId}/${deconstructedServiceName[2]}`;

                    viewPathUrl = data.routes.getServiceViewPath(appTypeName, appId, serviceName);
                    replaceText = exactServiceName;
                    break;
                }
                case "Replica" : {
                    let partitionId = healthEval['PartitionId']
                    let replicaId = healthEval['ReplicaOrInstanceId']
                    
                    let params = data.$route.current['pathParams'];
                    let appId = params['appId'];
                    let appTypeName = params['appTypeName'];
                    let serviceId = params['serviceId'];


                    viewPathUrl = data.routes.getReplicaViewPath(appTypeName, appId, serviceId, partitionId, replicaId);
                    replaceText = serviceId;
                    break;
                }
            }
            healthEval.Description = Utils.injectLink(healthEval.Description, replaceText, viewPathUrl, replaceText);
            return viewPathUrl;
        }

        public static injectLink(textToReplace: string, replaceText: string, url: string, title: string): string {
            return textToReplace.replace(replaceText, `<a title=${title} ng-href="${url}" ">${replaceText}</a>`)
        }

        public static parseReplicaAddress(address: string): any {
            if (!address) {
                return null;
            }
            return address.indexOf("{") === 0
                ? JSON.parse(address, (key: any, value: any) => {
                    if (_.isString(value) && Utils.isSingleURL(value)) {
                        return HtmlUtils.getLinkHtml(value, value, true);
                    }
                    return value;
                })
                : (Utils.isSingleURL(address) ? HtmlUtils.getLinkHtml(address, address) : address);
        }

        public static isSingleURL(str: string): boolean {
            return Utils.SingleUrlRegExp.test(str.toLowerCase());
        }

        // Convert a hex string to a byte array
        public static hexToBytes(hex) {
            let bytes = [];
            for (let c = 0; c < hex.length; c += 2) {
                let value = parseInt(hex.substr(c, 2), 16);
                if (!_.isNaN(value) && value >= 0) {
                    bytes.push(value);
                }
            }
            return bytes;
        }

        // Convert a byte array to a hex string
        public static bytesToHex(bytes: number[], maxLength: number = Number.MAX_VALUE) {
            let maxBytes = bytes.slice(0, maxLength);
            let hex = [];
            for (let i = 0; i < maxBytes.length; i++) {
                hex.push((bytes[i]).toString(16));
            }
            return hex.join("") + (bytes.length > maxLength ? "..." : "");
        }
    }

}
