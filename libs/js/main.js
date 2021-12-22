$(document).ready(function() {
    $("#loading").fadeOut(function() {
        
    });
});

//GLOBALS
var latlng = null;
var country = null;
var weatherSelected = false;
var weatherAlertHasFired = false;
var countryFullName = null;
const lightRowColor = "#ffffff";
const darkRowColor = "#bbc7fb49";
var userCoordinates = null;

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
		console.log(errorThrown);
	},
});

// RENDERS MAP
var map = L.map("map", { tap: false }).setView([53.8, 1.54], 13);

var OpenStreetMap_Mapnik = L.tileLayer(
	"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
	{
		maxZoom: 19,
		minZoom: 1,
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	}
).addTo(map);

const renderMapWithUserLocation = () => {
	if (map) {
		navigator.geolocation.getCurrentPosition((GeolocationPosition) => {
			userCoordinates = [
				GeolocationPosition.coords.latitude,
				GeolocationPosition.coords.longitude,
			];

			if (userCoordinates) {
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
						$("#countries-dropdown").val(result.data.countryCode);
						countryBordersOnMap(country);
					} else {
						return;
					}
				},
				error: (jqXHR, textStatus, errorThrown) => {
					console.log(textStatus);
				},
			});
			} else {
				map.setView([53.8008, 1.5491], 13);
			}

		});
	}
};

renderMapWithUserLocation();

/*var data = L.geoJSON(data, {
	style: function (feature) {
		return { color: feature.properties.color };
	},
})
	.bindPopup(function (layer) {
		return layer.feature.properties.description;
	})
	.addTo(map); */

var citiesMarkers = L.layerGroup();

//MARKERS

var userMarker = L.ExtraMarkers.icon({
	icon: "fa-home",
	markerColor: "green",
	shape: "square",
	prefix: "fa",
});

var restaurantMarker = L.ExtraMarkers.icon({
	icon: "fa-hamburger",
	markerColor: "red",
	shape: "square",
	prefix: "fa",
});

var hotelMarker = L.ExtraMarkers.icon({
	icon: "fa-bed",
	markerColor: "blue",
	shape: "square",
	prefix: "fa",
});

var nightlifeMarker = L.ExtraMarkers.icon({
	icon: "fa-music",
	markerColor: "pink",
	shape: "square",
	prefix: "fa",
});

var cityMarkerIcon = L.ExtraMarkers.icon({
	icon: "fa-city",
	markerColor: "yellow",
	shape: "square",
	prefix: "fa",
});

var webcamMarker = L.ExtraMarkers.icon({
	icon: "fa-camera",
	markerColor: "orange",
	shape: "square",
	prefix: "fa",
});

//SHOW MODAL

const showModal = () => {
	$("generalModalHeader").empty();
	$("#generalModalHeader").css("background-image", "none");
	$("#generalModalHeader").css("color", "white");
	$("#generalContainer").empty();
	$("#generalModal").modal("show");
	$("#generalContainer").append(`<div class="spinner-border" role="status">
	<span class="sr-only">Loading...</span>
  </div>`);
};

//RENDERS EASYBUTTONS

L.easyButton("fa-globe", (btn, map) => {
	countryBordersOnMap(country);
	countrySelection(country);
}).addTo(map);

L.easyButton("fa-newspaper", (btn, map) => {
	countryBordersOnMap(country);
	getCountryNews(country);
}).addTo(map);

L.easyButton("fa-virus", (btn, map) => {
	countryBordersOnMap(country);
	getCovidStats(country);
}).addTo(map);

L.easyButton("fa-cloud-sun", (btn, map) => {
	weatherSelected = !weatherSelected;
	if (!weatherAlertHasFired) {
		/*alert(
			"Please click on points on the map for the most recent weather forecast! To return to country data selection please click the weather button again!"
		);*/
		weatherAlertHasFired = true;
	}
	if (weatherSelected) {
		btn.button.style.backgroundColor = "lightgreen";
	} else {
		btn.button.style.backgroundColor = null;
	}
}).addTo(map);

