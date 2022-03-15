import React, { useEffect, useState } from "react"
import { ICluster } from "../cluster-manager";
import AddCluster from "./add-cluster";
import './app.css';
import ClusterListItem from "./cluster-item";

export const addWindow = (state: ICluster) => {
    window.electronInterop.addCluster(state)
}

export const removeCluster = (cluster: ICluster) => {
    window.electronInterop.removeCluster(cluster);
}

export const reconnect = (cluster: ICluster) => {
    window.electronInterop.reconnectCluster(cluster);
}

export default function App() {
    const [options, setOptions] = useState<ICluster[]>([])


    const [showAddCluster, setAddCluster] = useState(false);
    const [activeCluster, setActiveCluster] = useState("-1");
    useEffect(() => {
        window.electronInterop.onClusterListChange((event: any, data: any) => {
            console.log(data)
            setOptions(data.clusters)
            setActiveCluster(data.focusedCluster);
        })
    }, [])

    return (<div style={{ width: '300px' }}>
        <div>
            <h5 className="center-text">Clusters
            <button className="flat-button round add-button">
                <span onClick={() => {setAddCluster(!showAddCluster)}}>{showAddCluster ? '' : '+'}</span>
            </button>
            </h5>

            {showAddCluster && <div className="add-cluster essen-pane">
                <div>Add Cluster
                </div>
                <AddCluster onAddCluster={addWindow} onCloseWindow={() => setAddCluster(false)}></AddCluster>

            </div>}
            {options.map(option => <ClusterListItem isFocused={activeCluster === option.id} cluster={option} ></ClusterListItem>}
        </div>
    </div>)
} 