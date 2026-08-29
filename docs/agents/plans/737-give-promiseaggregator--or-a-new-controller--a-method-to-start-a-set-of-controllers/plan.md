# Plan: Give PromiseAggregator (or a new controller) a method to start a set of controllers

Issue: [737-give-promiseaggregator--or-a-new-controller--a-method-to-start-a-set-of-controllers.md](../../issues/737-give-promiseaggregator--or-a-new-controller--a-method-to-start-a-set-of-controllers.md)

## Overview

Add a new `StartupCoordinator` collaborator that owns a `PromiseAggregator` internally and exposes `startAll(controllers)`/`wait()`, and use it in `ApplicationInstance.run()` instead of manually building/adding each controller's start promise by hand. This requires first aligning `EngineController` and `ServerController` on a uniform, argument-free `start()` contract.

See [engine.md](engine.md) for the full plan.
