interface IPackageInfo {
    x86: string;
    x64?: string;
}

interface IVersionInfo {
    version: string;
    description?: string;

    linux?: IPackageInfo | string;
    windows?: IPackageInfo | string;
    macos?: IPackageInfo | string;
}
