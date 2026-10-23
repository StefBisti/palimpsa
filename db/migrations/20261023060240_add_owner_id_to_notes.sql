-- migrate:up
ALTER TABLE notes ADD COLUMN
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX notes_owner_id_idx ON notes (owner_id);

-- migrate:down
DROP INDEX notes_owner_id_idx;
ALTER TABLE notes DROP COLUMN owner_id;
