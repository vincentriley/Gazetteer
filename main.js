//GLOBALS
var hasExactLatLng = false;
var country = null;

//POPULATES DROPDOWN LIST
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

// RENDERS MAP
var map = L.map("map").setView([51.05, -0.09], 2);

const renderMapWithUserLocation = () => {
	if (map) {
		navigator.geolocation.getCurrentPosition((GeolocationPosition) => {
			var userCoordinates = [
				GeolocationPosition.coords.latitude,
				GeolocationPosition.coords.longitude,
			];
			
			//finds user country
			$.ajax({
				url: "libs/php/findCountry.php",
				type: "POST",
				dataType: "json",
				data: {
					lat: userCoordinates[0],
					long: userCoordinates[1],
				},
				success: (result) => {
					if (!country) {
						country = result.data.countryCode.toLowerCase();
					} else {
						return
					}
				},
				error: (jqXHR, textStatus, errorThrown) => {
					console.log(textStatus);
				},
			});
			map.setView(userCoordinates, 15);
		});
	}
};

renderMapWithUserLocation();

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

//RENDERS EASYBUTTONS

L.easyButton("fa-globe", (btn, map) => {
	$("#exampleModal").modal("show");
	countrySelection(country);
}).addTo(map);

L.easyButton("fa-newspaper", (btn, map) => {
	$("#newsModal").modal("show");
}).addTo(map);

//GENERAL BUTTON API CALL

const countryBordersOnMap = (country) => {
	$.ajax({
		url: "libs/php/countryBorders.php",
		type: "POST",
		dataType: "json",
		data: {
			country: country.toUpperCase(),
		},
		success: (result) => {
			if (result.status.name == "ok") {
				map.eachLayer(function (layer) {
					if (OpenStreetMap_Mapnik != layer) {
						map.removeLayer(layer);
					}
				});
				var countryPolygonLayer = L.geoJson(result.data);
				map.fitBounds(countryPolygonLayer.getBounds());
				countryPolygonLayer.addTo(map);
			}
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(textStatus);
		},
	});
};

const countrySelection = (country, lat = null, long = null) => {
	$("#flag").attr(
		"src",
		"http://www.geonames.org/flags/x/" + country.toLowerCase() + ".gif"
	);

	var currencyCode = "";

	$.ajax({
		url: "libs/php/countryInfo.php",
		type: "POST",
		dataType: "json",
		data: {
			country: country,
		},
		success: (result) => {
			if (result.status.name == "ok") {
				$("#exampleModalLabel").html(result["data"][0]["countryName"]);
				$("#capital").html(`Capital: ${result["data"][0]["capital"]}`);
				$("#population").html(`Population: ${result["data"][0]["population"]}`);
				currencyCode = result["data"][0]["currencyCode"];
				$.ajax({
					url: "libs/php/currency.php",
					type: "POST",
					dataType: "json",
					data: {
						country: country,
					},
					success: (result) => {
						if (result.status.name == "ok") {
							$("#currency").html(
								`Exchange rate to USD: ${result["data"]["rates"][
									currencyCode
								].toFixed(2)} ${currencyCode}`
							);
						}
					},
					error: (jqXHR, textStatus, errorThrown) => {
						console.log(errorThrown);
					},
				});
			}
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.log("failure");
		},
	});

	if (hasExactLatLng) {
		$.ajax({
			url: "libs/php/getWeather.php",
			type: "POST",
			dataType: "json",
			data: {
				lat: lat,
				long: long,
			},
			success: (result) => {
				$("#weather").html(
					`Temperature = ${(result.data.main.temp - 273).toFixed(1)}&deg;`
				);
			},
			error: (jqXHR, textStatus, errorThrown) => {
				console.log(errorThrown);
			},
		});
	} else {
		$("#weather").html(
			"For weather forecast please click on a spot on the map."
		);
	}
};

map.on("click", (e) => {
	var latlng = map.mouseEventToLatLng(e.originalEvent);

	$.ajax({
		url: "libs/php/findCountry.php",
		type: "POST",
		dataType: "json",
		data: {
			lat: latlng.lat,
			long: latlng.lng,
		},
		success: (result) => {
			hasExactLatLng = true;
			country = result.data.countryCode.toLowerCase();

			countryBordersOnMap(country);

			//need to find way of changing value in dropdown list

			countrySelection(country, latlng.lat, latlng.lng);
			//$("#exampleModal").modal("show");
			hasExactLatLng = false;
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(textStatus);
		},
	});
});

$("#countries-dropdown").on("change", () => {
	country = $("#countries-dropdown").val();
	countryBordersOnMap(country);
	countrySelection(country);
});

$("#countries-dropdown").change(() => {});
