FROM ghcr.io/amacneil/dbmate:2
WORKDIR /app
COPY ./migrations/ ./db/migrations
ENV DBMATE_NO_DUMP_SCHEMA=true
USER 1000:1000
CMD ["up"]
