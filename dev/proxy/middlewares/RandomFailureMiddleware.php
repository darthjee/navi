<?php

namespace Dev\Proxy\Middlewares;

use Tent\Middlewares\Middleware;
use Tent\Models\ProcessingRequest;
use Tent\Models\Response;

class RandomFailureMiddleware extends Middleware
{


    /**
     * Builds a new RandomFailureMiddleware instance.
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
     * Randomly short-circuits the request with a 502 response, at the rate
     * configured via the FAILURE_RATE environment variable.
     *
     * @param \Tent\Models\ProcessingRequest $request The request being processed.
     *
     * @return \Tent\Models\ProcessingRequest
     */
    public function processRequest(ProcessingRequest $request): ProcessingRequest
    {
        $value = getenv('FAILURE_RATE');

        if ($value === false || $value === '') {
            $value = 0;
        }

        $rate = (float) $value;

        $randomizer = new \Random\Randomizer();

        if ($rate > 0 && $randomizer->getFloat(0, 1) < $rate) {
            $response = new Response([
                'httpCode' => 502,
                'body'     => 'Bad Gateway'
            ]);
            $request->setResponse($response);
        }

        return $request;

    }//end processRequest()


}//end class
