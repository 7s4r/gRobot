<?php

function showLastImage() {
  $lastCameraImg = end(glob('camera/*.jpg'));
  $img = new Imagick($lastCameraImg);
  header('Content-type: image/jpeg');
  echo $img;
}

if (isset($_REQUEST['get_cam_img'])) {
  showLastImage();
} else {

?>

  <!DOCTYPE html>
  <html>
  <head>
    <title>Camera</title>
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8">
    <style>
      body {
        text-align: center;
        background-color: #fff;
      }

      div.camera {
        display: inline-block;
        text-align: center;
        margin: 5px
      }
    </style>
  </head>
  <body>
  <div class="camera" id="pi">
    <img id="img_pi" width="640" height="480" src="">
  </div>
  <script type="text/javascript" src="http://code.jquery.com/jquery-1.11.0.min.js"></script>
  <script>
    $(document).ready(function() {
      setInterval(function() {
        var now = new Date().getTime();
        $("#img_pi").attr("src", "camera.php?get_cam_img=pi&time=" + now);
      }, 3000);
    });
  </script>
  </body>
  </html>

<?php } ?>
