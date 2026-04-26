<?php

namespace Dev\Proxy\Middlewares;

use Tent\Middlewares\Middleware;
use Tent\Models\ProcessingRequest;

class DelayMiddleware extends Middleware
{
    public static function build(array $attributes): self
    {
        return new self();
    }

    public function processResponse(ProcessingRequest $request): ProcessingRequest
    {
        $min = getenv('MIN_RESPONSE_DELAY');
        $max = getenv('MAX_RESPONSE_DELAY');

        $minMs = ($min !== false && $min !== '') ? (int) $min : null;
        $maxMs = ($max !== false && $max !== '') ? (int) $max : null;

        if ($minMs === null && $maxMs === null) {
            return $request;
        }

        $randomizer = new \Random\Randomizer();

        if ($minMs !== null && $maxMs !== null) {
            $delay = $randomizer->getInt($minMs, $maxMs);
        } elseif ($maxMs !== null) {
            $delay = $randomizer->getInt(0, $maxMs);
        } else {
            $delay = $minMs;
        }

        usleep($delay * 1000);

        return $request;
    }
}