L.easyButton("fa-city", (btn, map) => {
	countryBordersOnMap(country);
	getCities(country);
}).addTo(map);

L.easyButton("fa-camera", (btn, map) => {
	getWebcams(country)
}).addTo(map);

//COVID API CALL

const getCovidStats = (country) => {
	$.ajax({
		url: "libs/php/covidStats.php",
		type: "POST",
		dataType: "json",
		data: {
			country: country.toUpperCase(),
		},
		success: (result) => {
			if (result.status.name == "ok") {
				
			}
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(textStatus);
		},
	});
}

//WEBCAM API CALL

const getWebcams = (country) => {
	$.ajax({
		url: "libs/php/windyWebcams.php",
		type: "POST",
		dataType: "json",
		data: {
			country: country.toUpperCase(),
		},
		success: (result) => {
			if (result.status.name == "ok") {
				console.log(result)
				var webcams = result.data.result.webcams
				webcams.forEach((webcam) => {
					L.marker(
						[webcam.location.latitude, webcam.location.longitude],
						{ icon: webcamMarker }
					)
						.addTo(map)
						.bindPopup(`<h5>${webcam.title}<h5>
						<div class="embed-responsive embed-responsive-16by9">
						<iframe class="embed-responsive-item" src="${webcam.player.day.embed}" allowfullscreen></iframe>
					  </div>
									`);
				})
			}
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(textStatus);
		},
	});
}

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

//GENERAL BUTTON API CALL

const countrySelection = (country) => {
	var currencyCode = null;
	var capital = null;
	var population = null;
	var language = null;
	//function which converts language code to language name
	const getLanguage = (code) => {
		const lang = new Intl.DisplayNames(["en"], { type: "language" });
		return lang.of(code);
	};

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
				capital = selectedCountry["capital"];
				population = numeral(selectedCountry["population"]).format('0,0');
				language = getLanguage(selectedCountry["languages"].substr(0, 2));
				showModal();
				$("#generalContainer").empty();
				$("#generalModalLabel").text(countryFullName);
				$("#flag").attr(
					"src",
					"http://www.geonames.org/flags/x/" + country.toLowerCase() + ".gif"
				);

				//Starting 2nd january when free currency api renews move following into nested ajax call:

				$("#generalContainer").append(
					`
								<div class="row" style="background-color:${darkRowColor}">
									<div class="col-1">
										<i class="fas fa-archway"></i>
									</div>
									<div class="col-2">
										<p>Capital</p>
									</div>
									<div class="col-2 offset-6">
										<p>${capital}</p>
									</div>
								</div>

								<div class="row" style="background-color:${lightRowColor}">
									<div class="col-1">
										<i class="fas fa-user-friends"></i>
									</div>
									<div class="col-2">
										<p>Population</p>
									</div>
									<div class="col-2 offset-6">
										<p>${population}</p>
									</div>
								</div>
								
								<div class="row" style="background-color:${darkRowColor}">
									<div class="col-1">
										<i class="fas fa-language"></i>
									</div>
									<div class="col-2">
										<p>Language</p>
									</div>
									<div class="col-2 offset-6">
										<p>${language}</p>
									</div>
								</div>

								<div class="row" style="background-color:${lightRowColor}">
									<div class="col-1">
										<i class="fas fa-coins"></i>
									</div>
									<div class="col-5">
										<p>USD exchange rate</p>
									</div>
									<div class="col-2 offset-3">
										<p>tbc</p>
									</div>
								</div>
								`
				);

				//And uncomment these

				/*$.ajax({
					url: "libs/php/currency.php",
					type: "POST",
					dataType: "json",
					data: {
						country: country,
					},
					success: (result) => {
						if (result.status.name == "ok") {
							showModal();
							$("#generalContainer").empty();
							$("#generalModalLabel").text(countryFullName);
							$("#flag").attr(
								"src",
								"http://www.geonames.org/flags/x/" +
									country.toLowerCase() +
									".gif"
							);
							
							$("#generalContainer").append(
								`<p>Capital: ${capital}</p>
								<p>Population: ${population}</p>
								<p>Exchange rate to USD: ${result["data"]["rates"][currencyCode].toFixed(
									2
								)} ${currencyCode}</p>`
							);
						}
					},
					error: (jqXHR, textStatus, errorThrown) => {
						console.log(errorThrown);
					},
				});*/
			}
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(errorThrown);
		},
	});
};

