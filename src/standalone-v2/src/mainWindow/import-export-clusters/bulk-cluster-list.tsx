import React, { useState } from "react";
import { ICluster } from "../../cluster-manager";
import './bulk-cluster-list.scss'
export interface BulkClusterListProps {
    clusterList: ICluster[];
    onImport: (clusters: ICluster[]) => void;
}

export default function BulkClusterList(props: BulkClusterListProps) {
    const [formattedList, setList] = useState(JSON.stringify(props.clusterList.map(cluster => ({
        displayName: cluster.displayName,
        url: cluster.url,
        authType: cluster.authType
    })), null, 4));

    return (<div>
        <textarea value={formattedList} className="bulk-list" contentEditable></textarea>
    </div>)
}