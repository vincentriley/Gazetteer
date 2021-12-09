//GLOBALS
var hasExactLatLng = false;
var latlng;
var country = null;
var weatherSelected = false;
var weatherAlertHasFired = false;
var countryFullName = null;

const cityClickHandler = () => {
	console.log("success");
};

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
var map = L.map("map", { minZoom: 3 }).setView([51.05, -0.09], 2);

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
						countryFullName = result.data.countryName;
					} else {
						return;
					}
				},
				error: (jqXHR, textStatus, errorThrown) => {
					console.log(textStatus);
				},
			});
			if (userCoordinates) {
				map.setView(userCoordinates, 15);
				L.marker(userCoordinates)
					.addTo(map)
					.bindPopup("Current Location")
					.openPopup();
			}
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

var citiesMarkers = L.layerGroup();

//RENDERS EASYBUTTONS

L.easyButton("fa-globe", (btn, map) => {
	countryBordersOnMap(country);
	$("#generalModalLabel").text("");
	$("#generalContainer").empty();
	$("#generalModal").modal("show");
	$("#generalContainer").append(`<div class="spinner-border" role="status">
	<span class="sr-only">Loading...</span>
  </div>`);
	countrySelection(country);
}).addTo(map);

L.easyButton("fa-newspaper", (btn, map) => {
	countryBordersOnMap(country);
	$("#generalContainer").empty();
	$("#generalModal").modal("show");
	$("#generalContainer").append(`<div class="spinner-border" role="status">
	<span class="sr-only">Loading...</span>
  </div>`);
	getCountryNews(country);
}).addTo(map);

L.easyButton("fa-cloud-sun", (btn, map) => {
	weatherSelected = true;
	if (!weatherAlertHasFired) {
		alert(
			"Please click on a point on the map for most recent weather forecast!"
		);
		weatherAlertHasFired = true;
	}
}).addTo(map);

L.easyButton("fa-city", (btn, map) => {
	$("#generalContainer").empty();
	countryBordersOnMap(country);

	getCities(country);
}).addTo(map);

