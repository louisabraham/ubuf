import yaml


def c_translate_type(t):
    C_TYPES = {"string": "std::string"}
    if t in C_TYPES:
        return C_TYPES[t]
    return t


def c_struct(name, decl, id_, is_message):
    C_STRUCT = "struct {name} {{\n{fields}\n}};\n"
    fields = f"  static constexpr char id_ = {id_};\n" if is_message else ""
    fields += "\n".join(
        f"  {c_translate_type(type)} {attr};" for attr, type in decl.items()
    )
    return C_STRUCT.format(**locals())


def c_reader(name, decl):
    C_READER = "void operator>>(InBuffer &buf, {name}& out) {{\n{fields}\n}};\n"
    fields = "\n".join(f"  buf >> out.{attr};" for attr, _ in decl.items())
    return C_READER.format(**locals())


def c_writer(name, decl, is_message):
    C_WRITER_TYPE = (
        "void operator<<(OutBuffer &buf, const {name} &el) {{\n{fields}\n}};\n"
    )
    C_WRITER_MESSAGE = (
        "void operator<<(OutBuffer &buf, const {name} &el) {{\n"
        "  buf << el.id_;\n"
        "{fields}\n"
        "}};\n"
    )
    fields = "\n".join(f"  buf << el.{attr};" for attr, _ in decl.items())
    return (C_WRITER_MESSAGE if is_message else C_WRITER_TYPE).format(**locals())


def c_code(types, is_message):
    C_USING = "using {name} = {decl};\n"
    ans = []
    for id_, (name, decl) in enumerate(types.items()):
        if not decl:
            decl = {}
        if isinstance(decl, str):
            decl = c_translate_type(decl)
            code = C_USING.format(**locals())
        else:
            struct = c_struct(name, decl, id_, is_message)
            reader = c_reader(name, decl)
            writer = c_writer(name, decl, is_message)
            code = struct + reader + writer
        ans.append(code)
    return "\n".join(ans)


JS_TYPES = {}


def snake_case_to_CamelCase(t):
    return "".join(map(str.capitalize, t.split("_")))


def js_register_type(name, decl):
    JS_TYPES[name] = snake_case_to_CamelCase(decl)


def js_translate_type(t):
    if t in JS_TYPES:
        return JS_TYPES[t]
    return snake_case_to_CamelCase(t)


JS_STRUCT = """
export class {name} {{
  constructor({sign}) {{
    {fields}
  }}
  serialize() {{
    const buf = new OutBuffer();
    buf.write{name}(this);
    return buf.serialize();
  }}
  deserialize(buffer) {{
    return buffer.read{name}();
  }}
{msg_id}}}
"""


def js_struct(name, decl, id_, is_message):
    sign = ", ".join(decl)
    fields = "\n    ".join(f"this.{attr} = {attr};" for attr in decl)
    msg_id = f"  id_ = {id_};\n" if is_message else ""
    ans = JS_STRUCT.format(**locals())
    if is_message:
        #        ans += f"MsgEnum.{name} = {id_};\n"
        ans += f"{name}.id = {id_};\n"
    return ans


JS_READER = (
    "InBuffer.prototype.read{name} = function () {{\n"
    "  return new {name}({fields});\n}};\n"
)


def js_reader(name, decl):
    fields = "\n    ".join(
        f"this.read{js_translate_type(type)}()," for attr, type in decl.items()
    )
    return JS_READER.format(**locals())


JS_WRITER = "OutBuffer.prototype.write{name} = function (el) {{\n  {fields}\n}};\n"


def js_writer(name, decl, is_message):
    # todo msgid
    fields = "\n  ".join(
        f"this.write{js_translate_type(type)}(el.{attr});"
        for attr, type in decl.items()
    )
    if is_message:
        fields = f"this.writeChar({name}.id);\n  " + fields
    return JS_WRITER.format(**locals())


def js_code(types, is_message):
    ans = []
    #    if is_message:
    #        ans.append("export const MsgEnum = {};\n")
    for id_, (name, decl) in enumerate(types.items()):
        if not decl:
            decl = {}
        if isinstance(decl, str):
            js_register_type(name, decl)
            continue
        else:
            struct = js_struct(name, decl, id_, is_message)
            reader = js_reader(name, decl)
            writer = js_writer(name, decl, is_message)
            code = struct + reader + writer
        ans.append(code)
    #    if is_message:
    #        ans.append("Object.freeze(MsgEnum);")
    return "\n".join(ans)


# TODO: varint and lists


def main():
    import argparse
    import sys
    import pathlib

    parser = argparse.ArgumentParser(description="Generate protocol code")
    parser.add_argument(
        "infile", nargs="?", type=argparse.FileType("r"), default=sys.stdin
    )
    parser.add_argument("--lang", choices=["cpp", "js"], required=True)

    args = parser.parse_args()

    # if args.lang == "cpp":
    #     print('#include "io.hpp"\n')
    # else:
    #     print("import { InBuffer, OutBuffer } from './io.js';")

    here = pathlib.Path(__file__).parent.resolve()
    file = "io." + {"js": "js", "cpp": "hpp"}[args.lang]
    print((here / "io" / file).read_text())

    config = yaml.load(args.infile.read(), yaml.BaseLoader)
    code_fun = c_code if args.lang == "cpp" else js_code
    print(code_fun(config["types"], False))
    print(code_fun(config["messages"], True))
