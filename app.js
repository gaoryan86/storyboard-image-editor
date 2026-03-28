const I18N = {
    zh: {
        subtitle: "拼接 + 水印统一工作流",
        modePipeline: "流水线",
        modeStitchOnly: "只拼接",
        modeWatermarkOnly: "只水印",
        sendToWatermark: "发送拼接结果到水印",
        goWatermark: "前往水印",
        stitchTitle: "故事板拼接（含宫格覆盖）",
        watermarkTitle: "批量水印（纯文字）",
        hints: {
            pipeline: "流水线模式：先拼接，再把结果发送到水印。",
            stitchOnly: "只拼接模式：可完整使用拼接功能（包含宫格覆盖）。",
            watermarkOnly: "只水印模式：可完整使用文字水印。"
        },
        status: {
            waiting: "等待中",
            noInput: "未接收流水线结果",
            exporting: "导出中",
            importing: "导入中",
            ready: "已就绪",
            loaded: "已载入",
            error: "错误"
        },
        errors: {
            timeout: "桥接响应超时",
            stitchNotReady: "拼接页面未就绪",
            watermarkNotReady: "水印页面未就绪",
            stitchExportFailed: "拼接导出失败",
            watermarkImportFailed: "水印导入失败",
            noComposite: "没有可用的拼接结果",
            handoffFailed: "流水线传递失败"
        }
    },
    en: {
        subtitle: "Unified Stitch + Watermark Workflow",
        modePipeline: "Pipeline",
        modeStitchOnly: "Stitch Only",
        modeWatermarkOnly: "Watermark Only",
        sendToWatermark: "Send Stitch Result To Watermark",
        goWatermark: "Go To Watermark",
        stitchTitle: "Storyboard Stitcher (includes Replace Cells)",
        watermarkTitle: "Batch Watermark (text only)",
        hints: {
            pipeline: "Pipeline mode: stitch first, then send result to watermark.",
            stitchOnly: "Stitch-only mode: full stitch workflow including Replace Cells.",
            watermarkOnly: "Watermark-only mode: full text watermark workflow."
        },
        status: {
            waiting: "Waiting",
            noInput: "No Pipeline Input",
            exporting: "Exporting",
            importing: "Importing",
            ready: "Ready",
            loaded: "Loaded",
            error: "Error"
        },
        errors: {
            timeout: "Bridge response timeout",
            stitchNotReady: "Stitch frame not ready",
            watermarkNotReady: "Watermark frame not ready",
            stitchExportFailed: "Stitch export failed",
            watermarkImportFailed: "Watermark import failed",
            noComposite: "No composite output.",
            handoffFailed: "Pipeline handoff failed"
        }
    }
};

const state = {
    mode: "pipeline",
    language: "zh"
};

const UI = {
    workspace: document.getElementById("workspace"),
    modeButtons: Array.from(document.querySelectorAll("[data-mode]")),
    modePipeline: document.getElementById("mode-pipeline"),
    modeStitchOnly: document.getElementById("mode-stitch-only"),
    modeWatermarkOnly: document.getElementById("mode-watermark-only"),
    appSubtitle: document.getElementById("app-subtitle"),
    workflowHint: document.getElementById("workflow-hint"),
    sendToWatermarkButton: document.getElementById("send-to-watermark-btn"),
    focusWatermarkButton: document.getElementById("focus-watermark-btn"),
    stitchTitle: document.getElementById("stitch-title"),
    watermarkTitle: document.getElementById("watermark-title"),
    stitchPanel: document.getElementById("stitch-panel"),
    watermarkPanel: document.getElementById("watermark-panel"),
    stitchFrame: document.getElementById("stitch-frame"),
    watermarkFrame: document.getElementById("watermark-frame"),
    stitchStatus: document.getElementById("stitch-status"),
    watermarkStatus: document.getElementById("watermark-status"),
    langZhButton: document.getElementById("lang-zh"),
    langEnButton: document.getElementById("lang-en")
};

const pendingRequests = new Map();

function t(keyPath) {
    const dictionary = I18N[state.language] || I18N.en;
    return keyPath.split(".").reduce((value, key) => (value && value[key] !== undefined ? value[key] : null), dictionary) || keyPath;
}

function createRequestId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function setStatus(element, statusKey, className) {
    element.textContent = t(`status.${statusKey}`);
    element.className = `status-pill ${className}`.trim();
}

function updateLanguageToggle() {
    UI.langZhButton.classList.toggle("active", state.language === "zh");
    UI.langEnButton.classList.toggle("active", state.language === "en");
}

function setHintByMode() {
    if (state.mode === "pipeline") {
        UI.workflowHint.textContent = t("hints.pipeline");
        return;
    }
    if (state.mode === "stitch-only") {
        UI.workflowHint.textContent = t("hints.stitchOnly");
        return;
    }
    UI.workflowHint.textContent = t("hints.watermarkOnly");
}

function applyTranslations() {
    UI.appSubtitle.textContent = t("subtitle");
    UI.modePipeline.textContent = t("modePipeline");
    UI.modeStitchOnly.textContent = t("modeStitchOnly");
    UI.modeWatermarkOnly.textContent = t("modeWatermarkOnly");
    UI.sendToWatermarkButton.textContent = t("sendToWatermark");
    UI.focusWatermarkButton.textContent = t("goWatermark");
    UI.stitchTitle.textContent = t("stitchTitle");
    UI.watermarkTitle.textContent = t("watermarkTitle");
    setHintByMode();
    updateLanguageToggle();
}

