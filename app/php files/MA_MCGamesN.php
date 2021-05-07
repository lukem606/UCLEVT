<?php
$scode=$_GET['scode'];
$key=$_GET['key'];
?>

<?php
$host = "mysql-server.ucl.ac.uk";
$user = "uclypiv_readonly";
$password = "8Tr0q5S9K80";
$dbname = "uclypiv_MobileApp";

$conn = new mysqli($host, $user, $password, $dbname);

if ($key=="125") {
	$query = "SELECT subject FROM mc_summary WHERE subject = '$scode'";
	$data = mysqli_query($conn, $query);
	echo mysqli_num_rows($data);
}

$conn->close();
?>
