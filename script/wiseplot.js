console.log("poopy is running.");

(async () => {
    const { paramsHistory } = await browser.storage.sync.get({ "paramsHistory": [] });
    console.log(`Loaded ${paramsHistory.length} existing entries.`);

    function updateParamsHistory() {
        const { ra, dec, size } = window.location.hash
            .substring(1)
            .split("&")
            .map(part => part.split("="))
            .map(([key, value]) => ({ [key]: Number(value) }))
            .reduce((cum, pair) => Object.assign(cum, pair), {});

        paramsHistory.push({
            ra, dec, size,
            _time: Date.now(),
        });
        browser.storage.sync.set({ paramsHistory })
            .then(() => {
                console.log("Wrote to paramsHistory:", { ra, dec, size });
            })
            .catch(e => {
                console.error("Failed to write new paramsHistory:", e);
            });
    }

    updateParamsHistory();
    window.addEventListener("hashchange", updateParamsHistory);
})();
