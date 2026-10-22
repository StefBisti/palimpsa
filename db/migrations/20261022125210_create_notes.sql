-- migrate:up
CREATE TABLE notes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text        NOT NULL DEFAULT '',
  ydoc       bytea,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- migrate:down
DROP TABLE notes;
