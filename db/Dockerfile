# syntax=docker/dockerfile:1
# check=error=true
FROM ghcr.io/amacneil/dbmate:2@sha256:fb4fe7cabfe98cf864d63ce083867f3c303a8c1a022fcd69081439425706e909
RUN apk upgrade --no-cache
WORKDIR /app
COPY ./migrations/ ./db/migrations
ENV DBMATE_NO_DUMP_SCHEMA=true
USER 1000:1000
LABEL org.opencontainers.image.source="https://github.com/stefbisti/palimpsa"
CMD ["up"]
