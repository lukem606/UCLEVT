<?php
$v1=$_GET['a'];
$v2=$_GET['b'];
$v3=$_GET['c'];
$v4=$_GET['d'];
$v5=$_GET['e'];
$v6=$_GET['f'];
$v7=$_GET['g'];
$v8=$_GET['h'];
$v9=$_GET['i'];
$v10=$_GET['j'];
$v11=$_GET['k'];
$v12=$_GET['l'];
$key=$_GET['q'];
?>

<?php
$host = "mysql-server.ucl.ac.uk";
$user = "uclypiv_readonly";
$password = "8Tr0q5S9K80";
$dbname = "uclypiv_MobileApp";

$conn = new mysqli($host, $user, $password, $dbname);

/* check connection */
if (mysqli_connect_errno()) {
	   echo "NoConnect";
	   exit();
} else {
	   echo "Connect";
}

if ($key=="125") {
	$query = "INSERT INTO frogs (date, subject, cond, moveN, f1Talker, f1Vowel, f2Talker, f2Vowel, f3Talker, f3Vowel, oddPos, resp, corr) VALUES (NOW(), '$v1', '$v2', '$v3', '$v4', '$v5', '$v6', '$v7', '$v8', '$v9', '$v10', '$v11', '$v12')";
	if(mysqli_query($conn, $query)){
	    echo "Success";
	} else{
	    echo "LoadError";
	}
} else{
	echo "NoData";
}

$conn->close();
?>
