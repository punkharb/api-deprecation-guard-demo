window.DEMO = {
  "version": "oasdiff version 1.40.0",
  "builtAt": "2026-11-27",
  "usage": [
    {
      "app": "App A (profile page)",
      "method": "GET",
      "path": "/users/{id}",
      "field": "name"
    },
    {
      "app": "App B (delivery app)",
      "method": "GET",
      "path": "/users/{id}",
      "field": "name"
    },
    {
      "app": "App B (delivery app)",
      "method": "GET",
      "path": "/users/{id}",
      "field": "phone"
    },
    {
      "app": "App C (admin tool)",
      "method": "GET",
      "path": "/users/{id}",
      "field": "id"
    },
    {
      "app": "App D (finance report)",
      "method": "GET",
      "path": "/orders",
      "field": "total"
    }
  ],
  "scenarios": [
    {
      "file": "1-remove.yaml",
      "prFails": true,
      "changes": [
        {
          "id": "api-path-removed-without-deprecation",
          "text": "API path removed without deprecation",
          "level": 3,
          "operation": "GET",
          "operationId": "listOrders",
          "path": "/orders",
          "section": "paths",
          "baseSource": {
            "file": "base.yaml",
            "line": 23,
            "column": 5,
            "endLine": 36,
            "endColumn": 42
          },
          "fingerprint": "b48543528e80"
        },
        {
          "id": "api-version-changed",
          "text": "the API version changed from `1.0.0` to `2.0.0`",
          "level": 1,
          "section": "info",
          "baseSource": {
            "file": "base.yaml",
            "line": 3,
            "column": 25
          },
          "revisionSource": {
            "file": "1-remove.yaml",
            "line": 4,
            "column": 25
          },
          "fingerprint": "bcefc6cd3337"
        },
        {
          "id": "response-optional-property-removed",
          "text": "removed the optional property `phone` from the response with the `200` status",
          "level": 1,
          "operation": "GET",
          "operationId": "getUser",
          "path": "/users/{id}",
          "section": "paths",
          "baseSource": {
            "file": "base.yaml",
            "line": 20,
            "column": 19,
            "endLine": 20,
            "endColumn": 40
          },
          "fingerprint": "96597bcc3346"
        }
      ],
      "impact": {
        "broken": [
          {
            "app": "App D (finance report)",
            "reason": "GET /orders removed"
          },
          {
            "app": "App B (delivery app)",
            "reason": "GET /users/{id} field 'phone' removed"
          }
        ],
        "warned": [],
        "safe": [
          "App A (profile page)",
          "App C (admin tool)"
        ]
      }
    },
    {
      "file": "2-deprecate.yaml",
      "prFails": false,
      "changes": [
        {
          "id": "api-version-changed",
          "text": "the API version changed from `1.0.0` to `1.1.0`",
          "level": 1,
          "section": "info",
          "baseSource": {
            "file": "base.yaml",
            "line": 3,
            "column": 25
          },
          "revisionSource": {
            "file": "2-deprecate.yaml",
            "line": 4,
            "column": 25
          },
          "fingerprint": "b378bf589930"
        },
        {
          "id": "endpoint-deprecated-with-sunset",
          "text": "endpoint deprecated with sunset date `2027-06-01`",
          "level": 1,
          "operation": "GET",
          "operationId": "listOrders",
          "path": "/orders",
          "section": "paths",
          "revisionSource": {
            "file": "2-deprecate.yaml",
            "line": 26,
            "column": 7
          },
          "fingerprint": "de24cd33b74b"
        }
      ],
      "impact": {
        "broken": [],
        "warned": [
          {
            "app": "App D (finance report)",
            "reason": "GET /orders deprecated, sunset 2027-06-01"
          }
        ],
        "safe": [
          "App A (profile page)",
          "App B (delivery app)",
          "App C (admin tool)"
        ]
      }
    },
    {
      "file": "3-rename.yaml",
      "prFails": false,
      "changes": [
        {
          "id": "api-version-changed",
          "text": "the API version changed from `1.0.0` to `2.0.0`",
          "level": 1,
          "section": "info",
          "baseSource": {
            "file": "base.yaml",
            "line": 3,
            "column": 25
          },
          "revisionSource": {
            "file": "3-rename.yaml",
            "line": 4,
            "column": 25
          },
          "fingerprint": "bcefc6cd3337"
        },
        {
          "id": "response-optional-property-added",
          "text": "added the optional property `phoneNumber` to the response with the `200` status",
          "level": 1,
          "operation": "GET",
          "operationId": "getUser",
          "path": "/users/{id}",
          "section": "paths",
          "revisionSource": {
            "file": "3-rename.yaml",
            "line": 21,
            "column": 19,
            "endLine": 21,
            "endColumn": 46
          },
          "fingerprint": "bbab4093b6c5"
        },
        {
          "id": "response-optional-property-removed",
          "text": "removed the optional property `phone` from the response with the `200` status",
          "level": 1,
          "operation": "GET",
          "operationId": "getUser",
          "path": "/users/{id}",
          "section": "paths",
          "baseSource": {
            "file": "base.yaml",
            "line": 20,
            "column": 19,
            "endLine": 20,
            "endColumn": 40
          },
          "fingerprint": "96597bcc3346"
        }
      ],
      "impact": {
        "broken": [
          {
            "app": "App B (delivery app)",
            "reason": "GET /users/{id} field 'phone' removed"
          }
        ],
        "warned": [],
        "safe": [
          "App A (profile page)",
          "App C (admin tool)",
          "App D (finance report)"
        ]
      }
    }
  ]
};
