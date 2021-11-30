<?php
$countryBordersFileContent = file_get_contents("../../countryBorders.geo.json");
$decode = json_decode($countryBordersFileContent, true);

    $country_borders = [];
    $country = [];

    foreach($decode['features'] as $country_data) {
        if($country_data["properties"]["iso_a2"] == $_REQUEST['country']) {
            $country_borders = $country_data;
            break;
        } 
        
    } 

	$output["status"]["code"] = "200";
	$output["status"]["name"] = "ok";
	$output["status"]["description"] = "success";
    /*$output["status"]["returnedIn"] = intval((microtime(true) - $executionStartTime) * 1000) . "ms"; */
    $output["data"] = $country_borders;

	header('Content-type: application/json; charset=UTF-8');

	echo json_encode($output);
?>
