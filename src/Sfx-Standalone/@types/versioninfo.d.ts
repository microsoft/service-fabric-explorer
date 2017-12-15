interface IPackageInfo {
    x86: string;
    x64?: string;
}

interface IVersionInfo {
    version: string;
    description?: string;

    linux?: IPackageInfo;
    windows?: IPackageInfo;
    macos?: IPackageInfo;
}
