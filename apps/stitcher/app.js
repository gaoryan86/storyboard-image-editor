
const HANDLE_DB_NAME = "storyboard-image-stitcher-db";
const HANDLE_STORE_NAME = "kv";
const EXPORT_HANDLE_KEY = "exportDirectoryHandle";
const MAX_OUTPUT_EDGE = 5400;
const ENABLE_MOSAIC_FEATURE = false;
const DEFAULT_MOSAIC_BRUSH_SIZE = 72;
const PREVIEW_MOSAIC_BLOCK_SIZE = 18;
const EXPORT_MOSAIC_BLOCK_SIZE = 24;
const DIVIDER_COLOR = "#000000";
const SLOT_COUNT = 6;
const STORYBOARD_ASPECT = { width: 16, height: 9 };
const REPLACE_GRID_CONFIG = {
    grid4: {
        count: 4,
        columns: 2,
        rows: 2
    },
    grid6: {
        count: 6,
        columns: 2,
        rows: 3
    }
};

const MODE_CONFIG = {
    two: {
        requiredCount: 2
    },
    grid4: {
        requiredCount: 4
    },
    grid6: {
        requiredCount: 6
    },
    expand46: {
        requiredCount: 1
    },
    replace: {
        requiredCount: 1
    }
};

const state = {
    images: Array(SLOT_COUNT).fill(null),
    baseImage: null,
    overlayReplacements: Array(SLOT_COUNT).fill(null),
    extensionImages: Array(2).fill(null),
    mode: "two",
    orientation: "horizontal",
    replaceGridType: "grid4",
    selectedOverlayCells: [],
    exportFormat: "jpg",
    exportDirectoryHandle: null,
    isMosaicBrushMode: false,
    isPaintingMosaic: false,
    draggedSlotIndex: null,
    mosaicBrushSize: DEFAULT_MOSAIC_BRUSH_SIZE,
    mosaicBrushStrokes: [],
    lastAutoFileName: ""
};

const UI = {
    modeButtons: document.querySelectorAll("[data-mode]"),
    langEnButton: document.getElementById("lang-en"),
    langZhButton: document.getElementById("lang-zh"),
    headerTitle: document.getElementById("header-title"),
    headerSubtitle: document.getElementById("header-subtitle"),
    modePanelTitle: document.getElementById("mode-panel-title"),
    modePanelHint: document.getElementById("mode-panel-hint"),
    orientationButtons: document.querySelectorAll("[data-orientation]"),
    uploadSlots: Array.from(document.querySelectorAll("[data-slot]")).map((element, index) => ({
        root: element,
        input: document.getElementById(`file-slot-${index}`),
        label: document.getElementById(`slot-label-${index}`),
        tag: document.getElementById(`slot-tag-${index}`),
        preview: document.getElementById(`slot-preview-${index}`),
        meta: document.getElementById(`slot-meta-${index}`)
    })),
    replaceGridTypeTitle: document.getElementById("replace-grid-type-title"),
    replaceGridTypeHint: document.getElementById("replace-grid-type-hint"),
    importPanelTitle: document.getElementById("import-panel-title"),
    baseImageLabel: document.getElementById("base-image-label"),
    baseImageGroup: document.getElementById("replace-base-group"),
    baseImageButton: document.getElementById("base-image-btn"),
    baseImageInput: document.getElementById("base-image-input"),
    baseImagePreview: document.getElementById("base-image-preview"),
    baseImageMeta: document.getElementById("base-image-meta"),
    batchImportButton: document.getElementById("batch-import-btn"),
    batchFileInput: document.getElementById("batch-file-input"),
    uploadHint: document.getElementById("upload-hint"),
    toolsPanel: document.getElementById("tools-panel"),
    toolsPanelSummary: document.getElementById("tools-panel-summary"),
    toolsPanelHelp: document.getElementById("tools-panel-help"),
    orientationGroup: document.getElementById("orientation-group"),
    orientationLabel: document.getElementById("orientation-label"),
    replaceGridTypePanel: document.getElementById("replace-grid-type-panel"),
    replaceGridTypeGroup: document.getElementById("replace-grid-type-group"),
    replaceGridButtons: document.querySelectorAll("[data-replace-grid]"),
    replaceCellGroup: document.getElementById("replace-cell-group"),
    replaceCellButtons: Array.from(document.querySelectorAll("[data-cell-index]")),
    clearCellSelectionButton: document.getElementById("clear-cell-selection-btn"),
    replaceCellHint: document.getElementById("replace-cell-hint"),
    mosaicSection: document.getElementById("mosaic-section"),
    mosaicPanelSummary: document.getElementById("mosaic-panel-summary"),
    mosaicBrushLabel: document.getElementById("mosaic-brush-label"),
    mosaicBrushSize: document.getElementById("mosaic-brush-size"),
    mosaicBrushSizeValue: document.getElementById("mosaic-brush-size-value"),
    toggleMosaicButton: document.getElementById("toggle-mosaic-btn"),
    clearMosaicButton: document.getElementById("clear-mosaic-btn"),
    mosaicHint: document.getElementById("mosaic-hint"),
    exportPanelTitle: document.getElementById("export-panel-title"),
    fileNameLabel: document.getElementById("file-name-label"),
    exportFormat: document.getElementById("export-format"),
    exportFormatLabel: document.getElementById("export-format-label"),
    exportFormatHint: document.getElementById("export-format-hint"),
    fileNameInput: document.getElementById("file-name"),
    exportPathLabel: document.getElementById("export-path-label"),
    exportPath: document.getElementById("export-path"),
    exportPathHint: document.getElementById("export-path-hint"),
    pickFolderButton: document.getElementById("pick-folder"),
    saveFolderButton: document.getElementById("save-folder-btn"),
    downloadButton: document.getElementById("download-btn"),
    outputPanelTitle: document.getElementById("output-panel-title"),
    outputPanelHint: document.getElementById("output-panel-hint"),
    previewCanvas: document.getElementById("preview-canvas"),
    canvasShell: document.getElementById("canvas-shell"),
    emptyState: document.getElementById("empty-state"),
    emptyTitle: document.getElementById("empty-title"),
    emptyCopy: document.getElementById("empty-copy"),
    statusDimensionsLabel: document.getElementById("status-dimensions-label"),
    statusMode: document.getElementById("status-mode"),
    statusModeLabel: document.getElementById("status-mode-label"),
    statusDimensions: document.getElementById("status-dimensions"),
    statusMosaic: document.getElementById("status-mosaic"),
    summaryModeLabel: document.getElementById("summary-mode-label"),
    summaryMode: document.getElementById("summary-mode"),
    summaryLoadedLabel: document.getElementById("summary-loaded-label"),
    summaryLoaded: document.getElementById("summary-loaded"),
    summaryOutputLabel: document.getElementById("summary-output-label"),
    summaryOutput: document.getElementById("summary-output")
};

