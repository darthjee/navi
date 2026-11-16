# Versioning

[Engine Graceful Shutdown](../engine-shutdown.md)

The change is additive and not breaking, so `deku-swarm` gets a **minor** bump, `1.12.0` to `1.13.0`. It is done in #1009 with `bump_version.sh` (see [Release](../../release.md)).

#1010 adds no further bump if it lands before that version is released; otherwise it takes its own minor bump.
