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

        public static getParsedHealthEvaluations(rawUnhealthyEvals: IRawUnhealthyEvaluation[], level: number = 0, parent: HealthEvaluation = null, data: DataService): HealthEvaluation[] {
            let healthEvals: HealthEvaluation[] = new Array(0);
            let children: HealthEvaluation[] = new Array(0);
            if (rawUnhealthyEvals) {
                rawUnhealthyEvals.forEach(item => {
                    let healthEval: IRawHealthEvaluation = item.HealthEvaluation;
                    let health = new HealthEvaluation(healthEval, level, parent);
                    if (healthEval) {

                        //the parent Url is either the parent healthEvaluation or the current locationUrl if its the first parent.
                        let parentUrl = "";
                        if (parent) {
                            parentUrl = parent.viewPathUrl;
                        }else {
                            parentUrl = `#${data.$location.url()}`;
                        }
                        const pathData = Utils.getViewPathUrl(healthEval, data, parentUrl);
                        health.viewPathUrl = pathData.viewPathUrl;
                        health.displayName =  pathData.displayName;
                        healthEvals.push(health);
                        healthEvals = healthEvals.concat(Utils.getParsedHealthEvaluations(healthEval.UnhealthyEvaluations, level + 1, health, data));
                        children.push(health);
                    }
                });
            }
            if (parent) {
                parent.children = children;
            }
            return healthEvals;
        }

        /**
         * Generates the url for a healthEvaluation to be able to route to the proper page. Urls are built up by taking the parentUrl and adding the minimum needed to route to this event.
         * Make sure that the application collection is initialized before calling this because for application kinds they make calls to the collection on the dataservice to get apptype.
         * @param healthEval
         * @param data
         * @param parentUrl
         */
        public static getViewPathUrl(healthEval: IRawHealthEvaluation, data: DataService, parentUrl: string = ""): {viewPathUrl: string, displayName: string } {
            let viewPathUrl = "";
            let replaceText = "";

            switch (healthEval.Kind) {
                case "Nodes" : {
                    viewPathUrl = data.routes.getNodesViewPath();
                    break;
                }
                case "Node" : {
                    let nodeName = healthEval["NodeName"];
                    viewPathUrl = data.routes.getNodeViewPath(nodeName);
                    replaceText = nodeName;
                    break;
                }
                case "Applications" : {
                    viewPathUrl = data.routes.getAppsViewPath();
                    break;
                }
                case "Application" : {
                    let applicationName = healthEval["ApplicationName"];
                    let appName = applicationName.replace("fabric:/", ""); //remove fabric:/

                    let appType = data.apps.find(appName).raw.TypeName;
                    viewPathUrl += `#/apptype/${data.routes.doubleEncode(appType)}/app/${data.routes.doubleEncode(appName)}`;
                    replaceText = applicationName;
                    break;
                }
                case "Service" : {
                    let exactServiceName = healthEval["ServiceName"].replace("fabric:/", "");
                    //Handle system services slightly different by setting their exact path
                    if (healthEval["ServiceName"].startsWith("fabric:/System")) {
                        viewPathUrl = `#/apptype/System/app/System/service/${data.routes.doubleEncode(exactServiceName)}`;
                    }else {
                        parentUrl += `/service/${data.routes.doubleEncode(exactServiceName)}`;
                        viewPathUrl = parentUrl;
                    }
                    replaceText = "fabric:/" + exactServiceName;
                    break;
                }
                case "Partition" : {
                    let partitionId = healthEval["PartitionId"];
                    parentUrl += `/partition/${data.routes.doubleEncode(partitionId)}`;
                    replaceText = partitionId;
                    viewPathUrl = parentUrl;
                    break;
                }
                case "Replica" : {
                    let replicaId = healthEval["ReplicaOrInstanceId"];
                    parentUrl += `/replica/${data.routes.doubleEncode(replicaId)}`;
                    replaceText = replicaId;
                    viewPathUrl = parentUrl;
                    break;
                }
                case "Event" : {
                    if (parentUrl) {
                        viewPathUrl = parentUrl;
                    }
                    break;
                }

                case "DeployedApplication" : {
                    const nodeName = healthEval["NodeName"];
                    const applicationName = healthEval["Name"];
                    const appName = applicationName.replace("fabric:/", "");

                    viewPathUrl += `#/node/${data.routes.doubleEncode(nodeName)}/deployedapp/${data.routes.doubleEncode(appName)}`;
                    replaceText = applicationName;
                    break;
                }

                
                case "DeployedServicePackage" : {
                    const serviceManifestName = healthEval['ServiceManifestName'];
                    const activationId = healthEval['ServicePackageActivationId'];
                    const activationIdUrlInfo =  activationId ? "activationid/" + data.routes.doubleEncode(activationId) : "";
                    viewPathUrl = parentUrl + `/deployedservice/${activationIdUrlInfo}${serviceManifestName}`;
                    replaceText = serviceManifestName;
                    break;
                }

                // case: "DeployedServicePackages"
                // case: "Services"
                // case: "Partitions"
                // case: "Replicas"
                default: {
                    viewPathUrl = parentUrl;
                    break;
                }
            }
            if(replaceText.length > 0){
                healthEval.Description = Utils.injectLink(healthEval.Description, replaceText, viewPathUrl, replaceText);
            }
            return {viewPathUrl: viewPathUrl, displayName: replaceText };
        }

        public static injectLink(textToReplace: string, replaceText: string, url: string, title: string): string {
            return textToReplace.replace(replaceText, `<a title=${title} ng-href="${url}" ">${replaceText}</a>`);
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

        public static getFriendlyFileSize(fileSizeinBytes: number) {
            let displayFileSize: string;
            let byte = 1;
            let kiloByte = 1024 * byte;
            let megaByte = 1024 * kiloByte;
            let gigaByte = 1024 * megaByte;
            let teraByte = 1024 * gigaByte;
            if (fileSizeinBytes <= kiloByte) {
                displayFileSize = fileSizeinBytes + " Bytes";
            } else if (fileSizeinBytes < megaByte) {
                displayFileSize = (fileSizeinBytes / kiloByte).toFixed(2) + " KB";
            } else if (fileSizeinBytes < gigaByte) {
                displayFileSize = (fileSizeinBytes / megaByte).toFixed(2) + " MB";
            } else if (fileSizeinBytes < teraByte) {
                displayFileSize = (fileSizeinBytes / gigaByte).toFixed(2) + " GB";
            } else {
                displayFileSize = (fileSizeinBytes / teraByte).toFixed(2) + " TB";
            }

            return displayFileSize;
        }
    }

}