const I18N = {
    zh: {
        pageTitle: "Storyboard Image Stitcher",
        headerTitle: "Storyboard Image Stitcher",
        headerSubtitle: "storyboard",
        helpButtonLabel: "显示说明",
        modePanelTitle: "拼接模式",
        modePanelHint: "二宫格、四宫格、六宫格用于直接拼版；四宫格扩六宫格用于保留原四宫格并在下方补图；宫格覆盖用于替换现成四宫格或六宫格中的局部格子。",
        modeLabels: { two: "二宫格", grid4: "四宫格", grid6: "六宫格", expand46: "四宫格扩六宫格", replace: "宫格覆盖" },
        modeSummary: { two: "二宫格", grid4: "四宫格", grid6: "六宫格", expand46: "四宫格扩六宫格", replace: "宫格覆盖" },
        modeSecondary: { twoHorizontal: "左右", twoVertical: "上下", grid4: "2 x 2", grid6: "2 x 3", expand46: "新增下排", replace4: "四宫格底图", replace6: "六宫格底图" },
        modeEmptyTitle: { two: "先上传 2 张图片", grid4: "先上传 4 张图片", grid6: "先上传 6 张图片", expand46: "先上传一张四宫格底图", replace: "先上传一张底图" },
        modeEmptyCopy: {
            two: "页面会根据当前模式自动排成故事板，并在这里实时预览。",
            grid4: "四宫格会按固定格子顺序合成，并在这里实时预览。",
            grid6: "六宫格会按固定格子顺序合成，并在这里实时预览。",
            expand46: "上传一张已拼好的四宫格底图，再在下方左侧和右侧补 1 到 2 张图片。",
            replace: "上传一张已拼好的四宫格或六宫格底图，再把替换图覆盖到指定格子。"
        },
        modeUploadHint: {
            two: "上传后会自动生成预览，也可以直接拖动卡片调整顺序。",
            grid4: "上传后会自动生成预览，也可以直接拖动卡片调整顺序。",
            grid6: "上传后会自动生成预览，也可以直接拖动卡片调整顺序。",
            expand46: "先上传四宫格底图，再上传左下和右下补图；也可以按顺序批量导入 1 到 2 张补图。",
            replace: "先上传底图，再为对应格子上传替换图；也可以先选中格子后按顺序批量导入。"
        },
        baseImageLabels: { replace: "底图", expand46: "四宫格底图" },
        uploadBaseImageLabels: { replace: "上传底图", expand46: "上传四宫格底图" },
        baseImageEmptyStates: { replace: "先上传一张四宫格或六宫格底图", expand46: "先上传一张已拼好的四宫格底图" },
        baseImageMetaEmptyStates: { replace: "还没有选择底图", expand46: "还没有选择四宫格底图" },
        batchImportLabels: { default: "按顺序批量导入", replace: "按顺序批量导入替换图", expand46: "按顺序批量导入补图" },
        replaceGridTypeTitle: "底图类型",
        replaceGridTypeHint: "先选底图是四宫格还是六宫格，后面的替换格子会跟着切换。",
        replaceGridLabels: { grid4: "四宫格", grid6: "六宫格" },
        replaceGridLayoutLabel: { grid4: "宫格覆盖 / 四宫格", grid6: "宫格覆盖 / 六宫格" },
        replaceGridTags: {
            grid4: ["左上", "右上", "左下", "右下"],
            grid6: ["左上", "右上", "左中", "右中", "左下", "右下"]
        },
        importPanelTitle: "导入图片",
        imageLabel: "图片",
        replaceImageLabel: "替换图",
        extendImageLabel: "补图",
        slotEmpty: "点击上传",
        slotReplaceEmpty: "点击上传替换图",
        slotExtendEmpty: "点击上传补图",
        slotMetaEmpty: "未选择",
        slotMetaReplaceEmpty: "当前格子未替换",
        slotMetaExtendEmpty: "当前底部格子未补图",
        slotTags: {
            horizontal: ["左侧", "右侧"],
            vertical: ["上方", "下方"],
            grid4: ["左上", "右上", "左下", "右下"],
            grid6: ["左上", "右上", "左中", "右中", "左下", "右下"],
            expand46: ["左下", "右下"]
        },
        toolsPanelSummary: { two: "拼接方向", grid4: "宫格说明", grid6: "宫格说明", expand46: "扩展说明", replace: "替换格子" },
        toolsPanelHelp: {
            two: "双图模式下可切换左右拼接或上下拼接。",
            grid4: "四宫格固定 2 x 2，顺序按左到右、从上到下。",
            grid6: "六宫格固定 2 x 3，顺序按左到右、从上到下。",
            expand46: "上半部分保留原四宫格底图，下方新增左右两个 16:9 格子。补图会自动铺满裁切到底部格子里。",
            replace: "先点选要替换的格子，再按顺序批量导入；不选时会按所有格子顺序导入。替换图会自动铺满当前宫格，黑线分隔保持不变。"
        },
        orientationLabel: "拼接方向",
        orientationLabels: { horizontal: "左右拼接", vertical: "上下拼接" },
        clearSelectedCells: "清空选中格子",
        replaceCellHintDefault: "先点选要替换的格子，再按顺序批量导入；不选时会按所有格子顺序导入。替换图会自动铺满当前宫格，黑线分隔保持不变。",
        replaceCellHintSelected: "已选中 {count} 个格子：{names}。批量导入会按这个顺序落位。",
        mosaicPanelSummary: "马赛克",
        mosaicBrushLabel: "马赛克笔刷",
        mosaicToggle: "马赛克涂抹",
        clearMosaic: "清除马赛克",
        mosaicHint: "点击“马赛克涂抹”后，直接在合成预览图上按住拖动。切换模式、方向或更换图片时会自动清除旧马赛克。",
        exportPanelTitle: "导出设置",
        fileNameLabel: "导出文件名",
        exportFormatLabel: "导出格式",
        exportFormatHint: "默认导出 JPG。选“原格式”时，如果格式不一致，会自动回退为 JPG。",
        exportFormatOriginalPng: "原格式 PNG",
        exportFormatOriginalJpg: "原格式 JPG",
        exportPathLabel: "导出文件夹",
        exportPathHint: "首次导出时点右侧按钮授权文件夹。导出会自动控制在最长边 5400 以内。",
        exportPathEmpty: "未选择",
        selectExportFolderTitle: "选择导出文件夹",
        outputPanelTitle: "输出",
        saveToFolder: "保存到目标文件夹",
        downloadCurrentFormat: "普通下载 {format}",
        outputPanelHint: "如果浏览器不支持直接写入文件夹，仍然可以普通下载。",
        statusDimensionsLabel: "输出尺寸",
        statusModeLabel: "当前模式",
        summaryModeLabel: "当前模式",
        summaryLoadedLabel: "已选图片",
        summaryOutputLabel: "合成结果",
        statusDimensionsWaiting: "等待 {count} 张图片",
        statusDimensionsWaitingBase: "等待底图",
        summaryOutputWaiting: "等待 {count} 张图片<small>-</small>",
        summaryOutputWaitingBase: "等待底图<small>-</small>",
        summaryOutputScaled: " | 已自动适配 {max}",
        loadedSummaryWaiting: "等待上传",
        loadedSummaryDraggable: "可拖动调整顺序",
        loadedSummaryBaseReady: "底图已加载",
        loadedSummaryBaseWaiting: "等待底图",
        loadedSummaryExtensionWaiting: "等待补图",
        loadedSummaryExtensionReady: "可补 1 到 2 张图",
        loadedSummarySelectedNone: "未选格子",
        loadedSummarySelectedCount: "已选 {count} 格",
        statusMosaicStrokes: "{count} 笔",
        statusMosaicPending: "待涂抹",
        statusMosaicOff: "关闭",
        saveRememberedFolder: "已记住导出文件夹",
        savedToFolder: "已保存到 {folder}/{fileName}",
        downloadStarted: "{format} 下载已开始",
        toastNoUsableImages: "没有检测到可用图片",
        toastNeedBaseImage: "请先上传底图",
        toastImportedReplacePartial: "已按顺序导入前 {count} 张替换图，其余已忽略",
        toastImportedReplace: "已导入 {count} 张替换图",
        toastImportedExtendPartial: "已按顺序导入前 {count} 张补图，其余已忽略",
        toastImportedExtend: "已导入 {count} 张补图",
        toastImportedPartial: "已按顺序导入前 {count} 张图片，其余已忽略",
        toastImported: "已按顺序导入 {count} 张图片",
        toastClearedMosaic: "已清除马赛克",
        toastOnlyImages: "只能上传图片文件",
        toastReadReplaceFailed: "读取替换图片失败，请换一张再试",
        toastReadImageFailed: "读取图片失败，请换一张再试",
        toastBaseMustBeImage: "底图必须是图片文件",
        toastBaseLoaded: "底图已加载",
        toastReadBaseFailed: "读取底图失败，请换一张再试",
        toastChooseFolderUnsupported: "当前浏览器不支持直接选择文件夹",
        toastChooseFolderFailed: "选择文件夹失败",
        toastNoTargetFolder: "还没有目标文件夹",
        toastNoFolderPermission: "没有获得文件夹写入权限",
        toastNoSelectedCells: "当前没有选中的格子",
        toastClearedSelectedCells: "已清空选中格子",
        toastSwappedImages: "已交换图片 {from} 和 图片 {to}",
        toastMosaicEnabled: "已进入马赛克涂抹模式",
        toastMosaicDisabled: "已退出马赛克涂抹模式",
        toastNoMosaicToClear: "当前没有马赛克可清除",
        toastBatchImportFailed: "批量导入失败",
        toastSaveFailed: "保存失败",
        toastDownloadFailed: "下载失败",
        toastInitFailed: "初始化失败，请刷新页面后重试",
        loadImageFailed: "图片加载失败",
        exportBlobFailed: "导出失败，未生成文件内容"
    },
    en: {
        pageTitle: "Storyboard Image Stitcher",
        headerTitle: "Storyboard Image Stitcher",
        headerSubtitle: "storyboard",
        helpButtonLabel: "Show help",
        modePanelTitle: "Layout",
        modePanelHint: "Use 2-Frame, 4-Frame, and 6-Frame for direct storyboard layouts. Use Extend 4 to 6 to keep a finished 4-frame board on top and add a new bottom row. Use Replace Cells to swap one or more cells inside an existing 4-frame or 6-frame composite.",
        modeLabels: { two: "2-Frame", grid4: "4-Frame", grid6: "6-Frame", expand46: "Extend 4 to 6", replace: "Replace Cells" },
        modeSummary: { two: "2-Frame", grid4: "4-Frame", grid6: "6-Frame", expand46: "Extend 4 to 6", replace: "Replace Cells" },
        modeSecondary: { twoHorizontal: "Left + Right", twoVertical: "Top + Bottom", grid4: "2 x 2", grid6: "2 x 3", expand46: "Add Bottom Row", replace4: "4-Frame Base", replace6: "6-Frame Base" },
        modeEmptyTitle: { two: "Upload 2 images first", grid4: "Upload 4 images first", grid6: "Upload 6 images first", expand46: "Upload a 4-frame base image first", replace: "Upload a base image first" },
        modeEmptyCopy: {
            two: "The app will place the current mode into a storyboard and preview it here in real time.",
            grid4: "The 4-frame mode composites images into a fixed grid and previews the result here.",
            grid6: "The 6-frame mode composites images into a fixed grid and previews the result here.",
            expand46: "Upload a finished 4-frame base image, then add one or two new images to the bottom left and bottom right cells.",
            replace: "Upload a finished 4-frame or 6-frame base image, then replace the target cells with new images."
        },
        modeUploadHint: {
            two: "A preview is generated automatically after upload. You can also drag cards to change the order.",
            grid4: "A preview is generated automatically after upload. You can also drag cards to change the order.",
            grid6: "A preview is generated automatically after upload. You can also drag cards to change the order.",
            expand46: "Upload the finished 4-frame base first, then add the bottom left and bottom right images. You can also batch import one or two add-on images in order.",
            replace: "Upload a base image first, then assign replacement images to specific cells. You can also batch import after selecting cells."
        },
        baseImageLabels: { replace: "Base Image", expand46: "4-Frame Base" },
        uploadBaseImageLabels: { replace: "Upload Base Image", expand46: "Upload 4-Frame Base" },
        baseImageEmptyStates: { replace: "Upload a finished 4-frame or 6-frame base image first", expand46: "Upload a finished 4-frame base image first" },
        baseImageMetaEmptyStates: { replace: "No base image selected yet", expand46: "No 4-frame base image selected yet" },
        batchImportLabels: { default: "Batch Import in Order", replace: "Batch Import Replacement Images", expand46: "Batch Import Bottom Images" },
        replaceGridTypeTitle: "Base Layout",
        replaceGridTypeHint: "Choose whether the base image is a 4-frame or 6-frame layout. The replacement cells update with it.",
        replaceGridLabels: { grid4: "4-Frame", grid6: "6-Frame" },
        replaceGridLayoutLabel: { grid4: "Replace Cells / 4-Frame", grid6: "Replace Cells / 6-Frame" },
        replaceGridTags: {
            grid4: ["Top Left", "Top Right", "Bottom Left", "Bottom Right"],
            grid6: ["Top Left", "Top Right", "Mid Left", "Mid Right", "Bottom Left", "Bottom Right"]
        },
        importPanelTitle: "Import Images",
        imageLabel: "Image",
        replaceImageLabel: "Replacement",
        extendImageLabel: "Bottom Image",
        slotEmpty: "Click to upload",
        slotReplaceEmpty: "Click to upload replacement",
        slotExtendEmpty: "Click to upload bottom image",
        slotMetaEmpty: "Not selected",
        slotMetaReplaceEmpty: "This cell is not replaced yet",
        slotMetaExtendEmpty: "This bottom cell is empty",
        slotTags: {
            horizontal: ["Left", "Right"],
            vertical: ["Top", "Bottom"],
            grid4: ["Top Left", "Top Right", "Bottom Left", "Bottom Right"],
            grid6: ["Top Left", "Top Right", "Mid Left", "Mid Right", "Bottom Left", "Bottom Right"],
            expand46: ["Bottom Left", "Bottom Right"]
        },
        toolsPanelSummary: { two: "Direction", grid4: "Grid Notes", grid6: "Grid Notes", expand46: "Extension Notes", replace: "Target Cells" },
        toolsPanelHelp: {
            two: "Choose whether the two images should be arranged side by side or stacked top to bottom.",
            grid4: "The 4-frame layout stays fixed as 2 x 2, ordered left to right and top to bottom.",
            grid6: "The 6-frame layout stays fixed as 2 x 3, ordered left to right and top to bottom.",
            expand46: "The finished 4-frame base stays unchanged on top. Two new 16:9 cells are added below it, and the bottom images always cover those cells.",
            replace: "Select the cells you want to replace, then batch import in order. If nothing is selected, images fill all cells in order. Replacement images always cover the target cell and keep the divider lines unchanged."
        },
        orientationLabel: "Stitch Direction",
        orientationLabels: { horizontal: "Side by Side", vertical: "Top / Bottom" },
        clearSelectedCells: "Clear Selected Cells",
        replaceCellHintDefault: "Select the cells you want to replace, then batch import in order. If nothing is selected, images fill all cells in order. Replacement images always cover the target cell and keep the divider lines unchanged.",
        replaceCellHintSelected: "{count} cells selected: {names}. Batch import follows this order.",
        mosaicPanelSummary: "Mosaic",
        mosaicBrushLabel: "Mosaic Brush",
        mosaicToggle: "Mosaic Brush",
        clearMosaic: "Clear Mosaic",
        mosaicHint: "Click \"Mosaic Brush\" and drag directly on the preview. Switching mode, direction, or images clears old mosaic strokes automatically.",
        exportPanelTitle: "Export",
        fileNameLabel: "Output File Name",
        exportFormatLabel: "Export Format",
        exportFormatHint: "JPG is the default. If you choose Original and formats are mixed, it falls back to JPG.",
        exportFormatOriginalPng: "Original PNG",
        exportFormatOriginalJpg: "Original JPG",
        exportPathLabel: "Export Folder",
        exportPathHint: "Authorize a folder with the button on the right the first time. The longest output edge stays within 5400.",
        exportPathEmpty: "Not selected",
        selectExportFolderTitle: "Choose export folder",
        outputPanelTitle: "Output",
        saveToFolder: "Save to Export Folder",
        downloadCurrentFormat: "Download {format}",
        outputPanelHint: "If the browser cannot write directly to a folder, you can still use standard download.",
        statusDimensionsLabel: "Output Size",
        statusModeLabel: "Mode",
        summaryModeLabel: "Current Mode",
        summaryLoadedLabel: "Loaded Images",
        summaryOutputLabel: "Composite",
        statusDimensionsWaiting: "Waiting for {count} images",
        statusDimensionsWaitingBase: "Waiting for base image",
        summaryOutputWaiting: "Waiting for {count} images<small>-</small>",
        summaryOutputWaitingBase: "Waiting for base image<small>-</small>",
        summaryOutputScaled: " | Auto-fit to {max}",
        loadedSummaryWaiting: "Waiting for upload",
        loadedSummaryDraggable: "Drag to reorder",
        loadedSummaryBaseReady: "Base image loaded",
        loadedSummaryBaseWaiting: "Waiting for base image",
        loadedSummaryExtensionWaiting: "Waiting for bottom images",
        loadedSummaryExtensionReady: "Ready for 1 or 2 images",
        loadedSummarySelectedNone: "No cells selected",
        loadedSummarySelectedCount: "{count} selected",
        statusMosaicStrokes: "{count} strokes",
        statusMosaicPending: "Ready",
        statusMosaicOff: "Off",
        saveRememberedFolder: "Export folder remembered",
        savedToFolder: "Saved to {folder}/{fileName}",
        downloadStarted: "{format} download started",
        toastNoUsableImages: "No usable images were detected.",
        toastNeedBaseImage: "Upload a base image first.",
        toastImportedReplacePartial: "Imported the first {count} replacement images in order. The rest were ignored.",
        toastImportedReplace: "Imported {count} replacement images.",
        toastImportedExtendPartial: "Imported the first {count} bottom images in order. The rest were ignored.",
        toastImportedExtend: "Imported {count} bottom images.",
        toastImportedPartial: "Imported the first {count} images in order. The rest were ignored.",
        toastImported: "Imported {count} images in order.",
        toastClearedMosaic: "Mosaic strokes cleared.",
        toastOnlyImages: "Only image files are supported.",
        toastReadReplaceFailed: "Failed to read the replacement image. Try another one.",
        toastReadImageFailed: "Failed to read the image. Try another one.",
        toastBaseMustBeImage: "The base image must be an image file.",
        toastBaseLoaded: "Base image loaded.",
        toastReadBaseFailed: "Failed to read the base image. Try another one.",
        toastChooseFolderUnsupported: "This browser cannot choose folders directly.",
        toastChooseFolderFailed: "Failed to choose the folder.",
        toastNoTargetFolder: "No export folder selected yet.",
        toastNoFolderPermission: "Folder write permission was not granted.",
        toastNoSelectedCells: "No cells are selected right now.",
        toastClearedSelectedCells: "Selected cells cleared.",
        toastSwappedImages: "Swapped image {from} and image {to}.",
        toastMosaicEnabled: "Mosaic brush mode enabled.",
        toastMosaicDisabled: "Mosaic brush mode disabled.",
        toastNoMosaicToClear: "There is no mosaic to clear.",
        toastBatchImportFailed: "Batch import failed",
        toastSaveFailed: "Save failed",
        toastDownloadFailed: "Download failed",
        toastInitFailed: "Initialization failed. Refresh and try again.",
        loadImageFailed: "Image failed to load",
        exportBlobFailed: "Export failed because no file content was generated"
    }
};

