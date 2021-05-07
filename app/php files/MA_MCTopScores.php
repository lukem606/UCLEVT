<table id="customers">
  <tr>
    <th>Player</th>
    <th>Moves</th>
    <th>Seconds</th>
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
	$query = "SELECT * FROM mc_summary ORDER BY moveN, timeElapsed LIMIT 10";
	$data = mysqli_query($conn, $query);
  $rowN = $data -> num_rows;
  for ($i=0;$i<$rowN;$i++) {
    $row = mysqli_fetch_assoc($data);
    $subj =  $row['subject'];
    $moves = $row['moveN'];
    $time = $row['timeElapsed'];
    echo "<tr><td>".$subj."</td><td>",$moves."</td><td>".$time."</td></td>";
  }
}
$conn->close();
?>
</table>
