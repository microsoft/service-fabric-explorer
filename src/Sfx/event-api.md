# Federation Live Debug JSON over WebSockets API

## Basics

## Connection Init

Connect to a federation debug endpoint and subscribe to multiple nodes. 

```
[scheme]://federation:[port]/debug/?node=[nodes]&version=[api version]
```

 * nodes: comma seperate node names

Example
```
ws://federation.fabric.com:10546/debug?nodes=Node1,Node2&version=1.0
```

## Commands

client sends command to server and server responses in an asynchonized message package

client to server message

```
{
  "type": "command",
  "command": "[command_name]",
  "command_guid": "[command_guid]",
  "dst_node": "[node_name]", 
  "data": { ... command request spec structure ... }
}
```

server replies command message

```
{
  "type": "command_reply",
  "command": "[command_name]",
  "command_guid": "[command_guid]",
  "reply_node": "[node_name]", 
  "api_node": "[node_name]", 
  "ts": [timestamp],
  "data": { ... command response spec structure ... }
}
```

 * type: command, command_reply
 * command: define in command list
 * command_guid: unique id for this command request, server should reply with same guid to mark the message is reply to the message with `guid`
 * reply_node: the node who replied the command message
 * api_node: the node where sent this command message
 * ts: unix timestamp when the message generated
 * data: command spec structure


Example: Subscribe to new node

request 

```
{
  "type": "command",
  "command": "sub",
  "command_guid": "bf5ca388-4294-4136-9f98-d2c38b317309",
  "dst_node": "node5", 
  "data": { }
}
```

reponse

```
{
  "type": "command_reply",
  "command": "sub",
  "command_guid": "bf5ca388-4294-4136-9f98-d2c38b317309",
  "reply_node": "node5", 
  "api_node": "node1", 
  "ts": [timestamp],
  "data": { "success": true }
}
```

### Command specs defination

#### sub

#### unsub

#### debug_log

#### 

## Events

debug endpoint will push event to client

```
{
  "type": "event",
  "event": "[event_name]",
  "event_src_node": "[node_name]", 
  "api_node": "[node_name]", 
  "ts": [timestamp],
  "data": { ... event spec structure ... }
}
```
 * type: event
 * event: define in event list
 * event_src_node: the node where the event generated
 * api_node: the node where sent this event message
 * ts: unix timestamp when the event message generated
 * data: event spec, defined per event
 
Exmaple: Token change event

```
{
  "type": "event",
  "event": "token_changed",
  "event_src_node": "node9", 
  "api_node": "node1", 
  "ts": 1234564789,
  "data": { 
      // see token_changed
   }
}
```

### Event spec defination

#### phase_changed

```
{
    "node_id": "[node_id]",
    "instance_id": "[instance_id]",
    "phase": "[phase]",
}
```

#### token_changed

```
{
    "node_id": "[node_id]",
    "instance_id": "[instance_id]",
    "routing_token_start": [token_start],
    "routing_token_end": [token_end]
}
```

#### neighborhood_changed

```
{
    "node_id": "[node_id]",
    "instance_id": "[instance_id]",
    "neighbors": [
        {
            "node_id": "[node_id]",
            "instance_id": "[instance_id]",
            "node_name": "[node_name]",
        },
    ],

}
```

#### lease_state_changed

```
{
    "node_id": "[node_id]",
    "instance_id": "[instance_id]",
    "state": "[state]"

}
```

#### arbitration_request

```
{

}
```

#### arbitration_response

```
{

}
```

#### range_lock

```
{

}
```

#### range_unlock

```
{

}
```

#### node_disconnect

pushed by api node

```
{
    "node_name": "[node_name]",
}
```

#### debug_log

after sub to debug log

```
{
    "text": "...",
}
```