function setLanguage(language) {
    state.language = language === "zh" ? "zh" : "en";
    applyTranslations();
    broadcastLanguage();
}

function broadcastLanguage() {
    const payload = { type: "sbe-set-language", payload: { language: state.language } };
    if (UI.stitchFrame.contentWindow) {
        UI.stitchFrame.contentWindow.postMessage(payload, "*");
    }
    if (UI.watermarkFrame.contentWindow) {
        UI.watermarkFrame.contentWindow.postMessage(payload, "*");
    }
}

function setMode(mode) {
    state.mode = mode;
    UI.modeButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.mode === mode);
    });

    if (mode === "pipeline") {
        UI.workspace.className = "workspace pipeline";
        UI.stitchPanel.classList.remove("hidden");
        UI.watermarkPanel.classList.remove("hidden");
        UI.sendToWatermarkButton.disabled = false;
        UI.focusWatermarkButton.disabled = false;
        setHintByMode();
        return;
    }

    UI.workspace.className = "workspace single";
    UI.sendToWatermarkButton.disabled = true;
    UI.focusWatermarkButton.disabled = mode !== "watermark-only";

    if (mode === "stitch-only") {
        UI.stitchPanel.classList.remove("hidden");
        UI.watermarkPanel.classList.add("hidden");
        setHintByMode();
        return;
    }

    UI.stitchPanel.classList.add("hidden");
    UI.watermarkPanel.classList.remove("hidden");
    setHintByMode();
}

function waitForResponse(requestId, timeoutMs = 12000) {
    return new Promise((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
            pendingRequests.delete(requestId);
            reject(new Error(t("errors.timeout")));
        }, timeoutMs);
        pendingRequests.set(requestId, { resolve, reject, timeoutId });
    });
}

async function requestStitchExport() {
    if (!UI.stitchFrame.contentWindow) {
        throw new Error(t("errors.stitchNotReady"));
    }
    const requestId = createRequestId("stitch_export");
    const responsePromise = waitForResponse(requestId);
    UI.stitchFrame.contentWindow.postMessage({ type: "sbe-export-request", requestId }, "*");
    const response = await responsePromise;
    if (!response.success) {
        throw new Error(response.error || t("errors.stitchExportFailed"));
    }
    return response.payload;
}

async function requestWatermarkImport(dataUrl, fileName) {
    if (!UI.watermarkFrame.contentWindow) {
        throw new Error(t("errors.watermarkNotReady"));
    }
    const requestId = createRequestId("watermark_import");
    const responsePromise = waitForResponse(requestId);
    UI.watermarkFrame.contentWindow.postMessage(
        { type: "sbe-import-request", requestId, payload: { dataUrl, fileName } },
        "*"
    );
    const response = await responsePromise;
    if (!response.success) {
        throw new Error(response.error || t("errors.watermarkImportFailed"));
    }
}

async function sendStitchResultToWatermark() {
    try {
        setStatus(UI.stitchStatus, "exporting", "warn");
        const result = await requestStitchExport();
        if (!result || !result.dataUrl) {
            throw new Error(t("errors.noComposite"));
        }

        setStatus(UI.watermarkStatus, "importing", "warn");

        const fallbackName = `pipeline_${Date.now()}.${result.extension || "jpg"}`;
        const fileName = result.fileName || fallbackName;
        await requestWatermarkImport(result.dataUrl, fileName);

        setStatus(UI.stitchStatus, "ready", "ok");
        setStatus(UI.watermarkStatus, "loaded", "ok");
        setMode("watermark-only");
    } catch (error) {
        console.error(error);
        setStatus(UI.stitchStatus, "error", "warn");
        setStatus(UI.watermarkStatus, "noInput", "warn");
        alert(`${t("errors.handoffFailed")}: ${error.message}`);
    }
}

function handleMessage(event) {
    const data = event.data;
    if (!data || typeof data !== "object" || !data.requestId) {
        return;
    }
    if (data.type !== "sbe-export-response" && data.type !== "sbe-import-response") {
        return;
    }
    const pending = pendingRequests.get(data.requestId);
    if (!pending) return;
    pendingRequests.delete(data.requestId);
    window.clearTimeout(pending.timeoutId);
    pending.resolve(data);
}

function bindEvents() {
    window.addEventListener("message", handleMessage);

    UI.modeButtons.forEach((button) => {
        button.addEventListener("click", () => setMode(button.dataset.mode));
    });

    UI.langZhButton.addEventListener("click", () => setLanguage("zh"));
    UI.langEnButton.addEventListener("click", () => setLanguage("en"));

    UI.sendToWatermarkButton.addEventListener("click", () => {
        sendStitchResultToWatermark().catch((error) => {
            console.error(error);
        });
    });

    UI.focusWatermarkButton.addEventListener("click", () => {
        setMode("watermark-only");
    });

    UI.stitchFrame.addEventListener("load", () => {
        broadcastLanguage();
    });
    UI.watermarkFrame.addEventListener("load", () => {
        broadcastLanguage();
    });
}

bindEvents();
applyTranslations();
setStatus(UI.stitchStatus, "waiting", "");
setStatus(UI.watermarkStatus, "noInput", "warn");
setMode("pipeline");
