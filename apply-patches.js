const fs = require("fs");
const path = require("path");

// Add Folly flags
const reactNativePodsPath = path.join(__dirname, "node_modules", "react-native", "scripts", "react_native_pods.rb");
if (fs.existsSync(reactNativePodsPath)) {
  let content = fs.readFileSync(reactNativePodsPath, "utf8");
  if (!content.includes("FOLLY_HAVE_CLOCK_GETTIME=1")) {
    content = content.replace("folly_flags += ' -Wno-comma -Wno-shorten-64-to-32'", "folly_flags += ' -Wno-comma -Wno-shorten-64-to-32'\n  folly_flags += ' -DFOLLY_HAVE_CLOCK_GETTIME=1'");
    fs.writeFileSync(reactNativePodsPath, content);
    console.log("✅ Added Folly flags to react_native_pods.rb");
  }
}

// Add char_traits specialization
const follyJsonPointerPath = path.join(__dirname, "node_modules", "RCT-Folly", "folly", "json_pointer.cpp");
if (fs.existsSync(follyJsonPointerPath)) {
  let content = fs.readFileSync(follyJsonPointerPath, "utf8");
  if (!content.includes("char_traits<unsigned char>")) {
    const patch = `#include <string>
namespace std {
    template <> struct char_traits<unsigned char> : char_traits<char> {};
}
`;
    content = patch + content;
    fs.writeFileSync(follyJsonPointerPath, content);
    console.log("✅ Added char_traits specialization to json_pointer.cpp");
  }
}
