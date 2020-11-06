console.log("poopy is running.");
console.log("Celestial is:", Celestial);

(async () => {
    /* load and update param history */
    const { paramsHistory } = await browser.storage.local.get({ "paramsHistory": [] });
    console.log(`Loaded ${paramsHistory.length} existing entries.`);

    let jsonShapes, currentShapes;
    
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
        browser.storage.local.set({ paramsHistory })
            .then(() => {
                console.log("Wrote to paramsHistory:", { ra, dec, size });
            })
            .catch(e => {
                console.error("Failed to write new paramsHistory:", e);
            });
        
        if (jsonShapes) {
            const sizeResized = size / 60 / 60 / 2;
            const newPolygon = [
                [ra - sizeResized, dec - sizeResized],
                [ra + sizeResized, dec - sizeResized],
                [ra + sizeResized, dec + sizeResized],
                [ra - sizeResized, dec + sizeResized],
                [ra - sizeResized, dec - sizeResized],
            ]
            jsonShapes.features[0].geometry.coordinates.push(newPolygon);
            Celestial.redraw();
        }
    }
    
    updateParamsHistory();
    window.addEventListener("hashchange", updateParamsHistory);

    /* draw */

    var map=document.createElement("div"); 
    // document.body.appendChild(map);
    const pawnstars = document.getElementById("pawnstarsLink");
    pawnstars.parentElement.insertBefore(map, pawnstars);
    map.setAttribute("id","wiseplot"); 
    
    const mousepos=document.createElement("div");
    pawnstars.parentElement.insertBefore(mousepos, pawnstars);
    mousepos.setAttribute("id","mousepos");
    
    function getPosition(e) {
        const x = e.offsetX;
        const y = e.offsetY;
        const inv = Celestial.mapProjection.invert([x, y]);
        mousepos.textContent = inv;
// [right ascension -180...180 degrees, declination -90...90 degrees]
     }
    document.getElementById("wiseplot").addEventListener("mousemove", getPosition, false);

    const config = {
        width: 900,
        center: [-65, 0],
        container: "wiseplot",
        // datapath: "https://ofrohn.github.io/data/",
        form: true,
        formFields: {"location": true,  // Set visiblity for each group of fields with the respective id
               "general": true,  
               "stars": true,  
               "dsos": true,  
               "constellations": true,  
               "lines": true,  
               "other": true,  
               "download": true},  
        advanced: true,     // Display fewer form fields if false 
        lines: {  // Display & styles for graticule & some planes
            graticule: {
                show: true, stroke: "#cccccc", width: 0.6, opacity: 0.8,   
                // grid values: "outline", "center", or [lat,...] specific position
                lon: {
                    pos: ["center"], fill: "#eee", font: "10px Helvetica, Arial, sans-serif"
                }, 
                // grid values: "outline", "center", or [lon,...] specific position
                lat: {
                    pos: ["center"], fill: "#eee", font: "10px Helvetica, Arial, sans-serif"
                }
            },    
            equatorial: { show: true, stroke: "#aaaaaa", width: 1.3, opacity: 0.7 },  
            ecliptic: { show: true, stroke: "#66cc66", width: 1.3, opacity: 0.7 },     
            galactic: { show: false, stroke: "#cc6666", width: 1.3, opacity: 0.7 },    
            supergalactic: { show: false, stroke: "#cc66cc", width: 1.3, opacity: 0.7 }
        }
    };

    // Display map with the configuration above or any subset thereof
    // Celestial.display(config);
    
    /* line drawing stuff */
    
    jsonShapes = {
        "type": "FeatureCollection",
        // this is an array, add as many objects as you want
        "features": [
            {
                "type": "Feature",
                "id": "History",
                "geometry": {
                    // the line object as an array of point coordinates, 
                    // always as [ra -180..180 degrees, dec -90..90 degrees]
                    "type": "MultiLineString",
                    coordinates: paramsHistory
                        .map(({ ra, dec, size }) => {
                            const sizeResized = size / 60 / 60 / 2;
                            return [
                                [ra - sizeResized, dec - sizeResized],
                                [ra + sizeResized, dec - sizeResized],
                                [ra + sizeResized, dec + sizeResized],
                                [ra - sizeResized, dec + sizeResized],
                                [ra - sizeResized, dec - sizeResized],
                            ]
                        }),
                },
            },
        ],
    };

    const lineStyle = { 
        stroke: "#f00", 
        fill: "rgba(255, 204, 204, 0.4)",
        width: 3,
    };
    const lineStyleCurrent = { 
        stroke: "#00f", 
        fill: "rgba(204, 204, 255, 0.8)",
        width: 5,
    };

    function callbackFunc(error, json) {
        if (error) return console.warn(error);
        // Load the geoJSON file and transform to correct coordinate system, if necessary

        var asterism = Celestial.getData(jsonShapes, config.transform);
        
        // Add to celestial objects container in d3
        Celestial.container.selectAll(".asterisms")
            .data(asterism.features)
            .enter().append("path")
            .attr("class", "ast"); 

        // Trigger redraw to display changes
        Celestial.redraw();
    }

    function redrawFunc() {
        // Select the added objects by class name as given previously
        Celestial.container.selectAll(".ast").each(d => {
            // Set line styles
            Celestial.setStyle(lineStyle);
            isFirst = false;
            // Project objects on map
            Celestial.map(d);
            // draw on canvas
            Celestial.context.fill();
            Celestial.context.stroke();

            // If point is visible (this doesn't work automatically for points)
            if (Celestial.clip(d.properties.loc)) {
                // get point coordinates
                pt = Celestial.mapProjection(d.properties.loc);
                // Set text styles       
                Celestial.setTextStyle(textStyle);
                // and draw text on canvas
                Celestial.context.fillText(d.properties.n, pt[0], pt[1]);
            }
        });
    }

    Celestial.add({
        type: "line",
        callback: callbackFunc,
        redraw: redrawFunc,
    });
    Celestial.display(config);
})().catch(e => {
    console.error(e, e.stack);
});