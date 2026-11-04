import type { LanguageExpectation } from '../support/fixture-check';
export const cFamilyExpectations: readonly LanguageExpectation[] = [
  {
    "id": "c",
    "ext": "c",
    "classes": [
      "keyword",
      "string",
      "comment",
      "number"
    ],
    "snippets": [
      [
        "#include",
        "meta"
      ],
      [
        "<stdio.h>",
        "string"
      ],
      [
        "/* multi-line",
        "comment"
      ],
      [
        "0x1Fu",
        "number"
      ]
    ]
  },
  {
    "id": "cpp",
    "ext": "cpp",
    "classes": [
      "keyword",
      "string",
      "comment",
      "number"
    ],
    "snippets": [
      [
        "namespace",
        "keyword"
      ],
      [
        "R\"x(",
        "string"
      ],
      [
        "middle",
        "string"
      ],
      [
        "42",
        "number"
      ],
      ["template", "keyword"]
    ]
  },
  {
    "id": "csharp",
    "ext": "cs",
    "classes": [
      "keyword",
      "string",
      "comment",
      "number"
    ],
    "snippets": [
      [
        "#region",
        "meta"
      ],
      [
        "class",
        "keyword"
      ],
      [
        "@\"a\"\"b\"",
        "string"
      ],
      [
        "42",
        "number"
      ]
    ]
  },
  {
    "id": "objc",
    "ext": "m",
    "classes": [
      "keyword",
      "string",
      "comment",
      "number"
    ],
    "snippets": [
      [
        "@interface",
        "keyword"
      ],
      [
        "@property",
        "keyword"
      ],
      [
        "@end",
        "keyword"
      ],
      [
        "@\"str\"",
        "string"
      ],
      ["@end", "keyword"]
    ]
  },
  {
    "id": "objcpp",
    "ext": "mm",
    "classes": [
      "keyword",
      "string",
      "comment",
      "number"
    ],
    "snippets": [
      [
        "@interface",
        "keyword"
      ],
      [
        "@property",
        "keyword"
      ],
      [
        "class",
        "keyword"
      ],
      [
        "@\"str\"",
        "string"
      ],
      ["@end", "keyword"]
    ]
  },
  {
    "id": "d",
    "ext": "d",
    "classes": [
      "keyword",
      "string",
      "comment",
      "number"
    ],
    "snippets": [
      [
        "/+ outer /+ inner +/ end +/",
        "comment"
      ],
      [
        "`raw`",
        "string"
      ],
      [
        "int",
        "keyword"
      ],
      [
        "42",
        "number"
      ]
    ]
  },
  {
    "id": "go",
    "ext": "go",
    "classes": [
      "keyword",
      "string",
      "comment",
      "number"
    ],
    "snippets": [
      [
        "`hello",
        "string"
      ],
      [
        "world`",
        "string"
      ],
      [
        "sample",
        "function"
      ],
      [
        ":=",
        "operator"
      ]
    ]
  },
  {
    "id": "rust",
    "ext": "rs",
    "classes": [
      "keyword",
      "string",
      "comment",
      "number"
    ],
    "snippets": [
      [
        "'a",
        "type"
      ],
      [
        "r#\"hello",
        "string"
      ],
      [
        "world\"#",
        "string"
      ],
      [
        "#[derive(Debug)]",
        "meta"
      ],
      ["nested inner comment", "comment"],
      ["macro!", "function"]
    ]
  },
  {
    "id": "zig",
    "ext": "zig",
    "classes": [
      "keyword",
      "string",
      "comment",
      "number"
    ],
    "snippets": [
      [
        '@im' + 'port',
        "function"
      ],
      [
        "const",
        "keyword"
      ],
      [
        "42",
        "number"
      ],
      [
        "\\\\a multiline string",
        "string"
      ],
      ["//!", "comment"]
    ]
  },
  {
    "id": "swift",
    "ext": "swift",
    "classes": [
      "keyword",
      "string",
      "comment",
      "number"
    ],
    "snippets": [
      [
        "\"\"\"",
        "string"
      ],
      [
        "#if",
        "meta"
      ],
      [
        "@objc",
        "meta"
      ],
      [
        "42",
        "number"
      ],
      ["nested inner comment", "comment"]
    ]
  },
  {
    "id": "pascal",
    "ext": "pas",
    "classes": [
      "keyword",
      "string",
      "comment",
      "number"
    ],
    "snippets": [
      [
        "BEGIN",
        "keyword"
      ],
      [
        "begin",
        "keyword"
      ],
      [
        "{ c }",
        "comment"
      ],
      [
        "'it''s'",
        "string"
      ],
      ["(* multi", "comment"],
      ["// explanatory line", "comment"]
    ]
  },
  {
    "id": "actionscript",
    "ext": "as",
    "classes": [
      "keyword",
      "string",
      "comment",
      "number"
    ],
    "snippets": [
      [
        "function",
        "keyword"
      ],
      [
        "package",
        "keyword"
      ],
      [
        "\"hello\"",
        "string"
      ],
      [
        "42",
        "number"
      ]
    ]
  }
];