let currentLanguage = "zh";

function copy() {
    return I18N[currentLanguage] || I18N.zh;
}

function t(key, params = {}) {
    const template = copy()[key] ?? I18N.zh[key] ?? key;
    return template.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? `{${name}}`);
}

function getModeLabel(mode) {
    return copy().modeLabels[mode];
}

function getModeSummaryLabel(mode) {
    return copy().modeSummary[mode];
}

function getReplaceGridTags(gridType = state.replaceGridType) {
    return copy().replaceGridTags[gridType];
}

function getSlotTags() {
    return copy().slotTags;
}

function getModeCopy(mode = state.mode) {
    return {
        label: getModeLabel(mode),
        requiredCount: MODE_CONFIG[mode].requiredCount,
        emptyTitle: copy().modeEmptyTitle[mode],
        emptyCopy: copy().modeEmptyCopy[mode],
        uploadHint: copy().modeUploadHint[mode]
    };
}

function getToolsPanelLabel(mode = state.mode) {
    return copy().toolsPanelSummary[mode];
}

function updateLanguageToggle() {
    UI.langZhButton.classList.toggle("active", currentLanguage === "zh");
    UI.langEnButton.classList.toggle("active", currentLanguage === "en");
}

function applyTranslations() {
    document.title = t("pageTitle");
    document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : "en";
    UI.headerTitle.childNodes[0].textContent = `${t("headerTitle")} `;
    UI.headerSubtitle.textContent = t("headerSubtitle");
    document.querySelectorAll(".help-trigger").forEach((button) => {
        button.setAttribute("aria-label", t("helpButtonLabel"));
        button.setAttribute("title", t("helpButtonLabel"));
    });
    UI.exportFormat.querySelector('option[value="original"]').textContent = currentLanguage === "zh" ? "原格式" : "Original";
    if (!state.exportDirectoryHandle) {
        UI.exportPath.value = t("exportPathEmpty");
    }
    updateLanguageToggle();
    updateModeUI();
    updateOrientationUI();
    refreshAllSlots();
    updateMosaicBrushUI();
    updateLoadedSummary();
    renderComposite();
}

function setLanguage(language) {
    if (!I18N[language]) return;
    currentLanguage = language;
    applyTranslations();
}

function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.getElementById("toast-container").appendChild(toast);

    window.setTimeout(() => {
        toast.remove();
    }, 2400);
}

function formatBytes(bytes) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let index = 0;
    while (size >= 1024 && index < units.length - 1) {
        size /= 1024;
        index += 1;
    }
    return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function isReplaceMode() {
    return state.mode === "replace";
}

function isExpandMode() {
    return state.mode === "expand46";
}

function isBaseImageMode() {
    return isReplaceMode() || isExpandMode();
}

function getReplaceGridConfig() {
    return REPLACE_GRID_CONFIG[state.replaceGridType];
}

function getActiveSlotIndexes() {
    if (isReplaceMode()) {
        return Array.from({ length: getReplaceGridConfig().count }, (_, index) => index);
    }
    if (isExpandMode()) return [0, 1];
    if (state.mode === "grid6") return [0, 1, 2, 3, 4, 5];
    if (state.mode === "grid4") return [0, 1, 2, 3];
    return [0, 1];
}

function getCurrentModeConfig() {
    return getModeCopy(state.mode);
}

function getSlotTag(index) {
    if (isReplaceMode()) {
        return getReplaceGridTags()[index] || "";
    }
    if (isExpandMode()) {
        return getSlotTags().expand46[index] || "";
    }
    const slotTags = getSlotTags();
    if (state.mode === "grid6") {
        return slotTags.grid6[index];
    }
    if (state.mode === "grid4") {
        return slotTags.grid4[index];
    }
    return slotTags[state.orientation][index] || "";
}

function getLayoutLabel() {
    if (isReplaceMode()) {
        return copy().replaceGridLayoutLabel[state.replaceGridType];
    }
    if (isExpandMode()) {
        return `${getModeLabel("expand46")} / ${copy().modeSecondary.expand46}`;
    }
    if (state.mode === "grid6") {
        return `${getModeLabel("grid6")} ${copy().modeSecondary.grid6}`;
    }
    if (state.mode === "grid4") {
        return `${getModeLabel("grid4")} ${copy().modeSecondary.grid4}`;
    }
    return state.orientation === "vertical" ? `${getModeLabel("two")} / ${copy().modeSecondary.twoVertical}` : `${getModeLabel("two")} / ${copy().modeSecondary.twoHorizontal}`;
}

function getModeSecondaryText() {
    if (isReplaceMode()) {
        return state.replaceGridType === "grid6" ? copy().modeSecondary.replace6 : copy().modeSecondary.replace4;
    }
    if (isExpandMode()) {
        return copy().modeSecondary.expand46;
    }
    if (state.mode === "grid6") {
        return copy().modeSecondary.grid6;
    }
    if (state.mode === "grid4") {
        return copy().modeSecondary.grid4;
    }
    return state.orientation === "vertical" ? copy().modeSecondary.twoVertical : copy().modeSecondary.twoHorizontal;
}

function getSourceExtension(fileName) {
    const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
    if (!match) return "";
    const extension = match[1];
    return extension === "jpeg" ? "jpg" : extension;
}

function getOriginalLikeExtension() {
    if (isReplaceMode()) {
        const files = [state.baseImage?.file]
            .concat(getActiveSlotIndexes().map((index) => state.overlayReplacements[index]?.file))
            .filter(Boolean);

        if (files.length === 0) {
            return "jpg";
        }

        const uniqueExtensions = new Set(files.map((file) => getSourceExtension(file.name)));
        if (uniqueExtensions.size !== 1) {
            return "jpg";
        }

        const [extension] = [...uniqueExtensions];
        return extension === "png" ? "png" : "jpg";
    }

    if (isExpandMode()) {
        const files = [state.baseImage?.file]
            .concat(state.extensionImages.map((item) => item?.file))
            .filter(Boolean);

        if (files.length === 0) {
            return "jpg";
        }

        const uniqueExtensions = new Set(files.map((file) => getSourceExtension(file.name)));
        if (uniqueExtensions.size !== 1) {
            return "jpg";
        }

        const [extension] = [...uniqueExtensions];
        return extension === "png" ? "png" : "jpg";
    }

    const activeFiles = getActiveSlotIndexes()
        .map((index) => state.images[index]?.file)
        .filter(Boolean);

    if (activeFiles.length !== getActiveSlotIndexes().length) {
        return "jpg";
    }

    const uniqueExtensions = new Set(activeFiles.map((file) => getSourceExtension(file.name)));
    if (uniqueExtensions.size !== 1) {
        return "jpg";
    }

    const [extension] = [...uniqueExtensions];
    if (extension === "png") return "png";
    if (extension === "jpg") return "jpg";
    return "jpg";
}

function getExportExtension() {
    if (state.exportFormat === "png") return "png";
    if (state.exportFormat === "original") return getOriginalLikeExtension();
    return "jpg";
}

function getExportMimeType() {
    return getExportExtension() === "png" ? "image/png" : "image/jpeg";
}

function getCompositeBackgroundColor(options = {}) {
    if (options.forceTransparent) {
        return null;
    }

    if (options.exporting && getExportExtension() !== "png") {
        return "#ffffff";
    }

    return null;
}

function getExportFormatLabel() {
    const extension = getExportExtension();
    if (state.exportFormat === "original") {
        return extension === "png" ? copy().exportFormatOriginalPng : copy().exportFormatOriginalJpg;
    }
    return extension.toUpperCase();
}

