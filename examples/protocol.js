export class InBuffer extends Uint8Array {
  constructor(inp) {
    super(inp);
    this.offset = 0;
  }
  readChar() {
    this.offset += 1;
    return this[this.offset - 1];
  }
  readSize() {
    let ans = 0;
    let c;
    do {
      c = this.readChar();
      ans <<= 7;
      ans += c & 0x7f;
    } while (c & 0x80);

    return ans;
  }
  readDouble() {
    let tmp = new ArrayBuffer(8);
    let bytesBuf = new Uint8Array(tmp);
    for (let i = 0; i < 8; i++) bytesBuf[i] = this.readChar();
    return new Float64Array(tmp)[0];
  }
  readString() {
    let sz = this.readSize();
    var result = "";
    for (let i = 0; i < sz; i++) result += String.fromCharCode(this.readChar());
    return result;
  }
}

export class OutBuffer extends Array {
  constructor() {
    super();
  }
  serialize() {
    return new Uint8Array(this);
  }
  writeChar(char) {
    this.push(char);
  }
  writeSize(inp) {
    const out = new Array();
    while (inp) {
      const c = (inp & 0x7f) | 0x80;
      out.push(c);
      inp >>= 7;
    }
    if (!out.length) out.push(0);
    else out[0] ^= 0x80;
    out.reverse();
    for (let i = 0; i < out.length; i++) this.writeChar(out[i]);
  }
  writeDouble(number) {
    let buffer = new ArrayBuffer(8); // JS numbers are 8 bytes long, or 64 bits
    let longNum = new Float64Array(buffer); // so equivalent to Float64
    longNum[0] = number;
    let tmp = new Uint8Array(buffer);
    for (let i = 0; i < 8; i++) this.writeChar(tmp[i]);
  }
  writeString(string) {
    this.writeSize(string.length);
    for (let i = 0; i < string.length; i++)
      this.writeChar(string.charCodeAt(i));
  }
}



export class Pos {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  serialize() {
    const buf = new OutBuffer();
    buf.writePos(this);
    return buf.serialize();
  }
  deserialize(buffer) {
    return buffer.readPos();
  }
}
InBuffer.prototype.readPos = function () {
  return new Pos(this.readDouble(),
    this.readDouble(),);
};
OutBuffer.prototype.writePos = function (el) {
  this.writeDouble(el.x);
  this.writeDouble(el.y);
};


export class ClientRegisterMsg {
  constructor(name) {
    this.name = name;
  }
  serialize() {
    const buf = new OutBuffer();
    buf.writeClientRegisterMsg(this);
    return buf.serialize();
  }
  deserialize(buffer) {
    return buffer.readClientRegisterMsg();
  }
  id_ = 0;
}
ClientRegisterMsg.id = 0;
InBuffer.prototype.readClientRegisterMsg = function () {
  return new ClientRegisterMsg(this.readString(),);
};
OutBuffer.prototype.writeClientRegisterMsg = function (el) {
  this.writeChar(ClientRegisterMsg.id);
  this.writeString(el.name);
};


export class ServerRegisterMsg {
  constructor() {
    
  }
  serialize() {
    const buf = new OutBuffer();
    buf.writeServerRegisterMsg(this);
    return buf.serialize();
  }
  deserialize(buffer) {
    return buffer.readServerRegisterMsg();
  }
  id_ = 1;
}
ServerRegisterMsg.id = 1;
InBuffer.prototype.readServerRegisterMsg = function () {
  return new ServerRegisterMsg();
};
OutBuffer.prototype.writeServerRegisterMsg = function (el) {
  this.writeChar(ServerRegisterMsg.id);
  
};


export class ClientUpdateMsg {
  constructor(pos) {
    this.pos = pos;
  }
  serialize() {
    const buf = new OutBuffer();
    buf.writeClientUpdateMsg(this);
    return buf.serialize();
  }
  deserialize(buffer) {
    return buffer.readClientUpdateMsg();
  }
  id_ = 2;
}
ClientUpdateMsg.id = 2;
InBuffer.prototype.readClientUpdateMsg = function () {
  return new ClientUpdateMsg(this.readPos(),);
};
OutBuffer.prototype.writeClientUpdateMsg = function (el) {
  this.writeChar(ClientUpdateMsg.id);
  this.writePos(el.pos);
};


export class ServerUpdateMsg {
  constructor(user_id, name, pos) {
    this.user_id = user_id;
    this.name = name;
    this.pos = pos;
  }
  serialize() {
    const buf = new OutBuffer();
    buf.writeServerUpdateMsg(this);
    return buf.serialize();
  }
  deserialize(buffer) {
    return buffer.readServerUpdateMsg();
  }
  id_ = 3;
}
ServerUpdateMsg.id = 3;
InBuffer.prototype.readServerUpdateMsg = function () {
  return new ServerUpdateMsg(this.readString(),
    this.readString(),
    this.readPos(),);
};
OutBuffer.prototype.writeServerUpdateMsg = function (el) {
  this.writeChar(ServerUpdateMsg.id);
  this.writeString(el.user_id);
  this.writeString(el.name);
  this.writePos(el.pos);
};


export class ServerDeleteMsg {
  constructor(user_id) {
    this.user_id = user_id;
  }
  serialize() {
    const buf = new OutBuffer();
    buf.writeServerDeleteMsg(this);
    return buf.serialize();
  }
  deserialize(buffer) {
    return buffer.readServerDeleteMsg();
  }
  id_ = 4;
}
ServerDeleteMsg.id = 4;
InBuffer.prototype.readServerDeleteMsg = function () {
  return new ServerDeleteMsg(this.readString(),);
};
OutBuffer.prototype.writeServerDeleteMsg = function (el) {
  this.writeChar(ServerDeleteMsg.id);
  this.writeString(el.user_id);
};

