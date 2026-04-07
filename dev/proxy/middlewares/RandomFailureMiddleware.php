<?php

namespace Dev\Proxy\Middlewares;

use Tent\Middlewares\Middleware;
use Tent\Models\ProcessingRequest;
use Tent\Models\Response;

class RandomFailureMiddleware extends Middleware
{
    public static function build(array $attributes): self
    {
        return new self();
    }

    public function processRequest(ProcessingRequest $request): ProcessingRequest
    {
        $rate = (float) (getenv('FAILURE_RATE') ?: 0);

        if ($rate > 0 && lcg_value() < $rate) {
            $response = new Response([
                'httpCode' => 502,
                'body'     => 'Bad Gateway'
            ]);
            $request->setResponse($response);
        }

        return $request;
    }
}
