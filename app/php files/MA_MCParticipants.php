<!DOCTYPE html>
<html>
<head>
  <title>Memory Card Summary</title>
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
    <th>Number Games</th>
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
	$query = "SELECT DISTINCT subject FROM mc_summary ORDER BY subject";
	$data = mysqli_query($conn, $query);
        $rowN = $data -> num_rows;
        for ($i=0;$i<$rowN;$i++) {
                $row = mysqli_fetch_assoc($data);
                $subj =  $row['subject'];
            		$query2 = "SELECT MAX(blockN) AS val FROM mc_summary WHERE subject = '$subj'";
            		$data2 = mysqli_query($conn, $query2);
            		$row2 = mysqli_fetch_assoc($data2);
            		$blockN = $row2['val'];
            		$query2 = "SELECT MAX(date) AS val FROM mc_summary WHERE subject = '$subj'";
            		$data2 = mysqli_query($conn, $query2);
            		$row2 = mysqli_fetch_assoc($data2);
            		$dateE = $row2['val'];
	                $query2 = "SELECT MIN(date) AS val FROM mc_summary WHERE subject = '$subj'";
        	        $data2 = mysqli_query($conn, $query2);
                	$row2 = mysqli_fetch_assoc($data2);
                	$dateS = $row2['val'];
            		echo "<tr><td>".$subj."</td><td>",$blockN."</td><td>".$dateS."</td><td>".$dateE."</td></tr>";
        }
}
$conn->close();
?>
</table>
</html>
