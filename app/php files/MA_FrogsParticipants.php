<!DOCTYPE html>
<html>
<head>
  <title>Frogs Summary</title>
  <style>
  #customers {
  font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
  font-size: 65%;
  border-collapse: collapse;
  width: 100%;
  }

  #customers td, #customers th {
  border: 1px solid #ddd;
  padding: 8px;
  }

  #customers tr:nth-child(even){background-color: #f2f2f2;}

  #customers tr:hover {background-color: #ddd;}

  #customers th {
  padding-top: 12px;
  padding-bottom: 12px;
  background-color: #4CAF50;
  color: white;
  }
  </style>
</head>
<body>
<table id="customers">
  <tr>
    <th>code</th>
    <th>Trial Numbers</th>
    <th>Proportion Correct</th>
    <th>Start</th>
    <th>End</th>
  </tr>
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
	$query = "SELECT DISTINCT subject FROM frogs ORDER BY subject";
	$data = mysqli_query($conn, $query);
        $rowN = $data -> num_rows;
        for ($i=0;$i<$rowN;$i++) {
                $row = mysqli_fetch_assoc($data);
                $subj =  $row['subject'];
            		$query2 = "SELECT moveN AS val FROM frogs WHERE subject = '$subj'";
            		$data2 = mysqli_query($conn, $query2);
            		$blockN = mysqli_num_rows($data2);
                $query2 = "SELECT SUM(corr) AS val FROM frogs WHERE subject = '$subj'";
                $data2 = mysqli_query($conn, $query2);
                $row2 = mysqli_fetch_assoc($data2);
                $corrSum = $row2['val'];
                $corrAve = round($corrSum/$blockN,2);
            		$query2 = "SELECT MAX(date) AS val FROM frogs WHERE subject = '$subj'";
            		$data2 = mysqli_query($conn, $query2);
            		$row2 = mysqli_fetch_assoc($data2);
            		$dateE = $row2['val'];
	                $query2 = "SELECT MIN(date) AS val FROM frogs WHERE subject = '$subj'";
        	        $data2 = mysqli_query($conn, $query2);
                	$row2 = mysqli_fetch_assoc($data2);
                	$dateS = $row2['val'];
            		echo "<tr><td>".$subj."</td><td>",$blockN."</td><td>",$corrAve."</td><td>".$dateS."</td><td>".$dateE."</td></tr>";
        }
}
$conn->close();
?>
</table>
</html>