function sanitizeBaseName(value) {
    return value.trim().replace(/[\\/:*?"<>|]/g, "-");
}

function splitFileNameParts(fileName) {
    const lastDot = fileName.lastIndexOf(".");
    if (lastDot <= 0) {
        return { base: fileName, extension: "" };
    }
    return {
        base: fileName.slice(0, lastDot),
        extension: fileName.slice(lastDot)
    };
}

function applyExportExtension(fileName) {
    const sanitized = sanitizeBaseName(fileName);
    const { base } = splitFileNameParts(sanitized || "merged-output");
    return `${base || "merged-output"}.${getExportExtension()}`;
}

function createTimestampLabel() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return [
        now.getFullYear(),
        pad(now.getMonth() + 1),
        pad(now.getDate())
    ].join("") + "-" + [
        pad(now.getHours()),
        pad(now.getMinutes()),
        pad(now.getSeconds())
    ].join("");
}

function createDefaultFileName() {
    if (isReplaceMode()) {
        const baseName = state.baseImage?.file?.name?.replace(/\.[^.]+$/, "").replace(/\s+/g, "-") || "grid-replace";
        const timestamp = createTimestampLabel();
        return `${baseName}_replaced_${timestamp}.${getExportExtension()}`;
    }

    if (isExpandMode()) {
        const baseName = state.baseImage?.file?.name?.replace(/\.[^.]+$/, "").replace(/\s+/g, "-") || "four-up";
        const timestamp = createTimestampLabel();
        return `${baseName}_to_6up_${timestamp}.${getExportExtension()}`;
    }

    const activeNames = getActiveSlotIndexes()
        .map((index) => state.images[index]?.file?.name)
        .filter(Boolean)
        .map((name) => name.replace(/\.[^.]+$/, ""))
        .map((name) => name.replace(/\s+/g, "-"));
    const timestamp = createTimestampLabel();

    if (state.mode === "grid6") {
        const prefix = activeNames.length >= 2 ? `${activeNames[0]}_${activeNames[1]}` : "grid-output";
        return `${prefix}_6up_${timestamp}.${getExportExtension()}`;
    }

    if (state.mode === "grid4") {
        const prefix = activeNames.length >= 2 ? `${activeNames[0]}_${activeNames[1]}` : "grid-output";
        return `${prefix}_4up_${timestamp}.${getExportExtension()}`;
    }

    if (activeNames.length >= 2) {
        return `${activeNames[0]}_${activeNames[1]}_stitched_${timestamp}.${getExportExtension()}`;
    }

    return `merged-output_${timestamp}.${getExportExtension()}`;
}

function ensureFileName(force = false) {
    const currentValue = UI.fileNameInput.value.trim();
    if (!force && currentValue && currentValue !== state.lastAutoFileName) {
        return;
    }

    const nextValue = createDefaultFileName();
    UI.fileNameInput.value = nextValue;
    state.lastAutoFileName = nextValue;
}

function syncFileNameExtension() {
    const currentValue = UI.fileNameInput.value.trim();
    if (!currentValue) {
        ensureFileName(true);
        return;
    }

    const normalized = applyExportExtension(currentValue);
    UI.fileNameInput.value = normalized;
    if (currentValue === state.lastAutoFileName) {
        state.lastAutoFileName = normalized;
    }
}

async function resolveAvailableFileName(dirHandle, desiredFileName) {
    const { base, extension } = splitFileNameParts(desiredFileName);
    let candidate = desiredFileName;
    let counter = 2;

    while (true) {
        try {
            await dirHandle.getFileHandle(candidate);
            candidate = `${base}-${counter}${extension}`;
            counter += 1;
        } catch (error) {
            if (error.name === "NotFoundError") {
                return candidate;
            }
            throw error;
        }
    }
}

function updateBackgroundUI() {
    return;
}

function updateMosaicBrushUI() {
    if (!ENABLE_MOSAIC_FEATURE) {
        state.isMosaicBrushMode = false;
        state.isPaintingMosaic = false;
        state.mosaicBrushStrokes = [];
        UI.previewCanvas.classList.remove("brush-mode");
        UI.toggleMosaicButton.classList.remove("btn-primary");
        UI.toggleMosaicButton.classList.add("btn-secondary");
        return;
    }

    UI.mosaicBrushSize.value = String(state.mosaicBrushSize);
    UI.mosaicBrushSizeValue.textContent = `${state.mosaicBrushSize}px`;
    UI.toggleMosaicButton.classList.toggle("btn-primary", state.isMosaicBrushMode);
    UI.toggleMosaicButton.classList.toggle("btn-secondary", !state.isMosaicBrushMode);
    UI.previewCanvas.classList.toggle("brush-mode", state.isMosaicBrushMode);

    if (UI.statusMosaic) {
        if (state.mosaicBrushStrokes.length > 0) {
            UI.statusMosaic.textContent = t("statusMosaicStrokes", { count: state.mosaicBrushStrokes.length });
        } else if (state.isMosaicBrushMode) {
            UI.statusMosaic.textContent = t("statusMosaicPending");
        } else {
            UI.statusMosaic.textContent = t("statusMosaicOff");
        }
    }
}

function updateDownloadButtonLabel() {
    UI.downloadButton.textContent = t("downloadCurrentFormat", { format: getExportFormatLabel() });
}

function getBaseImageModeKey() {
    return isExpandMode() ? "expand46" : "replace";
}

function updateBaseImageUI() {
    const data = state.baseImage;
    const modeKey = getBaseImageModeKey();
    if (!data) {
        UI.baseImagePreview.innerHTML = `<div class="slot-empty">${copy().baseImageEmptyStates[modeKey]}</div>`;
        UI.baseImageMeta.textContent = copy().baseImageMetaEmptyStates[modeKey];
        return;
    }

    UI.baseImagePreview.innerHTML = "";
    const imageElement = document.createElement("img");
    imageElement.src = data.objectUrl;
    imageElement.alt = data.file.name;
    UI.baseImagePreview.appendChild(imageElement);
    UI.baseImageMeta.textContent = `${data.file.name} · ${data.image.naturalWidth} x ${data.image.naturalHeight}`;
}

function updateReplaceGridButtons() {
    UI.replaceGridButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.replaceGrid === state.replaceGridType);
    });
}

function updateReplaceCellButtons() {
    const config = getReplaceGridConfig();
    const tags = getReplaceGridTags();
    UI.replaceCellButtons.forEach((button, index) => {
        const isActiveCell = index < config.count;
        button.classList.toggle("hidden", !isActiveCell);
        if (!isActiveCell) {
            button.classList.remove("active");
            return;
        }
        button.textContent = tags[index];
        button.classList.toggle("active", state.selectedOverlayCells.includes(index));
    });

    let helpText = t("replaceCellHintDefault");
    if (state.selectedOverlayCells.length > 0) {
        const names = state.selectedOverlayCells.map((index) => tags[index]).join(currentLanguage === "zh" ? "、" : ", ");
        helpText = t("replaceCellHintSelected", { count: state.selectedOverlayCells.length, names });
    }
    UI.replaceCellHint.textContent = helpText;
    if (isReplaceMode() && UI.toolsPanelHelp) {
        UI.toolsPanelHelp.textContent = helpText;
    }
}

function updateModeUI() {
    const config = getCurrentModeConfig();
    const activeIndexes = new Set(getActiveSlotIndexes());
    const replaceMode = isReplaceMode();
    const expandMode = isExpandMode();
    const baseImageMode = isBaseImageMode();
    const baseModeKey = getBaseImageModeKey();

    UI.modeButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.mode === state.mode);
        button.textContent = getModeLabel(button.dataset.mode);
    });

    UI.replaceGridButtons.forEach((button) => {
        button.textContent = copy().replaceGridLabels[button.dataset.replaceGrid];
    });

    UI.orientationButtons.forEach((button) => {
        button.textContent = copy().orientationLabels[button.dataset.orientation];
    });

    UI.uploadSlots.forEach((slot, index) => {
        slot.root.classList.toggle("hidden", !activeIndexes.has(index));
        const slotLabel = replaceMode ? t("replaceImageLabel") : expandMode ? t("extendImageLabel") : t("imageLabel");
        slot.label.textContent = `${slotLabel} ${index + 1}`;
        slot.tag.textContent = getSlotTag(index);
    });

    UI.baseImageGroup.classList.toggle("hidden", !baseImageMode);
    UI.toolsPanel.classList.toggle("hidden", !(state.mode === "two" || replaceMode));
    UI.orientationGroup.style.display = state.mode === "two" ? "block" : "none";
    UI.replaceGridTypePanel.classList.toggle("hidden", !replaceMode);
    UI.replaceCellGroup.classList.toggle("hidden", !replaceMode);
    UI.mosaicSection.classList.toggle("hidden", !ENABLE_MOSAIC_FEATURE);
    UI.batchImportButton.textContent = replaceMode ? copy().batchImportLabels.replace : expandMode ? copy().batchImportLabels.expand46 : copy().batchImportLabels.default;
    UI.baseImageLabel.textContent = copy().baseImageLabels[baseModeKey];
    UI.baseImageButton.textContent = copy().uploadBaseImageLabels[baseModeKey];
    UI.modePanelTitle.textContent = t("modePanelTitle");
    UI.modePanelHint.textContent = t("modePanelHint");
    UI.replaceGridTypeTitle.textContent = t("replaceGridTypeTitle");
    UI.replaceGridTypeHint.textContent = t("replaceGridTypeHint");
    UI.importPanelTitle.textContent = t("importPanelTitle");
    UI.toolsPanelSummary.textContent = getToolsPanelLabel();
    UI.toolsPanelHelp.textContent = copy().toolsPanelHelp[state.mode];
    UI.orientationLabel.textContent = t("orientationLabel");
    UI.mosaicPanelSummary.textContent = t("mosaicPanelSummary");
    UI.mosaicBrushLabel.textContent = t("mosaicBrushLabel");
    UI.toggleMosaicButton.textContent = t("mosaicToggle");
    UI.clearMosaicButton.textContent = t("clearMosaic");
    UI.mosaicHint.textContent = t("mosaicHint");
    UI.exportPanelTitle.textContent = t("exportPanelTitle");
    UI.fileNameLabel.textContent = t("fileNameLabel");
    UI.exportFormatLabel.textContent = t("exportFormatLabel");
    UI.exportFormatHint.textContent = t("exportFormatHint");
    UI.exportPathLabel.textContent = t("exportPathLabel");
    UI.exportPathHint.textContent = t("exportPathHint");
    UI.pickFolderButton.title = t("selectExportFolderTitle");
    UI.pickFolderButton.setAttribute("aria-label", t("selectExportFolderTitle"));
    UI.outputPanelTitle.textContent = t("outputPanelTitle");
    UI.saveFolderButton.textContent = t("saveToFolder");
    UI.outputPanelHint.textContent = t("outputPanelHint");
    UI.statusDimensionsLabel.textContent = t("statusDimensionsLabel");
    UI.statusModeLabel.textContent = t("statusModeLabel");
    UI.summaryModeLabel.textContent = t("summaryModeLabel");
    UI.summaryLoadedLabel.textContent = t("summaryLoadedLabel");
    UI.summaryOutputLabel.textContent = t("summaryOutputLabel");

    UI.uploadHint.textContent = config.uploadHint;
    UI.emptyTitle.textContent = config.emptyTitle;
    UI.emptyCopy.textContent = config.emptyCopy;
    UI.statusMode.textContent = getLayoutLabel();
    UI.summaryMode.innerHTML = `${getModeSummaryLabel(state.mode)}<small>${getModeSecondaryText()}</small>`;
    updateReplaceGridButtons();
    updateReplaceCellButtons();
    updateBaseImageUI();
    updateDownloadButtonLabel();
}

