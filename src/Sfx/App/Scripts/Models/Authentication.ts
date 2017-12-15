//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
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

    // TODO:
    // Should replace the following with the official version of
    // definition file when the following issue is resolved.
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/3175
    export interface IAdalAuthenticationService {
        userInfo: IUserInfo;
        login(): void;
        logOut(): void;
    }

}

