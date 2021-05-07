<?php
$key=$_GET['key'];
?>

<?php
if ($key==125) {
	// filename for export
	$csv_filename = 'AsanoMCSummary_'.date('Y-m-d').'.csv';

	// database variables
	$host = "mysql-server.ucl.ac.uk";
	$user = "uclypiv_readonly";
	$password = "8Tr0q5S9K80";
	$dbname = "uclypiv_MobileApp";

	$conn = new mysqli($host, $user, $password, $dbname);

	// create var to be filled with export data
	$csv_export = '';

	// query to get data from database
	$query = mysqli_query($conn,"SELECT * FROM mc_summary");
	$field = mysqli_num_fields($query);

	// create line with field names
	for($i = 0; $i < $field; $i++) {
  		$foo = mysqli_fetch_field_direct($query,$i);
  		$fooname = $foo->name;
  		$csv_export.= '"'.$fooname.'",';
	}
	// newline (seems to work both on Linux & Windows servers)
	$csv_export.= '
';

	while($row = mysqli_fetch_array($query)) {
  		// create line with field values
  		for($i = 0; $i < $field; $i++) {
    			$csv_export.= '"'.$row[$i].'",';
  		}	
  		$csv_export.= '
';	
	}

	// Export the data and prompt a csv file for download
	header("Content-type: text/x-csv");
	header("Content-Disposition: attachment; filename=".$csv_filename."");
	echo($csv_export);
	$conn->close();
}
?>