function updateOrientationUI() {
    UI.orientationButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.orientation === state.orientation);
        button.textContent = copy().orientationLabels[button.dataset.orientation];
    });
    UI.uploadSlots.forEach((slot, index) => {
        slot.tag.textContent = getSlotTag(index);
    });
    UI.statusMode.textContent = getLayoutLabel();
    UI.summaryMode.innerHTML = `${getModeSummaryLabel(state.mode)}<small>${getModeSecondaryText()}</small>`;
    UI.toolsPanelSummary.textContent = getToolsPanelLabel();
    UI.toolsPanelHelp.textContent = copy().toolsPanelHelp[state.mode];
}

function updateSlot(index) {
    const slotUi = UI.uploadSlots[index];
    const data = isReplaceMode() ? state.overlayReplacements[index] : isExpandMode() ? state.extensionImages[index] : state.images[index];
    const slotTag = getSlotTag(index);
    const isReplaceSlot = isReplaceMode();
    const isExpandSlot = isExpandMode();

    slotUi.label.textContent = `${isReplaceSlot ? t("replaceImageLabel") : isExpandSlot ? t("extendImageLabel") : t("imageLabel")} ${index + 1}`;
    slotUi.tag.textContent = slotTag;

    if (!data) {
        slotUi.root.classList.remove("ready");
        slotUi.root.draggable = !isReplaceSlot && !isExpandSlot;
        slotUi.preview.innerHTML = `<div class="slot-empty">${isReplaceSlot ? t("slotReplaceEmpty") : isExpandSlot ? t("slotExtendEmpty") : t("slotEmpty")}</div>`;
        slotUi.meta.textContent = isReplaceSlot ? t("slotMetaReplaceEmpty") : isExpandSlot ? t("slotMetaExtendEmpty") : t("slotMetaEmpty");
        return;
    }

    slotUi.root.classList.add("ready");
    slotUi.root.draggable = !isReplaceSlot && !isExpandSlot;
    slotUi.preview.innerHTML = "";

    const imageElement = document.createElement("img");
    imageElement.src = data.objectUrl;
    imageElement.alt = data.file.name;
    slotUi.preview.appendChild(imageElement);

    slotUi.meta.textContent = data.file.name;
}

function updateLoadedSummary() {
    if (isReplaceMode()) {
        const activeIndexes = getActiveSlotIndexes();
        const replacedCount = activeIndexes.filter((index) => state.overlayReplacements[index]).length;
        const baseStatus = state.baseImage ? t("loadedSummaryBaseReady") : t("loadedSummaryBaseWaiting");
        const selectedStatus = state.selectedOverlayCells.length > 0
            ? t("loadedSummarySelectedCount", { count: state.selectedOverlayCells.length })
            : t("loadedSummarySelectedNone");
        UI.summaryLoaded.innerHTML = `${replacedCount} / ${activeIndexes.length} <small>${baseStatus} | ${selectedStatus}</small>`;
        return;
    }

    if (isExpandMode()) {
        const loadedCount = state.extensionImages.filter(Boolean).length;
        const baseStatus = state.baseImage ? t("loadedSummaryBaseReady") : t("loadedSummaryBaseWaiting");
        const extensionStatus = loadedCount > 0 ? t("loadedSummaryExtensionReady") : t("loadedSummaryExtensionWaiting");
        UI.summaryLoaded.innerHTML = `${loadedCount} / 2 <small>${baseStatus} | ${extensionStatus}</small>`;
        return;
    }

    const activeIndexes = getActiveSlotIndexes();
    const loaded = activeIndexes
        .map((index) => ({ index, data: state.images[index] }))
        .filter((item) => item.data);
    const details = loaded.length > 0 ? t("loadedSummaryDraggable") : t("loadedSummaryWaiting");
    UI.summaryLoaded.innerHTML = `${loaded.length} / ${activeIndexes.length} <small>${details}</small>`;
}

function refreshAllSlots() {
    UI.uploadSlots.forEach((_, index) => updateSlot(index));
    updateBaseImageUI();
    updateReplaceCellButtons();
    updateLoadedSummary();
}

function revokeImageAtIndex(index) {
    const current = state.images[index];
    if (current?.objectUrl) {
        URL.revokeObjectURL(current.objectUrl);
    }
}

function revokeOverlayReplacementAtIndex(index) {
    const current = state.overlayReplacements[index];
    if (current?.objectUrl) {
        URL.revokeObjectURL(current.objectUrl);
    }
}

function revokeExtensionImageAtIndex(index) {
    const current = state.extensionImages[index];
    if (current?.objectUrl) {
        URL.revokeObjectURL(current.objectUrl);
    }
}

function revokeBaseImage() {
    if (state.baseImage?.objectUrl) {
        URL.revokeObjectURL(state.baseImage.objectUrl);
    }
}

function clearImagesForIndexes(indexes) {
    indexes.forEach((index) => {
        revokeImageAtIndex(index);
        state.images[index] = null;
    });
}

function clearOverlayReplacementsForIndexes(indexes) {
    indexes.forEach((index) => {
        revokeOverlayReplacementAtIndex(index);
        state.overlayReplacements[index] = null;
    });
}

function clearExtensionImagesForIndexes(indexes) {
    indexes.forEach((index) => {
        revokeExtensionImageAtIndex(index);
        state.extensionImages[index] = null;
    });
}

function setSelectedOverlayCells(indexes) {
    const allowed = new Set(getActiveSlotIndexes());
    const uniqueIndexes = [];
    indexes.forEach((index) => {
        if (allowed.has(index) && !uniqueIndexes.includes(index)) {
            uniqueIndexes.push(index);
        }
    });
    state.selectedOverlayCells = uniqueIndexes;
    updateReplaceCellButtons();
    updateLoadedSummary();
}

function toggleOverlayCellSelection(index) {
    if (!getActiveSlotIndexes().includes(index)) return;
    if (state.selectedOverlayCells.includes(index)) {
        setSelectedOverlayCells(state.selectedOverlayCells.filter((item) => item !== index));
        return;
    }
    setSelectedOverlayCells([...state.selectedOverlayCells, index]);
}

function clearDragState() {
    state.draggedSlotIndex = null;
    UI.uploadSlots.forEach((slot) => {
        slot.root.classList.remove("dragging", "drag-target");
    });
}

function swapImages(firstIndex, secondIndex) {
    if (firstIndex === secondIndex) return false;
    const activeIndexes = new Set(getActiveSlotIndexes());
    if (!activeIndexes.has(firstIndex) || !activeIndexes.has(secondIndex)) {
        return false;
    }

    [state.images[firstIndex], state.images[secondIndex]] = [state.images[secondIndex], state.images[firstIndex]];
    refreshAllSlots();
    ensureFileName(true);
    renderComposite();
    return true;
}

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);
        image.onload = () => resolve({ image, objectUrl });
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error(t("loadImageFailed")));
        };
        image.src = objectUrl;
    });
}

async function assignFilesToActiveSlots(files) {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
        showToast(t("toastNoUsableImages"), "error");
        return;
    }

    if (isReplaceMode()) {
        if (!state.baseImage) {
            showToast(t("toastNeedBaseImage"), "error");
            return;
        }

        const activeIndexes = state.selectedOverlayCells.length > 0 ? [...state.selectedOverlayCells] : getActiveSlotIndexes();
        const selectedFiles = imageFiles.slice(0, activeIndexes.length);
        const loadedItems = [];

        try {
            for (const file of selectedFiles) {
                const loaded = await loadImageFromFile(file);
                loadedItems.push({ file, image: loaded.image, objectUrl: loaded.objectUrl });
            }
        } catch (error) {
            loadedItems.forEach((item) => URL.revokeObjectURL(item.objectUrl));
            throw error;
        }

        activeIndexes.forEach((index, slotPosition) => {
            const nextItem = loadedItems[slotPosition];
            if (!nextItem) return;
            revokeOverlayReplacementAtIndex(index);
            state.overlayReplacements[index] = nextItem;
        });

        clearMosaicStrokes({ silent: true });
        state.isMosaicBrushMode = false;
        refreshAllSlots();
        ensureFileName(true);
        updateDownloadButtonLabel();
        renderComposite();

        if (imageFiles.length > activeIndexes.length) {
            showToast(t("toastImportedReplacePartial", { count: activeIndexes.length }), "success");
        } else {
            showToast(t("toastImportedReplace", { count: selectedFiles.length }), "success");
        }
        return;
    }

    if (isExpandMode()) {
        if (!state.baseImage) {
            showToast(t("toastNeedBaseImage"), "error");
            return;
        }

        const activeIndexes = getActiveSlotIndexes();
        const selectedFiles = imageFiles.slice(0, activeIndexes.length);
        clearExtensionImagesForIndexes(activeIndexes);

        const loadedItems = [];
        try {
            for (const file of selectedFiles) {
                const loaded = await loadImageFromFile(file);
                loadedItems.push({ file, image: loaded.image, objectUrl: loaded.objectUrl });
            }
        } catch (error) {
            loadedItems.forEach((item) => URL.revokeObjectURL(item.objectUrl));
            throw error;
        }

        activeIndexes.forEach((index, slotPosition) => {
            state.extensionImages[index] = loadedItems[slotPosition] || null;
        });

        clearMosaicStrokes({ silent: true });
        state.isMosaicBrushMode = false;
        refreshAllSlots();
        ensureFileName(true);
        updateDownloadButtonLabel();
        renderComposite();

        if (imageFiles.length > activeIndexes.length) {
            showToast(t("toastImportedExtendPartial", { count: activeIndexes.length }), "success");
        } else {
            showToast(t("toastImportedExtend", { count: selectedFiles.length }), "success");
        }
        return;
    }

    const activeIndexes = getActiveSlotIndexes();

    const selectedFiles = imageFiles.slice(0, activeIndexes.length);
    clearImagesForIndexes(activeIndexes);

    const loadedItems = [];
    try {
        for (const file of selectedFiles) {
            const loaded = await loadImageFromFile(file);
            loadedItems.push({ file, image: loaded.image, objectUrl: loaded.objectUrl });
        }
    } catch (error) {
        loadedItems.forEach((item) => URL.revokeObjectURL(item.objectUrl));
        throw error;
    }

    activeIndexes.forEach((index, slotPosition) => {
        state.images[index] = loadedItems[slotPosition] || null;
    });

    clearMosaicStrokes({ silent: true });
    state.isMosaicBrushMode = false;
    refreshAllSlots();
    ensureFileName(true);
    updateDownloadButtonLabel();
    renderComposite();

    if (imageFiles.length > activeIndexes.length) {
        showToast(t("toastImportedPartial", { count: activeIndexes.length }), "success");
    } else {
        showToast(t("toastImported", { count: selectedFiles.length }), "success");
    }
}

