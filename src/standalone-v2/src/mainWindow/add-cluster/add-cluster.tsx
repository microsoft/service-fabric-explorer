import React, { useState } from "react"
import { secureClusterAuthType, aadClusterAuthType, unsecureClusterAuthType } from "../../constants";
import { ICluster, IClusterAuth } from "../../cluster-manager";
import Toggle, { MultiOptionToggle, MultiOptionToggleValue } from "../toggle/toggle";

export interface AddClusterProps {
    clusterList: ICluster[];
    initialState?: ICluster;
    emitButtonText?: string;
    onAddCluster: (cluster: ICluster) => void;
    onCloseWindow: () => void;
}

const options: MultiOptionToggleValue[] = [{ display: 'Unsecure', value: unsecureClusterAuthType }, { display: 'Certificate', value: secureClusterAuthType }, { display: 'AAD', value: aadClusterAuthType }]

export interface ICertificateInfo {
    certificatePath: string;
    password: string;
}
export interface CertificateViewerProps {
    certificateInfo?: ICertificateInfo;
}


export function CertificateViewer(props: CertificateViewerProps) {
    const [state, setState] = useState<ICertificateInfo>(props.certificateInfo || { certificatePath: "", password: ""})

    const getCertificatePath = async () => {
        const data = await window.electronInterop.requestFileDialog(['openFile']);
        if (!data.canceled) {
            setState(currentState => ({...currentState, certificatePath : data.filePaths[0]}));
        }
    }

    return <div>
        <div className="input-item">
            <span>Certificate : </span>
            <input className="input-flat" onChange={(input) => setState(currentState => ({...currentState, certificatePath: input.currentTarget.value}))} value={state.certificatePath}></input>
        </div>
        <div className="bottom-buttons" style={{ marginBottom: '10px' }}>
            <button onClick={getCertificatePath} className="flat-button">Select Certificate Path</button>
        </div>

        <div className="input-item">
            <span>Certificate Password</span>
            <input className="input-flat" onChange={(input) => setState(currentState => ({...currentState, password: input.currentTarget.value}))} value={state.password}></input>
        </div>
    </div>
}

export default function AddCluster(props: AddClusterProps) {
    let authType: IClusterAuth = null;
    if (props.initialState) {
        authType = props.initialState.authentication
    }

    const [name, setName] = useState(props.initialState?.name || "");
    const [url, setUrl] = useState(props.initialState?.url || "");
    const [auth, setAuth] = useState(authType?.authType || "unsecure");
    const [folder, setFolder] = useState("default");
    const [certificateInfo, setCertificateInfo] = useState<ICertificateInfo>({certificatePath: authType?.certificatePath || "",
                                                                              password: authType?.certificatePassword || ""});
    const [verifyConnection, setVerifyConnection] = useState<boolean>(authType?.verifyConnection || true);
    const [certificateCaPaths, setCertificateCaPaths] = useState<string>(authType?.certificateCaPaths || "");
    const [id] = useState(props.initialState?.id || Math.random().toString());
    const clear = () => {
        setName("");
        setUrl("");
        setCertificateInfo({
            certificatePath: "",
            password: ""
        });
    }

    const checkValidty = () => {
        //TODO move to validator
        let errors = [];

        if (name.length === 0) {
            errors.push("Name must not be empty")
        }

        if (props.clusterList.some(cluster => cluster.url.toLowerCase() === url.toLowerCase() && cluster !== props.initialState)) {
            errors.push("two clusters can not have the same url");
        }

        if (props.clusterList.some(cluster => cluster.name.toLowerCase() === name.toLowerCase() && cluster !== props.initialState)) {
            errors.push("two clusters can not have the same name");
        }

        if (!(url.startsWith("http://") || url.startsWith("https://"))) {
            errors.push("url must start with http:// or https://")
        }

        if (auth === "certificate") {
            if (certificateInfo.certificatePath.length === 0) {
                errors.push("Certificate path must not be empty");
            }

            if (!certificateInfo.certificatePath.toLowerCase().endsWith("pfx")) {
                errors.push("Certificate must end with .pfx")
            }
        }

        if (verifyConnection) {
            if (certificateCaPaths.length === 0 ) {
                errors.push("You must provide at least 1 certificate for verifying the connection")
            }
        }

        if (folder.length === 0) {
            errors.push("Folder name must not be empty")
        }

        return errors;
    }

    const getFolderpath = async () => {
        const data = await window.electronInterop.requestFileDialog(['openDirectory']);
        if (!data.canceled) {
            setCertificateCaPaths(data.filePaths[0]);
        }
    }

    const changeType = (next: MultiOptionToggleValue) => {
        setAuth(next.value)
    }

    const errors = checkValidty();

    return (<div>
        <div className="input-item">
            <span>Name</span>
            <input className="input-flat" onChange={(input) => setName(input.currentTarget.value)} value={name}></input>
        </div>
        <div className="input-item">
            <span>Url</span>
            <input className="input-flat" onChange={(input) => setUrl(input.currentTarget.value)} value={url}></input>
        </div>
        <div className="input-item underline">
            <span>Folder</span>
            <input className="input-flat" onChange={(input) => setFolder(input.currentTarget.value)} value={folder}></input>
        </div>


        <div className="auth-container">
            <MultiOptionToggle values={options} toggle={changeType} defaultIndex={options.findIndex(option => option.value === auth)}></MultiOptionToggle>

            {auth === 'certificate' && <div className="cert-container">
                <div className="underline">
                    <CertificateViewer certificateInfo={certificateInfo}></CertificateViewer>
                </div>
            </div>}

            <div>
                <div className="input-item" style={{ margin: '10px 0px' }}>
                    <span>Verify Connection : </span>
                    <div>
                        <Toggle toggle={(state) => setVerifyConnection(state)} value={verifyConnection}></Toggle>
                    </div>
                </div>
                {verifyConnection && <div>
                    <div className="input-item">
                        <span>CA Directory : </span>
                        <input className="input-flat" onChange={(input) => setCertificateCaPaths(input.target.value)} value={certificateCaPaths}></input>
                    </div>
                    <div className="bottom-buttons" style={{ marginBottom: '10px' }}>
                        <button onClick={getFolderpath} className="flat-button">Set Certificate Directory</button>
                    </div>
                </div>}
            </div>
        </div>

        {errors.length > 0 && (<div className="error-list">
            <ul>
                {errors.map(error => (<li key={error}>{error}</li>))}
            </ul>
        </div>)}

        <div className="bottom-buttons">
            <button onClick={props.onCloseWindow} className="flat-button">Close</button>
            <div style={{ marginLeft: 'auto' }}></div>
            <button onClick={() => clear()} className="flat-button">Clear</button>
            <button onClick={() => props.onAddCluster({
                name,
                url,
                id,
                authentication: {
                    authType: auth as any,
                    certificatePath: certificateInfo.certificatePath,
                    certificatePassword: certificateInfo.password,
                    verifyConnection,
                    certificateCaPaths
                },
                folder
            })} className="simple-button" disabled={errors.length > 0}>{props.emitButtonText || 'Add'}</button>
        </div>
    </div>)
}