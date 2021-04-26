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

