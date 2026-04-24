<?php

use Tent\Configuration;

Configuration::buildRule([
  'handler' => [
    'type' => 'static',
    'folder' => '/var/www/html/configuration/static'
  ],
  'matchers' => [
    ['method' => 'GET', 'uri' => '/', 'type' => 'begins_with']
  ]
]);

Configuration::buildRule([
  'handler' => [
    'type' => 'static',
    'folder' => '/var/www/html/configuration/static'
  ],
  'matchers' => [
    ['method' => 'GET', 'uri' => '/', 'type' => 'exact'],
  ],
  "middlewares" => [
    [
      'class' => 'Tent\Middlewares\SetPathMiddleware',
      'path' => '/index.html'
    ]
  ]
]);
