<?php

namespace Dev\Proxy\Middlewares;

use Tent\Middlewares\Middleware;
use Tent\Models\Response;

class DelayMiddleware extends Middleware
{


    /**
     * Builds a new DelayMiddleware instance.
     *
     * @param array $_attributes Rule attributes (unused; required by the
     *                           abstract Middleware::build() signature).
     *
     * @return self
     */
    public static function build(array $_attributes): self
    {
        return new self();

    }//end build()


    /**
     * Delays the response by a random amount of milliseconds, when
     * MIN_RESPONSE_DELAY and/or MAX_RESPONSE_DELAY are configured.
     *
     * @param \Tent\Models\Response $response The response being processed.
     *
     * @return \Tent\Models\Response
     */
    public function processResponse(Response $response): Response
    {
        if ($this->noDelay() === true) {
            return $response;
        }

        usleep($this->delayMs() * 1000);

        return $response;

    }//end processResponse()


    /**
     * Reads an environment variable as an integer number of milliseconds.
     *
     * @param string $name The environment variable name.
     *
     * @return integer|null
     */
    private function envMs(string $name): ?int
    {
        $value = getenv($name);

        if ($value !== false && $value !== '') {
            return (int) $value;
        }

        return null;

    }//end envMs()


    /**
     * Whether no delay is configured at all.
     *
     * @return boolean
     */
    private function noDelay(): bool
    {
        return $this->envMs('MIN_RESPONSE_DELAY') === null
            && $this->envMs('MAX_RESPONSE_DELAY') === null;

    }//end noDelay()


    /**
     * Computes the delay, in milliseconds, to apply to the response.
     *
     * @return integer
     */
    private function delayMs(): int
    {
        $minMs = ($this->envMs('MIN_RESPONSE_DELAY') ?? 0);
        $maxMs = ($this->envMs('MAX_RESPONSE_DELAY') ?? $minMs);

        if ($minMs === $maxMs) {
            return $minMs;
        }

        return (new \Random\Randomizer())->getInt($minMs, $maxMs);

    }//end delayMs()


}//end class
