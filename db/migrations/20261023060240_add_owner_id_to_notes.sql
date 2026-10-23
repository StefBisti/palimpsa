-- migrate:up
ALTER TABLE notes ADD COLUMN
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE;

-- migrate:down
ALTER TABLE notes DROP COLUMN owner_id;
