

<?php


ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);

$url='https://www.triposo.com/api/20211011/poi.json?location_id=' . $_REQUEST['cityId'] . '&tag_labels=eatingout&count=10&fields=id,coordinates,name,score,intro,tag_labels,best_for&order_by=-score&account=73A1QUQ0&token=yvxxa8y2yrtv66bawcwgajp03ouu9r2x';

$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL,$url);

$result=curl_exec($ch);

curl_close($ch);

$decode = json_decode($result,true);	

$output['status']['code'] = "200";
$output['status']['name'] = "ok";
$output['status']['description'] = "success";
$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
$output['data'] = $decode;

//header('Content-Type: application/json; charset=UTF-8');

echo json_encode($output); 

?>