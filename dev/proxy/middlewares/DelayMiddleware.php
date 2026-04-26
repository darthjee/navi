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
        $minMs = $this->envMs('MIN_RESPONSE_DELAY') ?? 0;
        $maxMs = $this->envMs('MAX_RESPONSE_DELAY') ?? $minMs;

        if ($minMs === $maxMs) {
            return $minMs;
        }

        return (new \Random\Randomizer())->getInt($minMs, $maxMs);
    }
}
