<?php

if ( isset($_REQUEST['token']) && $_REQUEST['token'] == 'pi' ) {
  $dstDir = 'camera';
  $imgName = time().'.jpg';
  if (!is_dir($dstDir)) mkdir($dstDir, 0755, true);
  if (is_uploaded_file($_FILES["camera_image"]["tmp_name"])) {
    move_uploaded_file($_FILES["camera_image"]["tmp_name"], $dstDir.'/'.$imgName);
  }
}
