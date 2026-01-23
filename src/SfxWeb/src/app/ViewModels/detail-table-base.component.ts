// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { ListColumnSetting } from '../Models/ListSettings';

export interface DetailBaseComponent {
    listSetting: ListColumnSetting;
    item: any;
    cache?: Record<string, any>;
}
