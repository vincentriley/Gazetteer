//Populates drop down list with country names
$.ajax({
	url: "libs/php/countryNames.php",

	success: (result) => {
		let dropdown = $("#countries-dropdown");
		let countryNameArray = [];

		for (let i = 0; i < result.data.length; i++) {
			countryNameArray.push([result.data[i].name, result.data[i].iso_a2]);
		}
		countryNameArray.sort();
		for (let i = 0; i < countryNameArray.length; i++) {
			dropdown.append(
				$(
					`<option value=${countryNameArray[i][1]}>${countryNameArray[i][0]}</option>`
				)
			);
		}
	},
	error: (jqXHR, textStatus, errorThrown) => {
		console.log("failure");
	},
});

//Renders map
var map = L.map("map").setView([51.05, -0.09], 2);

var OpenStreetMap_Mapnik = L.tileLayer(
	"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
	{
		maxZoom: 19,
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	}
).addTo(map);
var data = L.geoJSON(data, {
	style: function (feature) {
		return { color: feature.properties.color };
	},
})
	.bindPopup(function (layer) {
		return layer.feature.properties.description;
	})
	.addTo(map);

const countrySelection = () => {
	$.ajax({
		url: "libs/php/countryBorders.php",
		type: "POST",
		dataType: "json",
		data: {
			country: $("#countries-dropdown").val(),
		},
		success: (result) => {
			if (result.status.name == "ok") {
				
				map.eachLayer(function(layer){
					if (OpenStreetMap_Mapnik != layer){map.removeLayer(layer)};
				});
				var countryPolygonLayer = L.geoJson(result.data)
				map.fitBounds(countryPolygonLayer.getBounds())
				countryPolygonLayer.addTo(map)
				
				
			}
		},
		error:  (jqXHR, textStatus, errorThrown) => {
			// your error code
			console.log(textStatus);
		},
	});

	$.ajax({
		url: "libs/php/countryInfo.php",
		type: "POST",
		dataType: "json",
		data: {
			country: $("#countries-dropdown").val()
		},
		success: (result) => {
			
			if (result.status.name == "ok") {
				console.log(result["data"][0])
				$("#exampleModalLabel").html(result["data"][0]["countryName"]);
				$("#capital").html(`Capital: ${result["data"][0]["capital"]}`);
				$("#population").html(`Population: ${result["data"][0]["population"]}`);
			}
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.log("failure")
		}
	})
};


$("#countries-dropdown").on("change", countrySelection);

$("#countries-dropdown").change(() => {
	$("#exampleModal").modal('show');
})
