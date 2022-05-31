import React, { useState } from "react"
import { secureClusterAuthType, aadClusterAuthType, unsecureClusterAuthType } from "../../constants";

import { ICluster } from "../../cluster-manager";
import { MultiOptionToggle, MultiOptionToggleValue } from "../toggle/toggle";

export interface AddClusterProps {
    clusterList: ICluster[];
    initialState?: ICluster;
    emitButtonText?: string;
    onAddCluster: (cluster: ICluster) => void;
    onCloseWindow: () => void;
}

const options: MultiOptionToggleValue[] = [{ display: 'Unsecure', value: unsecureClusterAuthType }, { display: 'Certificate', value: secureClusterAuthType }, { display: 'AAD', value: aadClusterAuthType }]

export default function AddCluster(props: AddClusterProps) {
    let authType = null;
    if(props.initialState) {
        authType = props.initialState.authentication
    }

    const [name, setName] = useState(props.initialState?.name || "");
    const [url, setUrl] = useState(props.initialState?.url || "");
    const [auth, setAuth] = useState(authType?.authType || "unsecure");
    const [folder, setFolder] = useState("default");
    const [certificatePath, setCertificatePath] = useState(authType?.certificatePath || "");
    const [certificatePassword, setCertificatePassword] = useState(authType?.certificatePath || "");
    const [id] = useState(props.initialState?.id ||  Math.random().toString());
    const clear = () => {
        setName("");
        setUrl("");
        setCertificatePath("");
    }

    const checkValidty = () => {
        //TODO move to validator
        let errors = [];

        if(name.length === 0) {
            errors.push("Name must not be empty")
        }

        if(props.clusterList.some(cluster => cluster.url.toLowerCase() === url.toLowerCase() && cluster !== props.initialState)) {
            errors.push("two clusters can not have the same url");
        }
        
        if(props.clusterList.some(cluster => cluster.name.toLowerCase() === name.toLowerCase()  && cluster !== props.initialState)) {
            errors.push("two clusters can not have the same name");
        }

        if(!(url.startsWith("http://") || url.startsWith("https://"))) {
            errors.push("url must start with http:// or https://")
        }

        if(auth === "certificate") {
            if(certificatePath.length === 0) {
                errors.push("Certificate path must not be empty");
            }

            if(certificatePath.length > 0 && !certificatePath.toLowerCase().endsWith("pfx")) {
                errors.push("Certificate must end with .pfx")
            }
        }

        if(folder.length === 0 ) {
            errors.push("Folder name must not be empty")
        }

        return errors;
    }

    const getCertificatePath = async () => {
        const data = await window.electronInterop.requestFileDialog({});
        if (!data.canceled) {
            setCertificatePath(data.filePaths[0]);
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

                <div className="input-item">
                    <span>Certificate : </span>
                    <input className="input-flat" onChange={(input) => setCertificatePath(input.currentTarget.value)} value={certificatePath}></input>
                </div>
                <div className="bottom-buttons" style={{marginBottom: '10px'}}>
                    <button onClick={getCertificatePath} className="flat-button">Select Certificate Path</button>   
                </div>

                <div className="input-item">
                    <span>Certificate Password</span>
                    <input className="input-flat" onChange={(input) => setCertificatePassword(input.currentTarget.value)} value={certificatePassword}></input>
                </div>
            </div>}
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
                    certificatePath: certificatePath
                },
                folder
            })} className="simple-button" disabled={errors.length > 0}>{props.emitButtonText || 'Add' }</button>
        </div>
    </div>)
}