<?php

use Tent\Configuration;

// All /#/... hash routes are served by this rule because browsers strip
// the hash fragment before sending the HTTP request, so every hash-based
// navigation arrives at the server as GET /.
Configuration::buildRule([
  'handler' => [
    'type' => 'static',
    'location' => '/var/www/html/configuration/static'
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

Configuration::buildRule([
  'handler' => [
    'type' => 'static',
    'location' => '/var/www/html/configuration/static'
  ],
  'matchers' => [
    ['method' => 'GET', 'uri' => '/', 'type' => 'begins_with']
  ]
]);