function clearMosaicStrokes(options = {}) {
    const { silent = false } = options;
    const hadStrokes = state.mosaicBrushStrokes.length > 0;
    state.mosaicBrushStrokes = [];
    state.isPaintingMosaic = false;
    updateMosaicBrushUI();

    if (!silent && hadStrokes) {
        showToast(t("toastClearedMosaic"), "success");
    }
}

async function handleFileChange(index, file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        showToast(t("toastOnlyImages"), "error");
        return;
    }

    if (isReplaceMode()) {
        const previous = state.overlayReplacements[index];
        try {
            const loaded = await loadImageFromFile(file);
            if (previous?.objectUrl) {
                URL.revokeObjectURL(previous.objectUrl);
            }
            state.overlayReplacements[index] = { file, image: loaded.image, objectUrl: loaded.objectUrl };
            clearMosaicStrokes({ silent: true });
            state.isMosaicBrushMode = false;
            updateSlot(index);
            updateLoadedSummary();
            ensureFileName(true);
            updateDownloadButtonLabel();
            renderComposite();
        } catch (error) {
            console.error(error);
            showToast(t("toastReadReplaceFailed"), "error");
        }
        return;
    }

    if (isExpandMode()) {
        const previous = state.extensionImages[index];
        try {
            const loaded = await loadImageFromFile(file);
            if (previous?.objectUrl) {
                URL.revokeObjectURL(previous.objectUrl);
            }
            state.extensionImages[index] = { file, image: loaded.image, objectUrl: loaded.objectUrl };
            clearMosaicStrokes({ silent: true });
            state.isMosaicBrushMode = false;
            updateSlot(index);
            updateLoadedSummary();
            ensureFileName(true);
            updateDownloadButtonLabel();
            renderComposite();
        } catch (error) {
            console.error(error);
            showToast(t("toastReadImageFailed"), "error");
        }
        return;
    }

    const previous = state.images[index];
    try {
        const loaded = await loadImageFromFile(file);
        if (previous?.objectUrl) {
            URL.revokeObjectURL(previous.objectUrl);
        }
        state.images[index] = { file, image: loaded.image, objectUrl: loaded.objectUrl };
        clearMosaicStrokes({ silent: true });
        state.isMosaicBrushMode = false;
        updateSlot(index);
        updateLoadedSummary();
        ensureFileName(true);
        updateDownloadButtonLabel();
        renderComposite();
    } catch (error) {
        console.error(error);
        showToast(t("toastReadImageFailed"), "error");
    }
}

async function handleBaseImageChange(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        showToast(t("toastBaseMustBeImage"), "error");
        return;
    }

    try {
        const loaded = await loadImageFromFile(file);
        revokeBaseImage();
        state.baseImage = { file, image: loaded.image, objectUrl: loaded.objectUrl };
        clearOverlayReplacementsForIndexes([0, 1, 2, 3, 4, 5]);
        clearExtensionImagesForIndexes([0, 1]);
        setSelectedOverlayCells([]);
        clearMosaicStrokes({ silent: true });
        state.isMosaicBrushMode = false;
        refreshAllSlots();
        ensureFileName(true);
        updateDownloadButtonLabel();
        renderComposite();
        showToast(t("toastBaseLoaded"), "success");
    } catch (error) {
        console.error(error);
        showToast(t("toastReadBaseFailed"), "error");
    }
}

function fitImageIntoBox(imageWidth, imageHeight, boxWidth, boxHeight) {
    const scale = Math.min(boxWidth / imageWidth, boxHeight / imageHeight);
    const width = imageWidth * scale;
    const height = imageHeight * scale;

    return {
        width,
        height,
        offsetX: (boxWidth - width) / 2,
        offsetY: (boxHeight - height) / 2
    };
}

function getStoryboardCellSize(columns, rows) {
    const maxCellWidthByWidth = Math.floor(MAX_OUTPUT_EDGE / columns);
    const maxCellWidthByHeight = Math.floor((MAX_OUTPUT_EDGE * STORYBOARD_ASPECT.width) / (rows * STORYBOARD_ASPECT.height));
    const maxCellWidth = Math.min(maxCellWidthByWidth, maxCellWidthByHeight);
    const snappedCellWidth = Math.max(STORYBOARD_ASPECT.width, Math.floor(maxCellWidth / STORYBOARD_ASPECT.width) * STORYBOARD_ASPECT.width);
    return {
        width: snappedCellWidth,
        height: Math.round(snappedCellWidth * STORYBOARD_ASPECT.height / STORYBOARD_ASPECT.width)
    };
}

function buildStoryboardLayout(images, columns, rows, description) {
    const cellSize = getStoryboardCellSize(columns, rows);
    const cellWidth = cellSize.width;
    const cellHeight = cellSize.height;
    const rawWidth = cellWidth * columns;
    const rawHeight = cellHeight * rows;

    return {
        rawWidth,
        rawHeight,
        description,
        placements: images.map((item, index) => {
            const column = index % columns;
            const row = Math.floor(index / columns);
            const fitted = fitImageIntoBox(
                item.image.naturalWidth,
                item.image.naturalHeight,
                cellWidth,
                cellHeight
            );

            return {
                image: item.image,
                x: column * cellWidth + fitted.offsetX,
                y: row * cellHeight + fitted.offsetY,
                width: fitted.width,
                height: fitted.height
            };
        }),
        dividers: [
            ...Array.from({ length: rows - 1 }, (_, rowIndex) => ({
                x1: 0,
                y1: cellHeight * (rowIndex + 1),
                x2: rawWidth,
                y2: cellHeight * (rowIndex + 1)
            })),
            ...Array.from({ length: columns - 1 }, (_, columnIndex) => ({
                x1: cellWidth * (columnIndex + 1),
                y1: 0,
                x2: cellWidth * (columnIndex + 1),
                y2: rawHeight
            }))
        ]
    };
}

function fitImageToCoverBox(imageWidth, imageHeight, boxWidth, boxHeight) {
    const scale = Math.max(boxWidth / imageWidth, boxHeight / imageHeight);
    const width = imageWidth * scale;
    const height = imageHeight * scale;

    return {
        width,
        height,
        offsetX: (boxWidth - width) / 2,
        offsetY: (boxHeight - height) / 2
    };
}

function buildReplaceLayout() {
    if (!state.baseImage) {
        return null;
    }

    const config = getReplaceGridConfig();
    const tags = getReplaceGridTags();
    const rawWidth = state.baseImage.image.naturalWidth;
    const rawHeight = state.baseImage.image.naturalHeight;
    const cellWidth = rawWidth / config.columns;
    const cellHeight = rawHeight / config.rows;
    const dividers = [
        ...Array.from({ length: config.rows - 1 }, (_, rowIndex) => ({
            x1: 0,
            y1: cellHeight * (rowIndex + 1),
            x2: rawWidth,
            y2: cellHeight * (rowIndex + 1)
        })),
        ...Array.from({ length: config.columns - 1 }, (_, columnIndex) => ({
            x1: cellWidth * (columnIndex + 1),
            y1: 0,
            x2: cellWidth * (columnIndex + 1),
            y2: rawHeight
        }))
    ];

    const cells = Array.from({ length: config.count }, (_, index) => {
        const column = index % config.columns;
        const row = Math.floor(index / config.columns);
        return {
            index,
            label: tags[index],
            x: column * cellWidth,
            y: row * cellHeight,
            width: cellWidth,
            height: cellHeight,
            replacement: state.overlayReplacements[index]
        };
    });

    return {
        type: "replace",
        rawWidth,
        rawHeight,
        description: config.label,
        baseImage: state.baseImage.image,
        dividers,
        cells
    };
}

function buildExpand46Layout() {
    if (!state.baseImage) {
        return null;
    }

    const rawWidth = state.baseImage.image.naturalWidth;
    const topHeight = state.baseImage.image.naturalHeight;
    const cellWidth = rawWidth / 2;
    const cellHeight = topHeight / 2;
    const rawHeight = topHeight + cellHeight;

    return {
        type: "expand46",
        rawWidth,
        rawHeight,
        description: `${getModeLabel("expand46")} / ${copy().modeSecondary.expand46}`,
        baseImage: state.baseImage.image,
        additions: [0, 1].map((index) => ({
            index,
            x: index * cellWidth,
            y: topHeight,
            width: cellWidth,
            height: cellHeight,
            image: state.extensionImages[index]?.image || null
        })),
        dividers: [
            {
                x1: 0,
                y1: topHeight,
                x2: rawWidth,
                y2: topHeight
            },
            {
                x1: cellWidth,
                y1: topHeight,
                x2: cellWidth,
                y2: rawHeight
            }
        ]
    };
}

function getCompositeLayout() {
    if (isReplaceMode()) {
        return buildReplaceLayout();
    }

    if (isExpandMode()) {
        return buildExpand46Layout();
    }

    const activeIndexes = getActiveSlotIndexes();
    const activeImages = activeIndexes.map((index) => state.images[index]);

    if (activeImages.some((item) => !item)) {
        return null;
    }

    if (state.mode === "grid6") {
        return buildStoryboardLayout(activeImages, 2, 3, `${getModeLabel("grid6")} ${copy().modeSecondary.grid6}`);
    }

    if (state.mode === "grid4") {
        return buildStoryboardLayout(activeImages, 2, 2, `${getModeLabel("grid4")} ${copy().modeSecondary.grid4}`);
    }

    if (state.orientation === "vertical") {
        return buildStoryboardLayout(activeImages, 1, 2, `${getModeLabel("two")} / ${copy().modeSecondary.twoVertical}`);
    }

    return buildStoryboardLayout(activeImages, 2, 1, `${getModeLabel("two")} / ${copy().modeSecondary.twoHorizontal}`);
}

function getCompositeSize(layout) {
    if (!layout) return null;

    const longestEdge = Math.max(layout.rawWidth, layout.rawHeight);
    const scale = longestEdge > MAX_OUTPUT_EDGE ? MAX_OUTPUT_EDGE / longestEdge : 1;
    return {
        rawWidth: layout.rawWidth,
        rawHeight: layout.rawHeight,
        scale,
        isScaled: scale < 1,
        width: Math.max(1, Math.round(layout.rawWidth * scale)),
        height: Math.max(1, Math.round(layout.rawHeight * scale))
    };
}

function drawStrokePath(context, stroke, width, height) {
    const points = stroke.points || [];
    if (points.length === 0) return;

    const brushSizePx = (stroke.brushSizePercent / 100) * width;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#fff";
    context.fillStyle = "#fff";
    context.lineWidth = Math.max(8, brushSizePx);

    if (points.length === 1) {
        const point = points[0];
        context.beginPath();
        context.arc(point.x * width, point.y * height, context.lineWidth / 2, 0, Math.PI * 2);
        context.fill();
        return;
    }

    context.beginPath();
    context.moveTo(points[0].x * width, points[0].y * height);
    points.slice(1).forEach((point) => {
        context.lineTo(point.x * width, point.y * height);
    });
    context.stroke();
}