//FIND COUNTRY BY CLICKING ON POINT ON MAP

map.on("click", (e) => {
	latlng = map.mouseEventToLatLng(e.originalEvent);
	//finds country based on coordinates
	$.ajax({
		url: "libs/php/findCountry.php",
		type: "POST",
		dataType: "json",
		data: {
			lat: latlng.lat,
			long: latlng.lng,
		},
		success: (result) => {
			country = result.data.countryCode.toLowerCase();
			countryFullName = result.data.countryName;

			$("#countries-dropdown").val(result.data.countryCode);
			//gets weather forecast for those coordinates if weather forecast is toggled on
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
						const forecast = result.data.daily;
						
						console.log(forecast)
						
						
						showModal();
						$("#generalContainer").empty();
						$("#generalModalLabel").empty();
						$("#flag").attr(
							"src",
							"http://www.geonames.org/flags/x/" +
								country.toLowerCase() +
								".gif"
						);
						$("#generalModalLabel").text(`${countryFullName.toUpperCase()} WEATHER`);
						if (forecast[0].weather[0].main === "Rain" || forecast[0].weather[0].main ==="Drizzle") {
							$("#generalModalHeader").css(
								"background-image",
								"url(" + "./libs/img/overcastClouds.jpg" + ")"
							);
							$("#generalModalHeader").css("color", "white");
						} else if (forecast[0].weather[0].main === "Clear"){
							$("#generalModalHeader").css(
								"background-image",
								"url(" + "./libs/img/sun.jpg" + ")"
							);
							$("#generalModalHeader").css("color", "white");
						} 
						else if (forecast[0].weather[0].main === "ThunderStorm" ) {
							$("#generalModalHeader").css(
								"background-image",
								"url(" + "./libs/img/thunder.jpg" + ")"
							);
							$("#generalModalHeader").css("color", "white");
						} else if (forecast[0].weather[0].main === "Snow") {
							$("#generalModalHeader").css(
								"background-image",
								"url(" + "./libs/img/snow.jpg" + ")"
							);
							$("#generalModalHeader").css("color", "white");
						} else {
							$("#generalModalHeader").css(
								"background-image",
								"url(" + "./libs/img/lightClouds.jpg" + ")"
							);
							$("#generalModalHeader").css("color", "black");
						}
						const getWeatherIcon = (overview) => {
							if (overview === "Thunderstorm") {
								return "fas fa-bolt"
							} else if (overview === "Drizzle" || overview === "Rain") {
								return "fas fa-cloud-showers-heavy"
							} else if (overview === "Snow") {
								return "fas fa-snowflake"
							} else if (overview === "Clear") {
								return "fas fa-sun"
							} else {
								return "fas fa-cloud"
							}
						}
						const todayForecast = getWeatherIcon(forecast[0].weather[0].main)
						const todayPlusOne =  getWeatherIcon(forecast[1].weather[0].main)
						const todayPlusTwo =  getWeatherIcon(forecast[2].weather[0].main)
						const todayPlusThree =  getWeatherIcon(forecast[3].weather[0].main)
						var today = new Date()
						var todayDatePlusOne = today.setDate(today.getDate() + 1)
						var todayDatePlusTwo = today.setDate(today.getDate() + 1)
						var todayDatePlusThree = today.setDate(today.getDate() + 1)
						
						console.log($.format.date(todayDatePlusOne + 1, "MMM d"))
						$("#generalContainer").append(`
					
								<div class="row mainWeatherRow">
									<div class="col-3">
										<i class="${todayForecast} fa-5x"></i>
									</div>
									<div class="col-3">
										<p>${(forecast[0].temp.max - 273).toFixed(0)}&deg;</p>
									</div>
									<div class="col-3">
										<p>${(forecast[0].temp.min - 273).toFixed(0)}&deg;</p>
									</div>
									<div class="col-3">
										<p>${forecast[0].weather[0].description}</p>
									</div>
								</div>

								<div class="row" ">
									<div class="col-1">
										<i class="${todayPlusOne}"></i>
									</div>
									<div class="col-1">
										<p>${(forecast[1].temp.max - 273).toFixed(0)}&deg;</p>
									</div>
									<div class="col-1">
										<p>${(forecast[1].temp.min - 273).toFixed(0)}&deg;</p>
									</div>
									<div class="col-4"
										<p>${$.format.date(todayDatePlusOne + 1, "MMM d")}</p>
									</div>
								</div>

								<div class="row" ">
									<div class="col-1">
										<i class="${todayPlusTwo}"></i>
									</div>
									<div class="col-1">
										<p>${(forecast[2].temp.max - 273).toFixed(0)}&deg;</p>
									</div>
									<div class="col-1">
										<p>${(forecast[2].temp.min - 273).toFixed(0)}&deg;</p>
									</div>
									<div class="col-4"
										<p>${$.format.date(todayDatePlusTwo + 1, "MMM d")}</p>
									</div>
								</div>

								<div class="row" ">
									<div class="col-1">
										<i class="${todayPlusThree}"></i>
									</div>
									<div class="col-1">
										<p>${(forecast[3].temp.max - 273).toFixed(0)}&deg;</p>
									</div>
									<div class="col-1">
										<p>${(forecast[3].temp.min - 273).toFixed(0)}&deg;</p>
									</div>
									<div class="col-4"
										<p>${$.format.date(todayDatePlusThree + 1, "MMM d")}</p>
									</div>
								</div>

								

					`);
					},
					error: (jqXHR, textStatus, errorThrown) => {
						console.log(jqXHR);
					},
				});
			} else {
				countryBordersOnMap(country);
			}
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(errorThrown);
		},
	});
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
			showModal();
			if (result.data.totalResults === 0 || result.data.status === "error") {
				$("#generalContainer").empty();
				$("#generalModalLabel").text(`${countryFullName} headlines:`);
				$("#flag").attr(
					"src",
					"http://www.geonames.org/flags/x/" + country.toLowerCase() + ".gif"
				);
				$("#generalContainer").append(
					"<p>Sorry no news is currently available for this country."
				);
			} else {
				var stories = result.data.results;
				$("#generalContainer").empty();
				var altRowColor = false;
				stories.forEach((story) => {
					if (story.image_url) {
						$("#generalModalLabel").text(`${countryFullName} headlines`);
						$("#flag").attr(
							"src",
							"http://www.geonames.org/flags/x/" +
								country.toLowerCase() +
								".gif"
						);
						$("#generalContainer").append(`
														<div class="row" style="background-color:${
															altRowColor ? lightRowColor : darkRowColor
														}">
															<div class="col-2 newsImageDiv"><img class="img-fluid newsimg"  src="${
																story.image_url
															}"></img></div>
															<div class="col-10"><a href="${
																story.link
															}" class="newsrow"><div class="text-truncate newstext">${
							story.title
						}</div></a></div
														</div>
														`);
					} else {
						$("#generalModalLabel").text(`${countryFullName} headlines:`);
						$("#generalContainer").append(`
														<div class="row" style="background-color:${
															altRowColor ? lightRowColor : darkRowColor
														}">
															<div class="col-12"><a href="${
																story.link
															}" class="newsrow"><div class="text-truncate newstext">${
							story.title
						}</div></a></div>
														</div>
														`);
					}
					altRowColor = !altRowColor;
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

			$("#generalContainer").empty();

			cities.forEach((city) => {
				const onClick = (e) => {
					$("#citiesContainer").empty();
					$("#citiesModal").modal("show");
					$("#citiesModalLabel").html(city.name);
					$("#citiesContainer").append(`
													<div class="row" style="background-color:${darkRowColor}">
														<div class="col-1 col-md-1">
															<i class="fas fa-hamburger"></i>
														</div>
														<div class="col-6 col-md-4">
															<p>Top Restaurants</p>
														</div>
														<div class="col-3 offset-2  col-md-1 offset-md-5">
														<button id=${city.id} type="button" class="btn btn-primary restaurants-btn">View</button>
														</div>
													</div>

													<div class="row" style="background-color:${lightRowColor}">
														<div class="col-1 col-md-1">
															<i class="fas fa-bed"></i>
														</div>
														<div class="col-6 col-md-4">
															<p>Top Hotels</p>
														</div>
														<div class="col-3 offset-2 col-md-1 offset-md-5">
														<button id=${city.id} type="button" class="btn btn-primary hotels-btn">View</button>
														</div>
													</div>
													
													<div class="row" style="background-color:${darkRowColor}">
														<div class="col-1 col-md-1">
															<i class="fas fa-music"></i>
														</div>
														<div class="col-6 col-md-4">
															<p>Top Nightlife</p>
														</div>
														<div class="col-3 offset-2 col-md-1 offset-md-5">
															<button id=${city.id} type="button" class="btn btn-primary nightlife-btn">View</button>
														</div>
													</div>
													`);
					//zooms in to the city
					map.setView(
						[city.coordinates.latitude, city.coordinates.longitude],
						12
					);
					$.ajax({
						url: "libs/php/cityImages.php",
						type: "POST",
						dataType: "json",
						data: {
							city: city.name.toLowerCase()
						},
						success: (result) => {
							if (result.status.name == "ok") {
								console.log(result)
								var cityImageUrl = result.data.photos[0].image.web;
								if (cityImageUrl) {
									$("#cityModalHeader").css({
										"background-image": `linear-gradient(
											rgba(0, 0, 0, 0.5),
											rgba(0, 0, 0, 0.5)
										  ),url("${cityImageUrl}")`,
										"background-size": "cover"
									});
									
								}
							}
						},
						error: (jqXHR, textStatus, errorThrown) => {
							console.log(textStatus);
						},
					});
				};
				var cityMarker = new L.Marker(
					[city.coordinates.latitude, city.coordinates.longitude],
					{ icon: cityMarkerIcon }
				);
				citiesMarkers.addLayer(cityMarker);

				cityMarker.on("click", onClick);
			});
			map.addLayer(citiesMarkers);
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(errorThrown);
		},
	});
};