//DISPLAY COUNTRY BORDERS ON MAP

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
				map.eachLayer((layer) => {
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

//GENERAL BUTTON API CALLS

const countrySelection = (country) => {
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
				var selectedCountry = result.data[0];

				currencyCode = selectedCountry["currencyCode"];
				$.ajax({
					url: "libs/php/currency.php",
					type: "POST",
					dataType: "json",
					data: {
						country: country,
					},
					success: (result) => {
						if (result.status.name == "ok") {
							$("#generalModalLabel").html(selectedCountry["countryName"]);
							$("#generalContainer").empty();
							$("#generalContainer").append(`
			<p>Capital: ${selectedCountry["capital"]}</p>
			<p>Population: ${selectedCountry["population"]}</p>
			`);
							$("#generalContainer").append(
								`<p>Exchange rate to USD: ${result["data"]["rates"][
									currencyCode
								].toFixed(2)} ${currencyCode}</p>`
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
};

//FIND COUNTRY BY CLICKING ON POINT ON MAP

map.on("click", (e) => {
	latlng = map.mouseEventToLatLng(e.originalEvent);
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
			countryFullName = result.data.countryName;
			console.log(countryFullName);
			countryBordersOnMap(country);
			//need to find way of changing value in dropdown list
			$("#countries-dropdown").val(result.data.countryCode);
			hasExactLatLng = false;
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(textStatus);
		},
	});
	if (weatherSelected) {
		$.ajax({
			url: "libs/php/getWeather.php",
			type: "POST",
			dataType: "json",
			data: {
				lat: latlng.lat,
				long: latlng.lng,
			},
			success: (result) => {
				console.log(result.data);
				$("#generalContainer").empty();
				$("#generalModalLabel").empty();
				$("#generalModal").modal("show");
				$("#generalModalLabel").text(
					`${countryFullName} local weather report:`
				);
				$("#generalContainer").append(`
			<p>Weather Station Name: ${result.data.name}</p>
			<p>Temperature: ${(result.data.main.temp - 273).toFixed(1)}&deg;</p>
			<p>Humidity: ${result.data.main.humidity}%</p>
			<p>Wind Speed: ${result.data.wind.speed}</p>
			`);
			},
			error: (jqXHR, textStatus, errorThrown) => {
				console.log(errorThrown);
			},
		});
		weatherSelected = false;
	} else {
		countrySelection(country);
	}
});

//NEWS BUTTON API CALL

const getCountryNews = (country) => {
	$.ajax({
		url: "libs/php/countryNews.php",
		type: "POST",
		dataType: "json",
		data: {
			country: country,
		},
		success: (result) => {
			console.log(result);
			if (result.data.totalResults === 0) {
				$("#generalContainer").empty();
				$("generalModalHeader").empty();
				$("#generalModalLabel").text(`${countryFullName} headlines:`);
				$("#generalContainer").append(
					"<p>Sorry no news available for this country."
				);
			} else {
				var stories = result.data.results;
				console.log(stories);
				stories.forEach((story) => {
					if (story.image_url) {
						$("#generalContainer").empty();
						$("generalModalHeader").empty();
						$("#generalModalLabel").text(`${countryFullName} headlines:`);
						$("#generalContainer").append(`
				<div class="newsStoryRow" class="row">
					<div class="col-2"><img class="img-fluid"  src="${story.image_url}"></img></div>
					<div class="col-10"><a href="${story.link}"><div class="text-truncate">${story.title}</div></a></div
				</div>
				`);
					} else {
						$("#generalContainer").empty();
						$("#generalContainer").append(`
				<div class="row">
					<div class="col-12"><a href="${story.link}"><div class=text-truncate">${story.title}</div></a></div>
				</div>
				`);
					}
				});
			}
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(textStatus);
		},
	});
};

//GET CITIES API CALL

const getCities = (country) => {
	if (country === "gb") {
		country = "uk";
	}
	$.ajax({
		url: "libs/php/triposoCities.php",
		type: "POST",
		dataType: "json",
		data: {
			country: country,
		},
		success: (result) => {
			var cities = result.data.results;
			console.log(cities);
			$("#generalContainer").empty();

			cities.forEach((city) => {
				const onClick = (e) => {
					$("#citiesContainer").empty();
					$("#citiesModal").modal("show");
					$("#citiesModalLabel").html(city.name);
					$("#citiesContainer").append(`
					
						<div class="citiesFlexRow">
							<button id=${city.id} type="button" class="btn btn-primary restaurants-btn">Top Restaurants</button>
						</div>
						<br>
						<div class="citiesFlexRow">
							<button id=${city.id} type="button" class="btn btn-primary hotels-btn">Top Hotels</button>
						</div>
						<br>
						<div class="citiesFlexRow">
							<button id=${city.id} type="button" class="btn btn-primary nightlife-btn">Top Nightlife</button>
						</div>
					
					`);
					map.setView(
						[city.coordinates.latitude, city.coordinates.longitude],
						12
					);
				};
				var cityMarker = new L.Marker([
					city.coordinates.latitude,
					city.coordinates.longitude,
				]);
				citiesMarkers.addLayer(cityMarker);

				cityMarker.on("click", onClick);
			});
			map.addLayer(citiesMarkers);
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(textStatus);
		},
	});
};

//TOP RESTAURANTS API CALL

$("#citiesContainer").on("click", ".restaurants-btn", (event) => {
	const cityId = event.target.id;

	$.ajax({
		url: "libs/php/triposoRestaurants.php",
		type: "POST",
		dataType: "json",
		data: {
			cityId: cityId,
		},
		success: (result) => {
			console.log(result);
			map.removeLayer(citiesMarkers);
			var restaurants = result.data.results;
			$("#citiesModal").modal("hide");
			console.log(restaurants);

			restaurants.forEach((restaurant) => {
				L.marker([
					restaurant.coordinates.latitude,
					restaurant.coordinates.longitude,
				])
					.addTo(map)
					.bindPopup(`<h6>${restaurant.name}</h6><p>${restaurant.intro}</p>`);
			});
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(textStatus);
		},
	});
});

//TOP HOTELS API CALL

$("#citiesContainer").on("click", ".hotels-btn", (event) => {
	const cityId = event.target.id;

	$.ajax({
		url: "libs/php/triposoHotels.php",
		type: "POST",
		dataType: "json",
		data: {
			cityId: cityId,
		},
		success: (result) => {
			map.removeLayer(citiesMarkers);
			console.log(result);
			var hotels = result.data.results;
			$("#citiesModal").modal("hide");
			console.log(hotels);

			hotels.forEach((hotel) => {
				L.marker([hotel.coordinates.latitude, hotel.coordinates.longitude])
					.addTo(map)
					.bindPopup(`<h6>${hotel.name}</h6><p>${hotel.intro}</p>`);
			});
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(textStatus);
		},
	});
});

//TOP NIGHTLIFE API CALL

$("#citiesContainer").on("click", ".nightlife-btn", (event) => {
	const cityId = event.target.id;

	$.ajax({
		url: "libs/php/triposoNightlife.php",
		type: "POST",
		dataType: "json",
		data: {
			cityId: cityId,
		},
		success: (result) => {
			map.removeLayer(citiesMarkers);
			console.log(result);
			var nightlife = result.data.results;
			$("#citiesModal").modal("hide");
			console.log(nightlife);

			nightlife.forEach((nightlife) => {
				L.marker([
					nightlife.coordinates.latitude,
					nightlife.coordinates.longitude,
				])
					.addTo(map)
					.bindPopup(`<h6>${nightlife.name}</h6><p>${nightlife.intro}</p>`);
			});
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(textStatus);
		},
	});
});

$("#countries-dropdown").on("change", () => {
	country = $("#countries-dropdown").val();
	countryFullName = $("#countries-dropdown :selected").text();
	console.log(countryFullName);
	countryBordersOnMap(country);
});
