import React from "react";
import { ICluster } from "../cluster-manager";
import { addWindow, reconnect, removeCluster } from "./app";
import { DropDown } from "./dropdown";

export interface ClusterListItemProp {
    isFocused: boolean;
    cluster: ICluster;
}

export default function ClusterListItem(props: ClusterListItemProp) {

    return (<div className={`list-item hover-row ${props.isFocused ? 'active' : ''}`} onClick={() => addWindow(props.cluster)}>
        <div>
            <div>
                {props.cluster.displayName}
            </div>
            <div>
                {props.cluster.authType.authType}
            </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
            <DropDown dropdownToggle={<button className="flat-button">[]</button>} dropdownContent={
                <ul>
                    <li className="dropdown-item" onClick={() => removeCluster(props.cluster)}>
                        <i className="mif-copy link"></i> Remove
                    </li>
                    <li className="dropdown-item">
                        Edit
                    </li>
                    <li className="dropdown-item" onClick={() => reconnect(props.cluster)}>
                        Reconnect
                    </li>
                </ul>
            }></DropDown>
        </div>
    </div>)
}