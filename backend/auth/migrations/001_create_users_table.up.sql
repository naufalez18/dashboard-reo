CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer'
);

INSERT INTO users (username, password_hash, role) VALUES
  ('naufalez', '$2a$10$LoUtz8Y6SBNNFr8GI1IVCejq8d5DGl08wmbvX4p5aBQQl2gMO0Dwe', 'admin'),
  ('reodept', '$2a$10$KfPfzAiP0abBnIleh4cW5.Jy4MM.p2IuQ.nXAoK384GSy/ufmlPxy', 'viewer');
