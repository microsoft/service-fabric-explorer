import React, { useState } from "react";
import { ICluster, IloadedCluster } from "../../cluster-manager";
import AddCluster from "../add-cluster/add-cluster";
import { addWindow, disconnect, reconnect, removeCluster, updateCluster } from "../app";
import { DropDown } from "../dropdown/dropdown";
import './cluster-item.scss';
import Message from './message'; 
export interface ClusterListItemProp {
    clusterList: IloadedCluster[];
    isFocused: boolean;
    cluster: IloadedCluster;
}

export default function ClusterListItem(props: ClusterListItemProp) {
    const [editing, setEditing] = useState(false);
    const [showLog, setShowLog] = useState(true);

    return (<div className={`list-item  ${props.isFocused ? 'active' : ''}`} onClick={() => addWindow(props.cluster)}>
        <div className="flex-between list-item-inner">
            <div>
                <div>
                    {props.cluster.name}
                </div>
                <div>
                    {props.cluster.authentication.authType}
                </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
                <DropDown dropdownToggle={<button className="flat-button"><span className="mif-more-vert"></span></button>} dropdownContent={
                    <ul>
                        <li className="dropdown-item" onClick={() => removeCluster(props.cluster)}>
                            <i className="mif-cancel link"></i> <span>Remove</span>
                        </li>
                        <li className="dropdown-item" onClick={() => { setEditing(true) }}>
                            <i className="mif-pencil link"></i> <span>Edit</span>
                        </li>
                        {props.cluster.data?.loaded &&
                            <li className="dropdown-item" onClick={() => reconnect(props.cluster)}>
                                <i className="mif-refresh link"></i> <span>Reconnect</span>
                            </li>
                        }
                        {props.cluster.data?.loaded &&
                            <li className="dropdown-item" onClick={() => disconnect(props.cluster)}>
                                <i className="mif-blocked link"></i> <span>Disconnect</span>
                            </li>
                        }
                    </ul>
                }></DropDown>
            </div>
        </div>
        {props.cluster?.data?.log && <div className=" list-item-inner">
            {showLog && props.cluster.data.log.map(log => (<div key={log.timestamp.toUTCString() + log.message}>
                <Message message={log.message} timestamp={log.timestamp} ></Message>
            </div>))}
        </div>}
        {editing && <div className="edit-cluster list-item-inner">
            <AddCluster clusterList={props.clusterList} initialState={props.cluster} onAddCluster={() => updateCluster(props.cluster)} onCloseWindow={() => setEditing(false)} emitButtonText={'update'}></AddCluster>
        </div>}
    </div>)
}