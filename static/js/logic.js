// Store our API endpoint inside QueryUrls
const EQ_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson";

// The following geoJSON gives layers of plate boundaries, geometry "LineString"
const PLATE_URL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";
var colorScale ;
var maxMag,minMag; 

function getRadius(d) {
  return 10000 * d;
}


// Perform a GET request to the query URL
d3.json(EQ_URL, function (earthquakeData) {

  d3.json(PLATE_URL, function (plateData) {
    _log(plateData);
    createFeatures(earthquakeData.features, plateData.features);
  });
});

function createFeatures(earthquakeData, plateData) {

  // Create a GeoJSON layer containing the features array on the earthquakeData object
  maxMag = d3.max(earthquakeData, d=> d.properties.mag); 
  minMag = d3.min(earthquakeData, d=> d.properties.mag); 
  _log("Max Mag " + maxMag); 
  _log("Min Mag " + minMag); 
  var earthquakes = L.geoJSON(earthquakeData, {
    pointToLayer: function (feature, latlng) {

      // magnitude determines the color
      colorScale = d3.scaleLinear().domain([minMag, maxMag]).range(["yellow", "darkgreen"]);
      var color =   colorScale(feature.properties.mag);
       
     

      // Add circles to map
      return L.circle(latlng, {
        weight: 1,
        opacity: 0.75,
        fillOpacity: 0.75,
        color: color,
        fillColor: color,
        // Adjust radius
        radius: getRadius(feature.properties.mag)
      }).bindPopup("<h4> Magnitude: " + feature.properties.mag + "<br>Location:  " + feature.properties.place +
        "</h4><hr><p>" + new Date(feature.properties.time) + "</p>");
    } // end pointToLayer

   

  });


  
  var plates = L.geoJSON(plateData, {
    style: function (feature) {
      return {
        color: "red",
        weight: 1
      };
    }
  });

  // Sending our earthquakes layer to the createMap function
  createMap(earthquakes, plates);
}

function createMap(earthquakes, plates) {

  var grayscaleMap =  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 18
  });



  // Define a baseMaps object to hold our base layers
  var baseMaps = {
    "Gray Scale": grayscaleMap
  };

  // Create overlay object to hold our overlay layer
  var overlayMaps = {
    'Earthquakes': earthquakes,
    'Plate boundaries': plates
  };

  // Create our map, giving it the GrayScale and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 4,
    layers: [grayscaleMap, earthquakes, plates]
  });

  var legend = L.control({
    position: 'bottomright'
  });

  legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend');
    var magnitudes = [0, 1, 2, 3, 4, 5];
    var labels = ['0-1', '1-2', '2-3', '3-4', '4-5', '5+'];

    // loop through our magnitude intervals and generate a label with a colored square for each interval
    for (var i = 0; i < magnitudes.length; i++) {
      div.innerHTML +=
        '<i style="background:' + colorScale(magnitudes[i]) + '"></i> ' + labels[i] + '<br>';
    }
    return div;
  }; // end legend.onAdd

  legend.addTo(myMap);


  myMap.on('overlayremove', function (eventLayer) {
    if (eventLayer.name === 'Earthquakes') {
      this.removeControl(legend);
    }
  });

  myMap.on('overlayadd', function (eventLayer) {
    // Turn on the legend...
    if (eventLayer.name === 'Earthquakes') {
      legend.addTo(this);
    }
  });

  // layer control takes the kind of map (grayScale) and the data set (overyLapMaps)
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);
}

function _log(s){
  console.log(s);
}