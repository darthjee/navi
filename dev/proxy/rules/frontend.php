<?php

use Tent\Configuration;
use Tent\Models\Rule;
use Tent\Handlers\ProxyRequestHandler;
use Tent\Models\Server;
use Tent\Models\RequestMatcher;

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
}

Configuration::buildRule([
  'handler' => [
    'type'       => 'default_proxy',
    'host'       => 'http://backend:80',
    'cacheCodes' => ['2xx', '3xx']
  ],
  'matchers' => [
    ['method' => 'GET', 'uri' => '/', 'type' => 'begins_with'],
  ],
  'middlewares' => [
    ['class' => 'Dev\\Proxy\\Middlewares\\DelayMiddleware']
  ]
]);
