import React, { useState } from "react";
import { ICluster } from "../../cluster-manager";
import { bulkImport } from "../app";
import { isRequired, isString, isUnique, isUrl, minLength, validate, ValidateProperty } from "../validate";
import './bulk-cluster-list.scss'
export interface BulkClusterListProps {
    clusterList: ICluster[];
    onImport: (clusters: ICluster[]) => void;
    onClose: () => void;
}

export interface IValidationErrors {
    index?: string | number;
    errors: string[];
}

export default function BulkClusterList(props: BulkClusterListProps) {
    const [formattedList, setList] = useState(JSON.stringify(props.clusterList.map(cluster => ({
        name: cluster.name,
        url: cluster.url,
        authentication: cluster.authentication
    })), null, 4));

    const [data, setData] = useState(formattedList);
    const [importErrors, setErrors] = useState([]);

    const importData = () => {
        console.log(data);
        let deserializedData;
        let validationErrors: IValidationErrors[] = [];

        try {
            deserializedData = JSON.parse(data);
            validationErrors = validateList(deserializedData);
        } catch(e) {
            console.log(e)
            validationErrors.push({
                errors: ["The import must be well formatted JSON."]
            })
        }
        console.log(validationErrors);
        setErrors(validationErrors);
        if(validationErrors.length === 0) {
            bulkImport(deserializedData.map((item: ICluster) => { return {...item, id: Math.random()}}));
        }
    }

    const validateList = (items: any): IValidationErrors[] => {
        let errors: IValidationErrors[] = [];

        const validation: ValidateProperty[] = [
            {
                propertyPath: 'name',
                propertyName: 'name',
                failQuickly: true,
                validators: [isRequired, isString, minLength(2), isUnique(() => items, (a,b) => { console.log(a,b);return a.toLowerCase() === b?.name?.toLowerCase()})]
            },
            {
                propertyPath: 'url',
                propertyName: 'url',
                failQuickly: true,
                validators: [isRequired, isString, isUrl, isUnique(() => items, (a,b) => { return a.toLowerCase() === b?.url?.toLowerCase()})]
            }
        ]

        if(Array.isArray(items)) {
            items.forEach((item, index) => {
                const validationResult = validate(item, validation);
                if(validationResult.length > 0) {
                    errors = errors.concat({
                        index: index + 1,
                        errors: validationResult
                    });
                }
            })
        }else{
            errors.push({
                errors: ['The import must be a list.']
            })
        }
        return errors;
    }

    return (<div>
        Import must be well formatted JSON.
        <textarea value={data} className="bulk-list" onChange={(input) => setData(input.currentTarget.value)} ></textarea>

        <div className="bottom-buttons">
            <button onClick={props.onClose} className="flat-button">Close</button>
            <div style={{ marginLeft: 'auto' }}></div>
            <button className="simple-button" onClick={() => importData()}>Import</button>
        </div>

        {importErrors.length > 0 && (<div>
            {importErrors.map((importError: IValidationErrors) =>
                <div className="error-list">
                    {importError.index && (<div>
                        Item : {importError.index}
                    </div>)
                    }
                    <ul>
                        {importError.errors.map((error: string) => (<li key={error}>{error}</li>))}
                    </ul>
                </div>)}
        </div>)}
    </div>)
}