//TOP RESTAURANTS API CALL

//Could condense these easily

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
			map.removeLayer(citiesMarkers);
			var restaurants = result.data.results;
			$("#citiesModal").modal("hide");

			restaurants.forEach((restaurant) => {
				L.marker(
					[restaurant.coordinates.latitude, restaurant.coordinates.longitude],
					{ icon: restaurantMarker }
				)
					.addTo(map)
					.bindPopup(`<h6>${restaurant.name}</h6><p>${restaurant.intro}</p>`);
			});
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(errorThrown);
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
			var hotels = result.data.results;
			$("#citiesModal").modal("hide");
			hotels.forEach((hotel) => {
				L.marker([hotel.coordinates.latitude, hotel.coordinates.longitude], {
					icon: hotelMarker,
				})
					.addTo(map)
					.bindPopup(`<h6>${hotel.name}</h6><p>${hotel.intro}</p>`);
			});
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(errorThrown);
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
			var nightlife = result.data.results;
			$("#citiesModal").modal("hide");
			nightlife.forEach((nightlife) => {
				L.marker(
					[nightlife.coordinates.latitude, nightlife.coordinates.longitude],
					{ icon: nightlifeMarker }
				)
					.addTo(map)
					.bindPopup(`<h6>${nightlife.name}</h6><p>${nightlife.intro}</p>`);
			});
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.log(errorThrown);
		},
	});
});

$("#countries-dropdown").on("change", () => {
	country = $("#countries-dropdown").val();
	countryFullName = $("#countries-dropdown :selected").text();
	countryBordersOnMap(country);
});
