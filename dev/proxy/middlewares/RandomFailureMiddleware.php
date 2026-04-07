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

        $randomizer = new \Random\Randomizer();

        if ($rate > 0 && $randomizer->getFloat(0, 1) < $rate) {
            $response = new Response([
                'httpCode' => 502,
                'body'     => 'Bad Gateway'
            ]);
            $request->setResponse($response);
        }

        return $request;
    }
}
