// C++ sample
namespace demo {
template <typename T>
class Example {
public:
  constexpr int size() const { return 42; }
  T value;
  int count = 1;
  bool ready = true;
  const char* text = R"x(raw
middle
raw text continues
and remains open
)x";
  int next() const {
    return count + 1;
  }
  T get() const {
    return value;
  }
};
}
