<?php
$key=$_GET['key'];
?>

<?php
$host = "mysql-server.ucl.ac.uk";
$user = "uclypiv_readonly";
$password = "8Tr0q5S9K80";
$dbname = "uclypiv_MobileApp";

$conn = new mysqli($host, $user, $password, $dbname);

if ($key=="125") {
	$query = "SELECT MIN(timeElapsed) AS MV FROM mc_summary";
	$data = mysqli_query($conn, $query);
	$row = $data -> fetch_array(MYSQLI_ASSOC);
	$tm = $row['MV'];
	$query = "SELECT MIN(moveN) AS MV FROM mc_summary";
	$data = mysqli_query($conn, $query);
	$row = $data -> fetch_array(MYSQLI_ASSOC);
	$mn = $row['MV'];
	if ($tm>0) {
		echo $mn." Moves and ".$tm." Seconds";
	} else {echo "0";}
}

$conn->close();
?>
