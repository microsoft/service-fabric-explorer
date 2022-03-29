import React, { useEffect, useState } from "react"
import { ICluster, IloadedCluster } from "../cluster-manager";
import AddCluster from "./add-cluster/add-cluster";
import ClusterListItem from "./cluster-item/cluster-item";

import './app.scss';
import './icons.min.css';
import BulkClusterList from "./import-export-clusters/bulk-cluster-list";


export const addWindow = (state: ICluster) => {
    window.electronInterop.addCluster(state)
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

export default function App() {
    const [clusters, setOptions] = useState<IloadedCluster[]>([])
    const [filterList, setFilerList] = useState<string>("");

    const [showAddCluster, setAddCluster] = useState(false);
    const [showBulk, setBulk] = useState(false);
    const [activeCluster, setActiveCluster] = useState("-1");
    useEffect(() => {
        window.electronInterop.onClusterListChange((event: any, data: any) => {
            console.log(data)
            setOptions(data.clusters)
            setActiveCluster(data.focusedCluster);
        })

        window.electronInterop.requestClusterState();
    }, [])

    const filteredList = filterList.length > 0 ? clusters.filter(cluster => cluster.url.includes(filterList) || cluster.displayName.includes(filterList)) : clusters;

    return (<div className="left-panel">
        <div>
            <h4 className="center-text cluster-title">Clusters
                {!showAddCluster &&
                    <button className="flat-button round add-button" onClick={() => { setAddCluster(true) }} >
                        <span className='mif-plus'></span>
                    </button>
                }

                {!showBulk &&
                    <button className="flat-button round add-button" onClick={() => { setBulk(true) }} >
                        <span className='mif-plus'></span>
                    </button>
                }
            </h4>

            <div className="filter-list">
                <div className="input-item">
                    <span>Filter List</span>
                    <input className="input-flat" onChange={(input) => setFilerList(input.currentTarget.value)} value={filterList}></input>
                </div>
            </div>
        </div>

        {showAddCluster && <div className="add-cluster essen-pane slide-open">
            <h5>Add Cluster
            </h5>
            <AddCluster clusterList={clusters} onAddCluster={data => {addWindow(data); setAddCluster(false) }} onCloseWindow={() => setAddCluster(false)}></AddCluster>
        </div>}

        {showBulk && <div className="add-cluster essen-pane slide-open">
            <h5>Import/Export
            </h5>
            <BulkClusterList clusterList={clusters} onImport={(clusters) => {console.log(clusters)}}></BulkClusterList>
        </div>}

        <div className="cluster-list">
            {filteredList.map((option, index) =>
                <ClusterListItem key={option.id} clusterList={clusters} isFocused={activeCluster === option.id} cluster={option} ></ClusterListItem>)}
        </div>
    </div>)
} 