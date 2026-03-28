const fs = require("fs");
const path = require("path");
const vm = require("vm");

function createClassList() {
    const set = new Set();
    return {
        toggle(className, enabled) {
            if (enabled) set.add(className);
            else set.delete(className);
        },
        add(className) {
            set.add(className);
        },
        remove(className) {
            set.delete(className);
        },
        contains(className) {
            return set.has(className);
        }
    };
}

function createElement(overrides = {}) {
    const handlers = {};
    return {
        textContent: "",
        className: "",
        disabled: false,
        dataset: {},
        classList: createClassList(),
        addEventListener(type, handler) {
            handlers[type] = handler;
        },
        click() {
            if (handlers.click) handlers.click();
        },
        ...overrides
    };
}

function assertEquals(actual, expected, label) {
    if (actual !== expected) {
        throw new Error(`[FAIL] ${label}\nExpected: ${expected}\nActual:   ${actual}`);
    }
}

function run() {
    const stitchMessages = [];
    const watermarkMessages = [];

    const modeButtons = [
        createElement({ dataset: { mode: "pipeline" } }),
        createElement({ dataset: { mode: "stitch-only" } }),
        createElement({ dataset: { mode: "watermark-only" } })
    ];

    const elements = {
        workspace: createElement(),
        "mode-pipeline": modeButtons[0],
        "mode-stitch-only": modeButtons[1],
        "mode-watermark-only": modeButtons[2],
        "app-subtitle": createElement(),
        "workflow-hint": createElement(),
        "send-to-watermark-btn": createElement(),
        "focus-watermark-btn": createElement(),
        "stitch-title": createElement(),
        "watermark-title": createElement(),
        "stitch-panel": createElement(),
        "watermark-panel": createElement(),
        "stitch-frame": createElement({
            contentWindow: {
                postMessage(message) {
                    stitchMessages.push(message);
                }
            }
        }),
        "watermark-frame": createElement({
            contentWindow: {
                postMessage(message) {
                    watermarkMessages.push(message);
                }
            }
        }),
        "stitch-status": createElement(),
        "watermark-status": createElement(),
        "lang-zh": createElement(),
        "lang-en": createElement()
    };

    const documentMock = {
        getElementById(id) {
            return elements[id];
        },
        querySelectorAll(selector) {
            if (selector === "[data-mode]") {
                return modeButtons;
            }
            return [];
        }
    };

    const windowMock = {
        addEventListener() {},
        setTimeout,
        clearTimeout
    };

    const context = {
        console,
        document: documentMock,
        window: windowMock,
        navigator: { language: "en-US" },
        alert() {}
    };

    const appJsPath = path.join(__dirname, "..", "app.js");
    const source = fs.readFileSync(appJsPath, "utf8");
    vm.runInNewContext(source, context, { filename: appJsPath });

    assertEquals(elements["app-subtitle"].textContent, "拼接 + 水印统一工作流", "default subtitle is ZH");
    assertEquals(elements["mode-pipeline"].textContent, "流水线", "default pipeline label is ZH");
    assertEquals(elements["stitch-status"].textContent, "等待中", "default stitch status is ZH");

    elements["lang-en"].click();
    assertEquals(elements["app-subtitle"].textContent, "Unified Stitch + Watermark Workflow", "subtitle switches back to EN");
    assertEquals(elements["mode-watermark-only"].textContent, "Watermark Only", "watermark mode switches back to EN");
    assertEquals(elements["workflow-hint"].textContent, "Pipeline mode: stitch first, then send result to watermark.", "hint switches back to EN");
    assertEquals(stitchMessages[stitchMessages.length - 1].payload.language, "en", "stitch frame receives en");
    assertEquals(watermarkMessages[watermarkMessages.length - 1].payload.language, "en", "watermark frame receives en");

    elements["lang-zh"].click();
    assertEquals(elements["app-subtitle"].textContent, "拼接 + 水印统一工作流", "subtitle switches back to ZH");
    assertEquals(elements["mode-pipeline"].textContent, "流水线", "pipeline label switches back to ZH");
    assertEquals(elements["send-to-watermark-btn"].textContent, "发送拼接结果到水印", "send button switches back to ZH");
    assertEquals(elements["workflow-hint"].textContent, "流水线模式：先拼接，再把结果发送到水印。", "hint switches back to ZH");
    assertEquals(stitchMessages[stitchMessages.length - 1].type, "sbe-set-language", "stitch frame receives language sync");
    assertEquals(stitchMessages[stitchMessages.length - 1].payload.language, "zh", "stitch frame receives zh");
    assertEquals(watermarkMessages[watermarkMessages.length - 1].payload.language, "zh", "watermark frame receives zh");

    console.log("[PASS] Shell i18n toggle verification passed.");
}

run();
