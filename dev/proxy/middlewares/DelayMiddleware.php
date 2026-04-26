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
        if ($this->noDelay()) {
            return $request;
        }

        usleep($this->delayMs() * 1000);

        return $request;
    }

    private function envMs(string $name): ?int
    {
        $value = getenv($name);

        return ($value !== false && $value !== '') ? (int) $value : null;
    }

    private function noDelay(): bool
    {
        return $this->envMs('MIN_RESPONSE_DELAY') === null
            && $this->envMs('MAX_RESPONSE_DELAY') === null;
    }

    private function delayMs(): int
    {
        $minMs = $this->envMs('MIN_RESPONSE_DELAY');
        $maxMs = $this->envMs('MAX_RESPONSE_DELAY');

        $randomizer = new \Random\Randomizer();

        if ($minMs !== null && $maxMs !== null) {
            return $randomizer->getInt($minMs, $maxMs);
        }

        if ($maxMs !== null) {
            return $randomizer->getInt(0, $maxMs);
        }

        return $minMs;
    }
}
