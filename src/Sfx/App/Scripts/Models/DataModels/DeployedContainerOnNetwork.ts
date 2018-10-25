//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export class DeployedContainerOnNetwork extends DataModelBase<IRawDeployedContainerOnNetwork> {

        public nodeName: string;
        public constructor(data: DataService, nodeName: string, raw?: IRawDeployedContainerOnNetwork) {
            super(data, raw);
            this.nodeName = nodeName;
        }

        public get viewPath(): string {
            return this.data.routes.getCodePackageViewPath(
                this.nodeName,
                IdUtils.nameToId(this.raw.ApplicationName),
                 this.raw.ServiceManifestName,
                 this.raw.ServicePackageActivationId,
                 this.raw.CodePackageName
                 );
        }
    }

}
