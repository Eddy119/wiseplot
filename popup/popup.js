const CSV_DELIM = ",";

async function exportAsCsv() {
    const { paramsHistory } = await browser.storage.local.get({ paramsHistory: [] });

    const lines = [];

    const keys = ["_time", "ra", "dec", "size"];
    lines.push(keys.join(CSV_DELIM));  // header row

    for (const entry of paramsHistory) {
        const rowCells = keys.map(key => entry[key]);
        lines.push(rowCells.join(CSV_DELIM));
    }

    const csvText = lines.join("\n");

    const obj = new Blob([csvText], { type: "text/csv" });
    browser.downloads.download({
        url: URL.createObjectURL(obj),
        filename: "poopy_export.csv",
    });
}

async function importCsv() {
    console.log("baka")
}

async function deletelocal() {
    browser.storage.local.clear();
}

document.getElementById("export-btn").addEventListener("click", exportAsCsv);
document.getElementById("deletelocal-btn").addEventListener("click", deletelocal);