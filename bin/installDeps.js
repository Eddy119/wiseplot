#!/usr/bin/env node

const https = require("https");
const fs = require("fs");

const deps = [
    "https://unpkg.com/webextension-polyfill@0.6.0/dist/browser-polyfill.min.js",
    "https://cdn.jsdelivr.net/gh/ofrohn/d3-celestial/celestial.js",
    "https://cdn.jsdelivr.net/gh/ofrohn/d3-celestial/lib/d3.min.js",
    "https://cdn.jsdelivr.net/gh/ofrohn/d3-celestial/lib/d3.geo.projection.min.js",
];

try {
    fs.mkdirSync("lib");
} catch (e) {
    if (e.code !== "EEXIST") throw e;
}

for (const depUrl of deps) {
    const filename = new URL(depUrl).pathname.split("/").slice(-1)[0];
    const fileStream = fs.createWriteStream(`lib/${filename}`);
    https.get(depUrl, response => {
        response.pipe(fileStream);
    });
    fileStream.on("close", () => {
        console.log(`Installed ${filename}`);
    });
}
