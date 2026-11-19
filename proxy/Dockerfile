# syntax=docker/dockerfile:1
# check=error=true

FROM caddy:2-alpine@sha256:003a97808e781aa9f7e75cc2f43d34d461099031faf5e20faefb9f61126836f0
RUN apk upgrade --no-cache \
  # the binary can bind ports < 1024 through a file capability; we listen on 8080 and drop
  # all capabilities, and a binary with a capability outside the allowed set fails to start
  && setcap -r /usr/bin/caddy \
  && chown 1000:1000 /data /config
COPY Caddyfile /etc/caddy/Caddyfile
USER 1000:1000
LABEL org.opencontainers.image.source="https://github.com/stefbisti/palimpsa"
