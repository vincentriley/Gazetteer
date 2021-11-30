//Populates drop down list with country names
$.ajax({
	url: "libs/php/countryNames.php",

	success: (result) => {
		let dropdown = $("#countries-dropdown");
		let countryNameArray = [];
		for (let i = 0; i < result.data.length; i++) {
			countryNameArray.push(result.data[i].name);
		}
		countryNameArray.sort();
		for (let i = 0; i < countryNameArray.length; i++) {
			dropdown.append(
				$(
					`<option value=${countryNameArray[i]}>${countryNameArray[i]}</option>`
				)
			);
		}
	},
	error: (jqXHR, textStatus, errorThrown) => {
		console.log("failure");
	},
});

//Renders map
var map = L.map("map").setView([51.05, -0.09], 13);

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

const countrySelection() => {
	console.log("test")
}
