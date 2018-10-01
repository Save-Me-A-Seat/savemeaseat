CREATE TABLE IF NOT EXISTS events (
id SERIAL PRIMARY KEY,
month VARCHAR(2),
day VARCHAR(2),
year VARCHAR(4),
hour VARCHAR(2),
minute VARCHAR(2),
am_pm VARCHAR(2),
city VARCHAR(255),
state VARCHAR(255),
country VARCHAR(255),
venue VARCHAR(255),
lineup VARCHAR(255),
url text,
ticket_available BOOLEAN
);