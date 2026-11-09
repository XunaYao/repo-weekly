/* eslint-disable @typescript-eslint/no-require-imports, @next/next/no-assign-module-variable */
// 本测试使用 CommonJS 隔离加载器加载服务端模块，无需新增测试依赖。
const ts = require("typescript");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (id) => (id.startsWith("@/") ? load(path.join(root, "src", id.slice(2) + ".ts")) : require(id)),
    module,
    module.exports,
  );
  return module.exports;
}
const { POST } = load(path.join(root, "src/app/api/content/route.ts"));
const source = {
  repository: {
    fullName: "test/demo",
    url: "https://github.com/test/demo",
    description: null,
    language: null,
    topics: [],
  },
  research: {
    projectType: "测试工具",
    summary: "用于测试",
    compatibility: {
      scope: "unknown",
      supportedLanguages: [],
      supportedTools: [],
      requirements: [],
      notes: [],
    },
    targetUsers: [],
    coreCapabilities: [],
    technicalHighlights: [],
    contentAngles: [],
    risks: [],
    evidence: [],
  },
};
const draft = {
  wechat: { title: "测试", digest: "摘要", body: "正文", callToAction: "访问项目" },
  xiaohongshu: { title: "测试笔记", body: "简短介绍", hashtags: ["测试"] },
};
const scenarios = [
  { name: "invalid input", body: {}, status: 400, calls: 0 },
  { name: "invalid request JSON", raw: "{", status: 400, calls: 0 },
  {
    name: "missing key",
    key: "",
    status: 500,
    code: "ZHIPU_NOT_CONFIGURED",
    calls: 0,
    valid: null,
  },
  { name: "success", content: JSON.stringify(draft), status: 200, calls: 1, valid: true },
  {
    name: "fenced JSON",
    content: "\u0060\u0060\u0060json\n" + JSON.stringify(draft) + "\n\u0060\u0060\u0060",
    status: 200,
    calls: 1,
    valid: true,
  },
  {
    name: "invalid model JSON",
    content: "{",
    status: 502,
    code: "MODEL_RESPONSE_INVALID",
    calls: 1,
    valid: false,
  },
  {
    name: "missing fields",
    content: "{}",
    status: 502,
    code: "MODEL_RESPONSE_INVALID",
    calls: 1,
    valid: false,
  },
  { name: "busy", upstream: 429, status: 503, code: "ZHIPU_UNAVAILABLE", calls: 1, valid: null },
  { name: "auth", upstream: 401, status: 502, code: "ZHIPU_AUTH_ERROR", calls: 1, valid: null },
];
(async () => {
  const originalFetch = global.fetch;
  const originalInfo = console.info;
  const originalError = console.error;
  const originalKey = process.env.ZHIPU_API_KEY;
  try {
    for (const scenario of scenarios) {
      let calls = 0;
      const metrics = [];
      process.env.ZHIPU_API_KEY = scenario.key ?? "test-only";
      console.info = (message) => metrics.push(JSON.parse(message));
      console.error = () => {};
      global.fetch = async () => {
        calls++;
        return Response.json(
          scenario.upstream
            ? { error: { message: "test failure" } }
            : { choices: [{ message: { content: scenario.content } }] },
          { status: scenario.upstream ?? 200 },
        );
      };
      const response = await POST(
        new Request("http://localhost/api/content", {
          method: "POST",
          body: scenario.raw ?? JSON.stringify(scenario.body ?? { source }),
        }),
      );
      const payload = await response.json();
      assert.equal(response.status, scenario.status, scenario.name);
      assert.equal(calls, scenario.calls, scenario.name);
      if (scenario.code) assert.equal(payload.error.code, scenario.code);
      if (scenario.status === 200) assert.deepEqual(payload.data, draft);
      if ("valid" in scenario) {
        assert.equal(metrics[0].structureValid, scenario.valid);
        assert.equal(metrics[0].modelCalls, scenario.calls);
      }
      console.log("PASS " + scenario.name);
    }
  } finally {
    global.fetch = originalFetch;
    console.info = originalInfo;
    console.error = originalError;
    if (originalKey === undefined) delete process.env.ZHIPU_API_KEY;
    else process.env.ZHIPU_API_KEY = originalKey;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
