import React, { useEffect, useState } from "react";
import RelativeTime from '@yaireo/relative-time'
import { ILog } from "../../cluster-manager";


export default function Message(props: ILog) {
    const [timestamp, setTimestamp] = useState(null);
    useEffect(() => {
        const relativeTime = new RelativeTime();
        setTimestamp(relativeTime.from(props.timestamp));

        const interval = setInterval(() => {
            setTimestamp(relativeTime.from(props.timestamp))
        }, 10000)

        return () => {
            clearInterval(interval);
        }
    }, [])

    return (<div>
        {props.message} - {timestamp} 
    </div>)
}