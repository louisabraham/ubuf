#include <type_traits>
#include <string>
#include <string_view>
#include <cstring>

struct InBuffer
{
    char *p;
    size_t _size;
    size_t offset;

    InBuffer(std::string_view view)
        : p(const_cast<char *>(view.data())), _size(view.size()), offset(0) {}

    size_t size()
    {
        return _size;
    };

    size_t read_size()
    {
        size_t ans = 0;
        char c;
        do
        {
            *this >> c;
            ans <<= 7;
            ans += c & 0x7f;
        } while (c & 0x80);
        return ans;
    }

    template <typename T,
              std::enable_if_t<
                  std::is_integral<T>::value || std::is_floating_point<T>::value,
                  int> = 0>
    void operator>>(T &out)
    {
        if (size() < offset + sizeof(T))
            throw "OOM";
        out = *reinterpret_cast<T *>(p + offset);
        offset += sizeof(T);
    }

    void operator>>(std::string &out)
    {
        auto sz = read_size();
        if (size() < offset + sz)
            throw "OOM";
        out.assign(const_cast<const char *>(p + offset), static_cast<size_t>(sz));
        offset += sz;
    }
};

struct OutBuffer
{
    static const size_t INIT = 64;
    char *p;
    size_t _size;
    size_t bufsize;

    OutBuffer()
        : p(reinterpret_cast<char *>(malloc(INIT))), _size(0), bufsize(INIT) {}

    ~OutBuffer()
    {
        free(p);
    }

    inline size_t size()
    {
        return _size;
    };

    void increase_size(size_t sz)
    {
        _size += sz;
        if (bufsize < size())
        {
            while (bufsize < size())
                bufsize *= 2;
            p = reinterpret_cast<decltype(p)>(realloc(p, bufsize));
        }
    }

    void write_size(size_t inp)
    {
        std::string out;
        while (inp)
        {
            char c = (char)(inp & 0x7f) | 0x80;
            out += c;
            inp >>= 7;
        }
        if (out.empty())
            out += (char)0;
        else
            out[0] ^= 0x80;
        for (auto c = out.crbegin(); c < out.crend(); c++)
            *this << *c;
    }

    template <typename T,
              std::enable_if_t<
                  std::is_integral<T>::value || std::is_floating_point<T>::value,
                  int> = 0>
    void operator<<(const T &in)
    {
        increase_size(sizeof(T));
        memcpy(p + size() - sizeof(T), &in, sizeof(T));
    }

    template <typename T,
              std::enable_if_t<
                  std::is_convertible<T, std::string_view>::value,
                  int> = 0>
    void operator<<(const T &in)
    {
        auto view = static_cast<std::string_view>(in);
        auto sz = view.size();
        this->write_size(sz);
        increase_size(sz);
        memcpy(p + size() - sz, view.data(), sz);
    }

    std::string as_string()
    {
        return std::string(p, size());
    }
};

template <typename T>
std::string serialize(const T &msg)
{
    OutBuffer buffer;
    buffer << msg;
    return buffer.as_string();
}

using coord_t = double;

struct Pos {
  coord_t x;
  coord_t y;
};
void operator>>(InBuffer &buf, Pos& out) {
  buf >> out.x;
  buf >> out.y;
};
void operator<<(OutBuffer &buf, const Pos &el) {
  buf << el.x;
  buf << el.y;
};

using UserId = std::string;

struct ClientRegisterMsg {
  static constexpr char id_ = 0;
  std::string name;
};
void operator>>(InBuffer &buf, ClientRegisterMsg& out) {
  buf >> out.name;
};
void operator<<(OutBuffer &buf, const ClientRegisterMsg &el) {
  buf << el.id_;
  buf << el.name;
};

struct ServerRegisterMsg {
  static constexpr char id_ = 1;

};
void operator>>(InBuffer &buf, ServerRegisterMsg& out) {

};
void operator<<(OutBuffer &buf, const ServerRegisterMsg &el) {
  buf << el.id_;

};

struct ClientUpdateMsg {
  static constexpr char id_ = 2;
  Pos pos;
};
void operator>>(InBuffer &buf, ClientUpdateMsg& out) {
  buf >> out.pos;
};
void operator<<(OutBuffer &buf, const ClientUpdateMsg &el) {
  buf << el.id_;
  buf << el.pos;
};

struct ServerUpdateMsg {
  static constexpr char id_ = 3;
  UserId user_id;
  std::string name;
  Pos pos;
};
void operator>>(InBuffer &buf, ServerUpdateMsg& out) {
  buf >> out.user_id;
  buf >> out.name;
  buf >> out.pos;
};
void operator<<(OutBuffer &buf, const ServerUpdateMsg &el) {
  buf << el.id_;
  buf << el.user_id;
  buf << el.name;
  buf << el.pos;
};

struct ServerDeleteMsg {
  static constexpr char id_ = 4;
  UserId user_id;
};
void operator>>(InBuffer &buf, ServerDeleteMsg& out) {
  buf >> out.user_id;
};
void operator<<(OutBuffer &buf, const ServerDeleteMsg &el) {
  buf << el.id_;
  buf << el.user_id;
};

