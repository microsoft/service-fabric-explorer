import React, { useState } from "react";
import { ICluster } from "../../cluster-manager";
import { isRequired, isString, isUnique, isUrl, minLength, validate, ValidateProperty } from "../validate";
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

    const [data, setData] = useState(formattedList);

    const importData = () => {
        console.log(data);
        const errors = validateList(JSON.parse(data));
        console.log(errors);
    }

    const validateList = (items: any): any[] => {
        let errors: any[] = [];

        const validation: ValidateProperty[] = [
            {
                propertyPath: 'displayName',
                propertyName: 'cluster name',
                validators: [isRequired, isString, minLength(2), isUnique(() => items, (a,b) => { return a.displayName.toLowerCase() === b.displayName.toLowerCase()})]
            },
            {
                propertyPath: 'url',
                propertyName: 'url',
                validators: [isRequired, isString, isUrl, isUnique(() => items, (a,b) => { return a.url.toLowerCase() === b.url.toLowerCase()})]
            }
        ]

        if(Array.isArray(items)) {
            items.forEach((item, index) => {
                errors = errors.concat({
                    index,
                    errors: validate(item, validation)
                });
            })
        }else{
            errors.push({
                index: 'list',
            })
        }

        return errors;
    }

    return (<div>
        <textarea value={formattedList} className="bulk-list" onChange={(input) => setData(input.currentTarget.value)}></textarea>
        <button className="simple-button" onClick={() => importData()}>Import</button>
    </div>)
}