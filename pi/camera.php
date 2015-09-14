<?php

?>

<!DOCTYPE html>
<html>
  <head>
    <title>Camera</title>
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8">
    <style>
      body {
        text-align: center;
        background-color: #000;
      }

      div.camera {
        display: inline-block;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="camera" id="pi">
      <OBJECT classid="clsid:9BE31822-FDAD-461B-AD51-BE1D1C159921"
              codebase="http://downloads.videolan.org/pub/videolan/vlc/latest/win32/axvlc.cab"
              width="800" height="600" id="vlc" events="True">
        <param name="Src" value="http://localhost:8080/" />
        <param name="ShowDisplay" value="True" />
        <param name="AutoLoop" value="False" />
        <param name="AutoPlay" value="True" />
        <embed id="vlcEmb" type="application/x-google-vlc-plugin" version="VideoLAN.VLCPlugin.2" autoplay="yes" loop="no" width="640" height="480"
               target="http://localhost:8080/" ></embed>
      </OBJECT>
    </div>
  </body>
</html>
