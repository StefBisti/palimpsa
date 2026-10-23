-- migrate:up
CREATE TABLE note_members (
  note_id   uuid   REFERENCES notes ON DELETE CASCADE,
  user_id   uuid   REFERENCES users ON DELETE CASCADE,
  role      text   NOT NULL CHECK (role IN ('editor','viewer')),
  PRIMARY KEY (note_id, user_id)
);

CREATE INDEX note_members_user_id_idx ON note_members (user_id);

-- migrate:down
DROP TABLE note_members;
