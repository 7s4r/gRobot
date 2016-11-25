<?php

$message = [];
$sudo = 'sudo -p giorgio ';

if (isset($_GET['do'])) {
  switch ($_GET['do']) {
    case 'shutdown':
      $cmd = system($sudo.'shutdown -h now', $message);
      break;
    case 'reboot':
      $cmd = shell_exec("/usr/bin/sudo /usr/sbin/reboot");
      break;
    case 'who':
      $cmd = system('whoami', $message);
      break;
    default:
      array_push($message, 'ERROR: command does not exists');
      break;
  }
} else array_push($message, 'ERROR: action not isset');

header('Content-type: text/json');
echo json_encode($message);