function applyBrushMosaicToCanvas(context, sourceCanvas, strokes, blockSize) {
    if (!ENABLE_MOSAIC_FEATURE || !strokes.length) return;

    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    const sampleWidth = Math.max(1, Math.round(width / blockSize));
    const sampleHeight = Math.max(1, Math.round(height / blockSize));

    const pixelCanvas = document.createElement("canvas");
    pixelCanvas.width = width;
    pixelCanvas.height = height;
    const pixelContext = pixelCanvas.getContext("2d");

    const smallCanvas = document.createElement("canvas");
    smallCanvas.width = sampleWidth;
    smallCanvas.height = sampleHeight;
    const smallContext = smallCanvas.getContext("2d");
    smallContext.imageSmoothingEnabled = true;
    smallContext.drawImage(sourceCanvas, 0, 0, sampleWidth, sampleHeight);

    pixelContext.imageSmoothingEnabled = false;
    pixelContext.drawImage(smallCanvas, 0, 0, sampleWidth, sampleHeight, 0, 0, width, height);

    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskContext = maskCanvas.getContext("2d");
    strokes.forEach((stroke) => {
        drawStrokePath(maskContext, stroke, width, height);
    });

    pixelContext.globalCompositeOperation = "destination-in";
    pixelContext.drawImage(maskCanvas, 0, 0);
    pixelContext.globalCompositeOperation = "source-over";
    context.drawImage(pixelCanvas, 0, 0);
}

function drawDividers(context, dividers, scale) {
    if (!dividers || dividers.length === 0) return;

    context.save();
    context.strokeStyle = DIVIDER_COLOR;
    context.lineWidth = 4;

    dividers.forEach((divider) => {
        context.beginPath();
        context.moveTo(divider.x1 * scale + 0.5, divider.y1 * scale + 0.5);
        context.lineTo(divider.x2 * scale + 0.5, divider.y2 * scale + 0.5);
        context.stroke();
    });

    context.restore();
}

function drawReplaceSelectionOverlay(context, layout, scale) {
    layout.cells.forEach((cell) => {
        const x = cell.x * scale;
        const y = cell.y * scale;
        const width = cell.width * scale;
        const height = cell.height * scale;
        const isSelected = state.selectedOverlayCells.includes(cell.index);

        context.save();
        if (isSelected) {
            context.fillStyle = "rgba(110, 135, 245, 0.18)";
            context.fillRect(x, y, width, height);
        }
        context.strokeStyle = isSelected ? "rgba(110, 135, 245, 0.95)" : "rgba(255, 255, 255, 0.22)";
        context.lineWidth = isSelected ? 3 : 1.5;
        context.strokeRect(x + 0.5, y + 0.5, Math.max(0, width - 1), Math.max(0, height - 1));
        context.restore();
    });
}

function drawComposite(canvas, options = {}) {
    const layout = getCompositeLayout();
    const size = getCompositeSize(layout);
    if (!layout || !size) return null;

    const context = canvas.getContext("2d");
    canvas.width = size.width;
    canvas.height = size.height;
    const backgroundColor = getCompositeBackgroundColor(options);
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundColor) {
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (layout.type === "replace") {
        context.drawImage(layout.baseImage, 0, 0, canvas.width, canvas.height);

        layout.cells.forEach((cell) => {
            if (!cell.replacement) return;
            const fitted = fitImageToCoverBox(
                cell.replacement.image.naturalWidth,
                cell.replacement.image.naturalHeight,
                cell.width,
                cell.height
            );

            context.save();
            context.beginPath();
            context.rect(cell.x * size.scale, cell.y * size.scale, cell.width * size.scale, cell.height * size.scale);
            context.clip();
            context.drawImage(
                cell.replacement.image,
                (cell.x + fitted.offsetX) * size.scale,
                (cell.y + fitted.offsetY) * size.scale,
                fitted.width * size.scale,
                fitted.height * size.scale
            );
            context.restore();
        });

        drawDividers(context, layout.dividers, size.scale);
        if (!options.skipSelectionOverlay) {
            drawReplaceSelectionOverlay(context, layout, size.scale);
        }
    } else if (layout.type === "expand46") {
        context.drawImage(layout.baseImage, 0, 0, layout.rawWidth * size.scale, layout.baseImage.naturalHeight * size.scale);

        layout.additions.forEach((addition) => {
            if (!addition.image) return;
            const fitted = fitImageToCoverBox(
                addition.image.naturalWidth,
                addition.image.naturalHeight,
                addition.width,
                addition.height
            );

            context.save();
            context.beginPath();
            context.rect(addition.x * size.scale, addition.y * size.scale, addition.width * size.scale, addition.height * size.scale);
            context.clip();
            context.drawImage(
                addition.image,
                (addition.x + fitted.offsetX) * size.scale,
                (addition.y + fitted.offsetY) * size.scale,
                fitted.width * size.scale,
                fitted.height * size.scale
            );
            context.restore();
        });

        drawDividers(context, layout.dividers, size.scale);
    } else {
        layout.placements.forEach((placement) => {
            context.drawImage(
                placement.image,
                placement.x * size.scale,
                placement.y * size.scale,
                placement.width * size.scale,
                placement.height * size.scale
            );
        });

        drawDividers(context, layout.dividers, size.scale);
    }

    if (ENABLE_MOSAIC_FEATURE && state.mosaicBrushStrokes.length > 0) {
        const sourceCanvas = document.createElement("canvas");
        sourceCanvas.width = canvas.width;
        sourceCanvas.height = canvas.height;
        const sourceContext = sourceCanvas.getContext("2d");
        sourceContext.drawImage(canvas, 0, 0);
        applyBrushMosaicToCanvas(
            context,
            sourceCanvas,
            state.mosaicBrushStrokes,
            options.blockSize || PREVIEW_MOSAIC_BLOCK_SIZE
        );
    }

    return {
        ...size,
        description: layout.description
    };
}

function renderComposite() {
    const size = drawComposite(UI.previewCanvas, { blockSize: PREVIEW_MOSAIC_BLOCK_SIZE });
    const config = getCurrentModeConfig();

    if (!size) {
        UI.previewCanvas.style.display = "none";
        UI.emptyState.style.display = "block";
        UI.canvasShell.classList.add("is-empty");
        UI.previewCanvas.classList.remove("cell-select-mode");
        UI.statusDimensions.textContent = isBaseImageMode()
            ? t("statusDimensionsWaitingBase")
            : t("statusDimensionsWaiting", { count: config.requiredCount });
        UI.summaryOutput.innerHTML = isBaseImageMode()
            ? t("summaryOutputWaitingBase")
            : t("summaryOutputWaiting", { count: config.requiredCount });
        updateLoadedSummary();
        updateMosaicBrushUI();
        return;
    }

    UI.previewCanvas.style.display = "block";
    UI.emptyState.style.display = "none";
    UI.canvasShell.classList.remove("is-empty");
    UI.previewCanvas.classList.toggle("cell-select-mode", isReplaceMode() && !state.isMosaicBrushMode);
    UI.statusDimensions.textContent = `${size.width} x ${size.height}`;
    UI.summaryOutput.innerHTML = `${size.width} x ${size.height} <small>${size.description}${size.isScaled ? t("summaryOutputScaled", { max: MAX_OUTPUT_EDGE }) : ""}</small>`;
    updateLoadedSummary();
    updateMosaicBrushUI();
}

function createMosaicStrokeAtEvent(event) {
    const rect = UI.previewCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    return {
        brushSizePercent: (state.mosaicBrushSize / rect.width) * 100,
        points: [{
            x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
            y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
        }]
    };
}

function appendPointToCurrentMosaicStroke(event) {
    const activeStroke = state.mosaicBrushStrokes[state.mosaicBrushStrokes.length - 1];
    if (!activeStroke) return;

    const rect = UI.previewCanvas.getBoundingClientRect();
    const nextPoint = {
        x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
    };
    const lastPoint = activeStroke.points[activeStroke.points.length - 1];

    if (!lastPoint || Math.hypot(nextPoint.x - lastPoint.x, nextPoint.y - lastPoint.y) > 0.003) {
        activeStroke.points.push(nextPoint);
    }
}

function getReplaceCellIndexFromEvent(event) {
    if (!isReplaceMode() || !state.baseImage) return null;
    const rect = UI.previewCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const config = getReplaceGridConfig();
    const normalizedX = Math.max(0, Math.min(0.999999, (event.clientX - rect.left) / rect.width));
    const normalizedY = Math.max(0, Math.min(0.999999, (event.clientY - rect.top) / rect.height));
    const column = Math.floor(normalizedX * config.columns);
    const row = Math.floor(normalizedY * config.rows);
    const index = row * config.columns + column;
    return index < config.count ? index : null;
}

async function canvasToBlob(canvas) {
    const mimeType = getExportMimeType();
    const quality = mimeType === "image/png" ? undefined : 0.92;

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
                return;
            }
            reject(new Error(t("exportBlobFailed")));
        }, mimeType, quality);
    });
}

