# μBuf

## Introduction

Have you ever needed to create your own network protocol for several languages?
Rewriting every change in multiple languages is tedious and introduces bugs!

When I tried to use protobuf, the resulting code was daunting and I observed that the message size was far from optimal.

This is why I created a simplistic protocol generator: **μBuf**.

It takes a simple YAML file as input and produces compatible serialization and deserialization code for several languages.

Currently, C++ and Javascript are supported as target languages.

## Usage

1. Write your protocol in a YAML file (`protocol.yml` for example)
2. Generate the code with:
   - `ubuf protocol.yml --lang js > protocol.js`
   - `ubuf protocol.yml --lang cpp > protocol.hpp`
3. Put the `io` libraries in the same place as the protocol files.
4. Profit!

## Example

This is the config file that defines my protocol for a simple game:

```yml
types:
  coord_t: double
  Pos:
    x: coord_t
    y: coord_t
  UserId: string

messages:
  ClientRegisterMsg:
    name: string
  ServerRegisterMsg:
  ClientUpdateMsg:
    pos: Pos
  ServerUpdateMsg:
    user_id: UserId
    name: string
    pos: Pos
  ServerDeleteMsg:
    user_id: UserId
```

As you can see, it is divided in two sections, `types` and `messages`. The first define data types that can be used in messages.

### Write

From JS:

```js
import * as Proto from "./protocol.js";

const msg = new Proto.ClientUpdateMsg({ x: 4.2, y: 6.9 });

const buf: Uint8Array = msg.serialize();
```

From C++:

````c++
#include "protocol.hpp"

ClientUpdateMsg msg{4.2, 6.9};

string buf = serialize(msg);
```

### Read

From JS:

```js
import * as Proto from "./protocol.js";

const buf = new Proto.InBuffer(data);
const type = buf.readChar();
if (type == Proto.ServerUpdateMsg.id) {
  const msg = buf.readServerUpdateMsg();
  // msg is a standard JS object that can be intuitively accessed:
  // msg.user_id, msg.name, msg.pos.x, msg.pos.y
} else if (type == Proto.ServerDeleteMsg.id) {
  const msg = buf.readServerDeleteMsg();
  // do something
} else {
  console.log("unknown message type", type);
}
````

From C++:

```c++
#include "protocol.hpp"

std::string_view msg;

InBuffer buffer(msg);

if(type == ClientRegisterMsg::id_) {
    ClientRegisterMsg msg;
    buffer >> msg;
    std::string name = msg.name;
    // do other things
}
```

## Supported primitive types

- char
- string
- double
