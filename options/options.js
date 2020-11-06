document.getElementById("import-input").addEventListener("input", async e => {
    const file = e.target.files[0];
    const text = await file.text();
    const lines = text.split("\n");

    const { paramsHistory } = await browser.storage.local.get({ paramsHistory: [] });
    let importCount = 0;
    for (const line of lines) {
        const parts = line.split(",").map(Number);
        const entry = {
            _time: parts[0],
            ra: parts[1],
            dec: parts[2],
            size: parts[3],
        };
        paramsHistory.push(entry);
        ++importCount;
    }
    await browser.storage.local.set({ paramsHistory });
    console.log(`Successfully imported ${importCount} items`);
});