async function openHandleDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(HANDLE_DB_NAME, 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(HANDLE_STORE_NAME)) {
                db.createObjectStore(HANDLE_STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveExportDirectoryHandle(handle) {
    if (!window.indexedDB) return false;
    const db = await openHandleDb();
    try {
        await new Promise((resolve, reject) => {
            const transaction = db.transaction(HANDLE_STORE_NAME, "readwrite");
            transaction.objectStore(HANDLE_STORE_NAME).put(handle, EXPORT_HANDLE_KEY);
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
        });
        return true;
    } finally {
        db.close();
    }
}

async function loadExportDirectoryHandle() {
    if (!window.indexedDB) return null;
    const db = await openHandleDb();
    const handle = await new Promise((resolve, reject) => {
        const transaction = db.transaction(HANDLE_STORE_NAME, "readonly");
        const request = transaction.objectStore(HANDLE_STORE_NAME).get(EXPORT_HANDLE_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
    db.close();
    return handle;
}

async function ensureDirectoryPermission(handle) {
    if (!handle) return false;
    const permission = await handle.queryPermission({ mode: "readwrite" });
    if (permission === "granted") return true;
    const requested = await handle.requestPermission({ mode: "readwrite" });
    return requested === "granted";
}

async function restoreExportDirectoryHandle() {
    try {
        const savedHandle = await loadExportDirectoryHandle();
        if (!savedHandle) return false;
        const granted = await ensureDirectoryPermission(savedHandle);
        if (!granted) return false;
        state.exportDirectoryHandle = savedHandle;
        UI.exportPath.value = savedHandle.name;
        return true;
    } catch (error) {
        console.warn("restore export directory failed", error);
        return false;
    }
}

async function pickExportFolder() {
    if (!window.showDirectoryPicker) {
        showToast(t("toastChooseFolderUnsupported"), "error");
        return;
    }

    try {
        const handle = await window.showDirectoryPicker({ mode: "readwrite" });
        state.exportDirectoryHandle = handle;
        UI.exportPath.value = handle.name;
        try {
            await saveExportDirectoryHandle(handle);
        } catch (error) {
            console.warn("remember export directory failed", error);
        }
        showToast(t("saveRememberedFolder"), "success");
    } catch (error) {
        if (error.name !== "AbortError") {
            console.error(error);
            showToast(t("toastChooseFolderFailed"), "error");
        }
    }
}

function getRequestedExportFileName() {
    const rawValue = UI.fileNameInput.value.trim();
    const fileName = rawValue ? applyExportExtension(rawValue) : createDefaultFileName();
    UI.fileNameInput.value = fileName;
    return fileName;
}

async function saveToFolder() {
    const layout = getCompositeLayout();
    if (!layout) {
        showToast(isBaseImageMode() ? t("toastNeedBaseImage") : t("statusDimensionsWaiting", { count: getCurrentModeConfig().requiredCount }), "error");
        return;
    }

    if (!state.exportDirectoryHandle) {
        const restored = await restoreExportDirectoryHandle();
        if (!restored) {
            await pickExportFolder();
        }
    }

    if (!state.exportDirectoryHandle) {
        showToast(t("toastNoTargetFolder"), "error");
        return;
    }

    const granted = await ensureDirectoryPermission(state.exportDirectoryHandle);
    if (!granted) {
        showToast(t("toastNoFolderPermission"), "error");
        return;
    }

    const exportCanvas = document.createElement("canvas");
    drawComposite(exportCanvas, { blockSize: EXPORT_MOSAIC_BLOCK_SIZE, skipSelectionOverlay: true, exporting: true });
    const blob = await canvasToBlob(exportCanvas);
    const requestedFileName = getRequestedExportFileName();
    const resolvedFileName = await resolveAvailableFileName(state.exportDirectoryHandle, requestedFileName);
    const fileHandle = await state.exportDirectoryHandle.getFileHandle(resolvedFileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();

    UI.fileNameInput.value = resolvedFileName;
    state.lastAutoFileName = resolvedFileName;
    showToast(t("savedToFolder", { folder: state.exportDirectoryHandle.name, fileName: resolvedFileName }), "success");
}

async function downloadCurrentFormat() {
    const layout = getCompositeLayout();
    if (!layout) {
        showToast(isBaseImageMode() ? t("toastNeedBaseImage") : t("statusDimensionsWaiting", { count: getCurrentModeConfig().requiredCount }), "error");
        return;
    }

    const exportCanvas = document.createElement("canvas");
    drawComposite(exportCanvas, { blockSize: EXPORT_MOSAIC_BLOCK_SIZE, skipSelectionOverlay: true, exporting: true });
    const blob = await canvasToBlob(exportCanvas);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileName = getRequestedExportFileName();

    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    state.lastAutoFileName = fileName;
    showToast(t("downloadStarted", { format: getExportFormatLabel() }), "success");
}

async function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error("Failed to read blob as data URL"));
        reader.readAsDataURL(blob);
    });
}

async function exportPipelineDataUrl() {
    const layout = getCompositeLayout();
    if (!layout) {
        throw new Error(isBaseImageMode() ? t("toastNeedBaseImage") : t("statusDimensionsWaiting", { count: getCurrentModeConfig().requiredCount }));
    }

    const exportCanvas = document.createElement("canvas");
    drawComposite(exportCanvas, { blockSize: EXPORT_MOSAIC_BLOCK_SIZE, skipSelectionOverlay: true, exporting: true });
    const blob = await canvasToBlob(exportCanvas);
    const dataUrl = await blobToDataUrl(blob);
    const extension = getExportExtension();
    const fileName = applyExportExtension(createDefaultFileName());
    return { dataUrl, extension, fileName };
}

window.__StoryboardImageEditorBridge = {
    exportPipelineDataUrl
};

window.addEventListener("message", async (event) => {
    const data = event.data;
    if (!data || typeof data !== "object") {
        return;
    }

    if (data.type === "sbe-set-language") {
        const nextLanguage = data.payload && data.payload.language;
        if (nextLanguage === "zh" || nextLanguage === "en") {
            setLanguage(nextLanguage);
        }
        return;
    }

    if (data.type !== "sbe-export-request" || !data.requestId) {
        return;
    }

    try {
        const payload = await exportPipelineDataUrl();
        event.source.postMessage(
            {
                type: "sbe-export-response",
                requestId: data.requestId,
                success: true,
                payload
            },
            "*"
        );
    } catch (error) {
        event.source.postMessage(
            {
                type: "sbe-export-response",
                requestId: data.requestId,
                success: false,
                error: error && error.message ? error.message : "Unknown stitch export error"
            },
            "*"
        );
    }
});

function bindEvents() {
    document.querySelectorAll(".help-trigger").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
    });

    UI.modeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (state.mode === button.dataset.mode) return;
            state.mode = button.dataset.mode;
            state.isMosaicBrushMode = false;
            clearMosaicStrokes({ silent: true });
            if (!isReplaceMode()) {
                setSelectedOverlayCells([]);
            }
            updateModeUI();
            updateOrientationUI();
            refreshAllSlots();
            ensureFileName(true);
            updateDownloadButtonLabel();
            renderComposite();
        });
    });

    UI.batchImportButton.addEventListener("click", () => {
        UI.batchFileInput.click();
    });

    UI.langZhButton.addEventListener("click", () => setLanguage("zh"));
    UI.langEnButton.addEventListener("click", () => setLanguage("en"));

    UI.baseImageButton.addEventListener("click", () => {
        UI.baseImageInput.click();
    });

    UI.baseImageInput.addEventListener("change", (event) => {
        handleBaseImageChange(event.target.files[0]).finally(() => {
            UI.baseImageInput.value = "";
        });
    });

    UI.batchFileInput.addEventListener("change", async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        try {
            await assignFilesToActiveSlots(files);
        } catch (error) {
            console.error(error);
            showToast(error.message || t("toastBatchImportFailed"), "error");
        } finally {
            UI.batchFileInput.value = "";
        }
    });

    UI.replaceGridButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (state.replaceGridType === button.dataset.replaceGrid) return;
            const previousIndexes = getActiveSlotIndexes();
            state.replaceGridType = button.dataset.replaceGrid;
            const nextIndexes = getActiveSlotIndexes();
            const removedIndexes = previousIndexes.filter((index) => !nextIndexes.includes(index));
            clearOverlayReplacementsForIndexes(removedIndexes);
            setSelectedOverlayCells(state.selectedOverlayCells.filter((index) => nextIndexes.includes(index)));
            clearMosaicStrokes({ silent: true });
            state.isMosaicBrushMode = false;
            updateModeUI();
            refreshAllSlots();
            ensureFileName(true);
            renderComposite();
        });
    });

    UI.replaceCellButtons.forEach((button) => {
        button.addEventListener("click", () => {
            toggleOverlayCellSelection(Number(button.dataset.cellIndex));
            renderComposite();
        });
    });

    UI.clearCellSelectionButton.addEventListener("click", () => {
        if (state.selectedOverlayCells.length === 0) {
            showToast(t("toastNoSelectedCells"), "error");
            return;
        }
        setSelectedOverlayCells([]);
        renderComposite();
        showToast(t("toastClearedSelectedCells"), "success");
    });

    UI.orientationButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (state.orientation === button.dataset.orientation) return;
            state.orientation = button.dataset.orientation;
            state.isMosaicBrushMode = false;
            clearMosaicStrokes({ silent: true });
            updateOrientationUI();
            ensureFileName(true);
            renderComposite();
        });
    });

    UI.uploadSlots.forEach((slot, index) => {
        slot.input.addEventListener("change", (event) => {
            handleFileChange(index, event.target.files[0]);
        });

        slot.root.addEventListener("dragstart", (event) => {
            if (isReplaceMode() || isExpandMode() || !state.images[index]) {
                event.preventDefault();
                return;
            }

            state.draggedSlotIndex = index;
            slot.root.classList.add("dragging");
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", String(index));
            }
        });

        slot.root.addEventListener("dragover", (event) => {
            if (state.draggedSlotIndex === null || state.draggedSlotIndex === index) return;
            event.preventDefault();
            slot.root.classList.add("drag-target");
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = "move";
            }
        });

        slot.root.addEventListener("dragleave", () => {
            slot.root.classList.remove("drag-target");
        });

        slot.root.addEventListener("drop", (event) => {
            if (state.draggedSlotIndex === null || state.draggedSlotIndex === index) return;
            event.preventDefault();
            const fromIndex = state.draggedSlotIndex;
            const swapped = swapImages(fromIndex, index);
            clearDragState();
            if (swapped) {
                showToast(t("toastSwappedImages", { from: fromIndex + 1, to: index + 1 }), "success");
            }
        });

        slot.root.addEventListener("dragend", () => {
            clearDragState();
        });
    });

    UI.mosaicBrushSize.addEventListener("input", (event) => {
        if (!ENABLE_MOSAIC_FEATURE) return;
        state.mosaicBrushSize = Number(event.target.value);
        updateMosaicBrushUI();
    });

    UI.toggleMosaicButton.addEventListener("click", () => {
        if (!ENABLE_MOSAIC_FEATURE) return;
        if (!getCompositeLayout()) {
            showToast(isBaseImageMode() ? t("toastNeedBaseImage") : t("statusDimensionsWaiting", { count: getCurrentModeConfig().requiredCount }), "error");
            return;
        }

        state.isMosaicBrushMode = !state.isMosaicBrushMode;
        renderComposite();
        updateMosaicBrushUI();
        showToast(state.isMosaicBrushMode ? t("toastMosaicEnabled") : t("toastMosaicDisabled"), "success");
    });

    UI.clearMosaicButton.addEventListener("click", () => {
        if (!ENABLE_MOSAIC_FEATURE) return;
        if (state.mosaicBrushStrokes.length === 0) {
            showToast(t("toastNoMosaicToClear"), "error");
            return;
        }
        clearMosaicStrokes();
        renderComposite();
    });

    UI.exportFormat.addEventListener("change", (event) => {
        state.exportFormat = event.target.value;
        syncFileNameExtension();
        updateDownloadButtonLabel();
    });

    UI.fileNameInput.addEventListener("change", () => {
        UI.fileNameInput.value = applyExportExtension(UI.fileNameInput.value || "merged-output");
    });

    UI.previewCanvas.addEventListener("mousedown", (event) => {
        if (!ENABLE_MOSAIC_FEATURE) return;
        if (!state.isMosaicBrushMode || !getCompositeLayout()) return;
        event.preventDefault();
        const stroke = createMosaicStrokeAtEvent(event);
        if (!stroke) return;
        state.isPaintingMosaic = true;
        state.mosaicBrushStrokes.push(stroke);
        renderComposite();
    });

    UI.previewCanvas.addEventListener("mousemove", (event) => {
        if (!ENABLE_MOSAIC_FEATURE) return;
        if (!state.isMosaicBrushMode || !state.isPaintingMosaic) return;
        appendPointToCurrentMosaicStroke(event);
        renderComposite();
    });

    UI.previewCanvas.addEventListener("click", (event) => {
        if (state.isMosaicBrushMode || !isReplaceMode() || !getCompositeLayout()) return;
        const index = getReplaceCellIndexFromEvent(event);
        if (index === null) return;
        toggleOverlayCellSelection(index);
        renderComposite();
    });

    document.addEventListener("mouseup", () => {
        if (!state.isPaintingMosaic) return;
        state.isPaintingMosaic = false;
        updateMosaicBrushUI();
    });

    UI.pickFolderButton.addEventListener("click", pickExportFolder);
    UI.saveFolderButton.addEventListener("click", () => {
        saveToFolder().catch((error) => {
            console.error(error);
            showToast(error.message || t("toastSaveFailed"), "error");
        });
    });
    UI.downloadButton.addEventListener("click", () => {
        downloadCurrentFormat().catch((error) => {
            console.error(error);
            showToast(error.message || t("toastDownloadFailed"), "error");
        });
    });
}

async function bootstrap() {
    ensureFileName(true);
    UI.exportFormat.value = state.exportFormat;

    UI.uploadSlots.forEach((_, index) => updateSlot(index));
    bindEvents();
    applyTranslations();
    await restoreExportDirectoryHandle();
    if (!state.exportDirectoryHandle) {
        UI.exportPath.value = t("exportPathEmpty");
    }
}

bootstrap().catch((error) => {
    console.error(error);
    showToast(t("toastInitFailed"), "error");
});
