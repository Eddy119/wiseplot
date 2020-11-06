console.log("poopy is running.");
console.log("Celestial is:", Celestial);

(async () => {
    /* load and update param history */
    const { paramsHistory } = await browser.storage.sync.get({ "paramsHistory": [] });
    console.log(`Loaded ${paramsHistory.length} existing entries.`);

    let jsonShapes;
    
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
    document.body.appendChild(map);
    map.setAttribute("id","wiseplot"); 

    const config = {
        width: 900,
        center: [-65, 0],
        container: "wiseplot",
        datapath: "https://ofrohn.github.io/data/",
    };

    function hour2degree(ra) { 
        return ra > 12 ? (ra - 24) * 15 : ra * 15;
    }

    // Display map with the configuration above or any subset thereof
    // Celestial.display(config);
    
    /* line drawing stuff */
    
    jsonShapes = {
        "type":"FeatureCollection",
        // this is an array, add as many objects as you want
        "features":[
            {
                "type":"Feature",
                "id":"SummerTriangle",
                "geometry":{
                    // the line object as an array of point coordinates, 
                    // always as [ra -180..180 degrees, dec -90..90 degrees]
                    "type":"MultiLineString",
                    // "coordinates":[[
                    //     [-80.7653, 38.7837],
                    //     [-62.3042, 8.8683],
                    //     [-49.642, 45.2803],
                    //     [-80.7653, 38.7837]
                    // ]],
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
                }
            }  
        ]
    };

    const lineStyle = { 
        stroke: "#f00", 
        fill: "rgba(255, 204, 204, 0.4)",
        width: 3 
    };
    // const textStyle = { 
    //     fill: "#f00", 
    //     font: "bold 15px Helvetica, Arial, sans-serif", 
    //     align: "center", 
    //     baseline: "bottom" 
    // };

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
        Celestial.container.selectAll(".ast").each(function(d) {
            // Set line styles 
            Celestial.setStyle(lineStyle);
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