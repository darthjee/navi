<?php

use Tent\Configuration;

if (getenv('FRONTEND_DEV_MODE') === 'true') {
    Configuration::buildRule([
        'handler' => [
            'type' => 'proxy',
            'host' => 'http://frontend:8080'
        ],
        'matchers' => [
            ['method' => 'GET', 'uri' => '/',               'type' => 'exact'],
            ['method' => 'GET', 'uri' => '/assets/js/',     'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/assets/css/',    'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/@vite/',         'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/node_modules/',  'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/@react-refresh', 'type' => 'exact']
        ]
    ]);
} else {
    Configuration::buildRule([
        'handler' => [
            'type' => 'proxy',
            'host' => 'http://backend:80'
        ],
        'matchers' => [
            ['method' => 'GET', 'uri' => '/', 'type' => 'begins_with']
        ]
    ]);
}
