//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IUserProfile {
        name: string;
        email: string;
    }

    export interface IUserInfo {
        isAuthenticated: boolean;
        userName: string;
        loginError: string;
        profile: IUserProfile;
    }

    // Should replace the following with the official version of
    // definition file when the following issue is resolved.
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/3175
    export interface IAdalAuthenticationService {
        userInfo: IUserInfo;
        login(): void;
        logOut(): void;
    }

}

