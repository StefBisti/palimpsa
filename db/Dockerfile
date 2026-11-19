# syntax=docker/dockerfile:1
# check=error=true
FROM ghcr.io/amacneil/dbmate:2@sha256:b0c8a87bfef4f2819fdb0a68ca357a44d12fb90d23eca695fcfc3b7e159cb1c5
RUN apk upgrade --no-cache
WORKDIR /app
COPY ./migrations/ ./db/migrations
ENV DBMATE_NO_DUMP_SCHEMA=true
USER 1000:1000
LABEL org.opencontainers.image.source="https://github.com/stefbisti/palimpsa"
CMD ["up"]
