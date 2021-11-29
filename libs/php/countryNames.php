<?php

	$countryBordersFileContent =file_get_contents("../../countryBorders.geo.json");
	$decode = json_decode($countryBordersFileContent, true);

	$country_names_and_iso_codes = [];

	foreach($decode['features'] as $country_data) {
		array_push(
			$country_names_and_iso_codes,
			array(
				"name" => $country_data["properties"]["name"],
				"iso_a2" => $country_data["properties"]["iso_a2"],
				"iso_a3" => $country_data["properties"]["iso_a3"]
			)
			);
	};

	$output["status"]["code"] = "200";
	$output["status"]["name"] = "ok";
	$output["data"] = $country_names_and_iso_codes;

	header('Content-type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
