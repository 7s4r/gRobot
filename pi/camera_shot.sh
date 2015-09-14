#!/bin/bash

dstUrl="http://dev1.bwebmedia.com/collect.php"
refresh=1 # delay between each photo

while true ; do
  imgTag="pi - "`date "+%d/%m/%Y %H:%M:%S"`
  imgName="cam.jpg"
  raspistill -t 1 -w 640 -h 480 -q 50 -o $imgName # camera snapshot

  if [ -f $imgName ] ; then
    convert -pointsize 15 -undercolor black -fill white -draw 'text 0,12 "'"$imgTag"'"' $imgName $imgName
    curl --form camera_image=@$imgName --form token=pi $dstUrl # send img to server
    rm $imgName
  fi

  sleep $refresh
done
