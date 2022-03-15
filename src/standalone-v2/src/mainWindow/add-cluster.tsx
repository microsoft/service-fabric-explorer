import { OpenDialogOptions } from "electron";
import React, { useState } from "react"
import { ICluster } from "../cluster-manager";
import './app.css';
import { MultiOptionToggle, MultiOptionToggleValue } from "./toggle";

export interface AddClusterProps {
    onAddCluster: (cluster: ICluster) => void;
    onCloseWindow: () => void;
}

export default function AddCluster(props: AddClusterProps) {
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [auth, setAuth] = useState("unsecure");
    const [certificatePath, setCertificatePath] = useState("");
    const clear = () => {
        setName("");
        setUrl("");
    }

    const toggleAuth = (event: any) => {
        const element = event.target as HTMLInputElement;
        setAuth(element.value)
        console.log(element.value)
    }

    const getCertificatePath = async () => {
        const data = await window.electronInterop.requestFileDialog({});
        if (!data.canceled) {
            setCertificatePath(data.filePaths[0]);
        }
    }

    const options: MultiOptionToggleValue[] = [{ display: 'Unsecure', value: 'unsecure' }, { display: 'Certificate', value: 'certificate' }, { display: 'AAD', value: 'aad' }]

    const changeType = (next: MultiOptionToggleValue) => {
        setAuth(next.value)
    }

    return (<div>
        <div className="input-item">
            Name
            <input className="input-flat" onChange={(input) => setName(input.currentTarget.value)} value={name}></input>
        </div>
        <div className="input-item underline">
            Url
            <input className="input-flat" onChange={(input) => setUrl(input.currentTarget.value)} value={url}></input>
        </div>

        <div className="auth-container">
            <MultiOptionToggle values={options} toggle={changeType} defaultIndex={0}></MultiOptionToggle>

            {auth === 'certificate' && <div className="cert-container">
                <button onClick={getCertificatePath} className="simple-button">Certificate Path</button>
                <div>
                    {certificatePath}
                </div>
            </div>}
        </div>

        <div className="bottom-buttons">
            <button onClick={props.onCloseWindow} className="flat-button">Close</button>
            <div style={{ marginLeft: 'auto' }}></div>
            <button onClick={() => clear()} className="flat-button">Clear</button>
            <button onClick={() => props.onAddCluster({
                displayName: name,
                url,
                id: Math.random().toString(),
                authType: {
                    authType: auth as any,
                    certificatePath: certificatePath
                }

            })} className="simple-button">Add</button>

        </div>
    </div>)
}