<?php

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'type' => 'static_file',
        'folder' => '/var/www/html/configuration/static'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/', 'type' => 'begins_with']
    ]
]);

Configuration::buildRule([
    'handler' => [
        'type' => 'fixed_file',
        'file' => '/var/www/html/configuration/static/index.html'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/', 'type' => 'begins_with']
    ]
]);
