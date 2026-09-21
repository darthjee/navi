# Decisions

## Extract now, into a new package

Three approaches were considered:

- **A. New package (chosen).** A dedicated package for the shared logging code.
- **B. Put the code in `deku-swarm`.** Rejected: logging is an unrelated concern in a queue/worker package.
- **C. Keep both copies.** Rejected: the copies would stay manually synchronised, and the duplication (and the Codacy findings) would remain.

## Public on npm

`navi-hey-client` consumers install from the registry, where a `file:` dependency cannot resolve. A private registry would need credentials for every client user, and a `private: true` package (like `navi-spec-support`) would need bespoke bundling in the client's release.

## Name: `deku-sprout`

Unscoped, like `deku-swarm`. `deku-tree`, `sheikah` and `hylia` are taken on npm.

## `Logger` and `LoggerGroup` included

The four classes (`BaseLogger`, `ConsoleLogger`, `LoggerGroup`, `Logger`) only depend on each other, and having the client use the group-aware `Logger` removes all three duplicated files.

## `dev/app` is a consumer too

It only imports `Logger`, so it depends on the package instead of receiving the logging files through the `source/lib/common/` copy.

## The client gains a runtime dependency

`navi-hey-client` stops being self-contained. This is accepted as the price of removing the duplication.

## Owner and folder

A new `logger` agent, mirroring `worker`, owns `logger/`.

## `docs/agents/specs/` replaces `docs/agents/future/`

The folder is permanent and holds specs of not-yet-implemented work; only the `deku-sprout` specs inside it are temporary.
