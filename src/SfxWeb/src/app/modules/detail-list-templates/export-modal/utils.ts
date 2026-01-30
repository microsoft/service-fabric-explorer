// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { ListSettings } from 'src/app/Models/ListSettings';
import { Utils } from 'src/app/Utils/Utils';

export interface IExportInfo {
    config: ListSettings;
    list: any[];
}

const delimiter = ',';

export const exportInfo = (info: IExportInfo, selected: Record<string, boolean>) => {
    const selectedColumns = info.config.columnSettings.filter(column => selected[column.displayName] && !column.config.canNotExport);

    const header = selectedColumns.map(column => column.displayName);

    const rows = info.list.map(item => {
        const row = selectedColumns.map(column => {
            let value = Utils.result(item, column.propertyPath);

            if (column.config.alternateExportFormat !== undefined) {
                value = column.config.alternateExportFormat(value);
            }

            return value;
        }).join(delimiter);

        return row;
    });

    return [header, ...rows];
};
