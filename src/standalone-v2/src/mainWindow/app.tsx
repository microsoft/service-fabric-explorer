import React, { useEffect, useState } from "react"
import { ICluster, IClusterAuth, IloadedCluster, ILoadedClusterData } from "../cluster-manager";
import AddCluster from "./add-cluster/add-cluster";
import AadProfiles from './aad-profile/aad-profiles';
import ClusterListItem from "./cluster-item/cluster-item";

import './app.scss';
import './icons.min.css';
import BulkClusterList from "./import-export-clusters/bulk-cluster-list";
import { ILoggedInAccounts } from "../auth/aad";
import { groupBy, objectToList } from "../utils/utils";


export const addWindow = (state: ICluster) => {
    window.electronInterop.addCluster(state)
}

export const connectCluster = (state: ICluster) => {
    window.electronInterop.connectCluster(state)
}

export const updateCluster = (cluster: ICluster) => {
    window.electronInterop.editCluster(cluster);
}

export const removeCluster = (cluster: ICluster) => {
    window.electronInterop.removeCluster(cluster);
}

export const reconnect = (cluster: ICluster) => {
    window.electronInterop.reconnectCluster(cluster);
}

export const disconnect = (cluster: ICluster) => {
    window.electronInterop.disconnectCluster(cluster);
}

export const logoutOfAad = (tenant: string) => {
    window.electronInterop.logoutOfAad(tenant);
}

export const bulkImport = (clusters: ICluster[]) => {
    window.electronInterop.bulkImportCluster(clusters);
}

export const validateAuthType = (data: IClusterAuth) => {
    return window.electronInterop.validateAuthConfiguration(data);
}

export interface IFolder {
    key: string;
    value: IloadedCluster[];
}

export default function App() {
    const [clusters, setClustersList] = useState<IloadedCluster[]>([])
    const [aadAccounts, setAadAccounts] = useState<ILoggedInAccounts[]>([])
    const [filterList, setFilerList] = useState<string>("");

    const [showAddCluster, setAddCluster] = useState(false);
    const [showBulk, setBulk] = useState(false);
    const [activeCluster, setActiveCluster] = useState("-1");
    useEffect(() => {
        window.electronInterop.onClusterListChange((event: any, data: any) => {
            console.log(data)
            setClustersList(data.clusters)
            setActiveCluster(data.focusedCluster);
        })

        window.electronInterop.onAADConfigurationsChange((event: any, data: any) => {
            console.log(data)
            setAadAccounts(data);
        })

        window.electronInterop.requestClusterState();
        window.electronInterop.requestAADState();
    }, [])

    const filteredList = filterList.length > 0 ? clusters.filter(cluster => cluster.url.includes(filterList) || cluster.name.includes(filterList)) : clusters;

    const folders: IFolder[] = objectToList(groupBy(filteredList, ['folder']));

    console.log(folders)
    return (<div className="left-panel">
        <div>
            <h4 className="cluster-header cluster-title">
                <div style={{flex: '1', marginLeft: '10px'}}>
                    Clusters
                </div>
                <button className="flat-button round add-button" onClick={() => { setAddCluster(true) }} >
                    <span className='mif-plus icon'></span>
                    <span className="text">Add</span>
                </button>

                <button className="flat-button round add-button" onClick={() => { setBulk(true) }} >
                    <span className='mif-import-export icon'></span>
                    <span className="text">Import</span>
                </button>
            </h4>

            <div className="filter-list">
                <div className="input-item">
                    <span>Search</span>
                    <input className="input-flat" onChange={(input) => setFilerList(input.currentTarget.value)} value={filterList}></input>
                </div>
            </div>
            <div style={{display: 'flex', flexDirection: 'row-reverse', alignItems: 'center'}}>
                    <span>
                    Report a bug
                    </span>
                    <span className="mif-bug mif-lg flat-button round link"></span>
                </div>
        </div>

        {showAddCluster && <div className="add-cluster essen-pane slide-open">
            <h5>Add Cluster
            </h5>
            <AddCluster clusterList={clusters} onAddCluster={data => {addWindow(data); setAddCluster(false) }} onCloseWindow={() => setAddCluster(false)}></AddCluster>
        </div>}

        {aadAccounts.length > 0 && <div className="essen-pane slide-open add-cluster">
            <h4 className="aad-profiles">Azure Active Directory Accounts</h4>
            <AadProfiles accounts={aadAccounts}></AadProfiles>
        </div>}

        {showBulk && <div className="add-cluster essen-pane slide-open">
            <h5>Import</h5>
            <BulkClusterList clusterList={clusters} onClose={() => {setBulk(false)}}></BulkClusterList>
        </div>}

        <div className="cluster-list">
            {folders.map(folder => (
                <div key={folder.key} className="folder">
                    <div className="folder-name">
                        {folder.key}
                    </div>
                    <div>
                        {folder.value.map((option) =>
                            <ClusterListItem key={option.id} clusterList={clusters} isFocused={activeCluster === option.id} cluster={option} ></ClusterListItem>)}
                    </div>
                </div>
            ))}
        </div>

    </div>)
} 