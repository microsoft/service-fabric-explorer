import React, { useState } from "react";
import { ICluster } from "../../cluster-manager";
import './bulk-cluster-list.scss'
export interface BulkClusterListProps {
    clusterList: ICluster[];
    onImport: (clusters: ICluster[]) => void;
}


export const validateString = (item: any): string[] => {
    const errors = [];

    if(typeof item !== "string") {
        errors.push("Not a string")
    }

    return errors;
}


export default function BulkClusterList(props: BulkClusterListProps) {
    const [formattedList, setList] = useState(JSON.stringify(props.clusterList.map(cluster => ({
        displayName: cluster.displayName,
        url: cluster.url,
        authType: cluster.authType
    })), null, 4));

    const validateList = (items: any): string[] => {
        const errors: string[] = [];

        if(Array.isArray(items)) {
            items.forEach((item, index) => {
                const errors = validateItem(item)
            })
        }else{
            errors.push("Items must be in an array")
        }

        return errors;
    }

    const validateItem = (item: any): string => {
        const error = "";

        if()

        return error;
    }

    return (<div>
        <textarea value={formattedList} className="bulk-list" contentEditable></textarea>
        <button className="simple-button">Import</button>
    </div>)
}