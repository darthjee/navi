<?php

use Tent\Configuration;
use Tent\Models\Rule;
use Tent\Handlers\ProxyRequestHandler;
use Tent\Models\Server;
use Tent\Models\RequestMatcher;

Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => 'http://backend:80'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '.json', 'type' => 'ends_with']
    ],
    'middlewares' => [
        ['class' => 'Dev\\Proxy\\Middlewares\\RandomFailureMiddleware']
    ]
]);

Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => 'http://backend:80'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/categories', 'type' => 'begins_with']
    ]
]);
