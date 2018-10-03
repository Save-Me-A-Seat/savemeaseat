CREATE TABLE IF NOT EXISTS events (
id SERIAL PRIMARY KEY,
month VARCHAR(255),
day VARCHAR(255),
year VARCHAR(255),
hour VARCHAR(255),
minute VARCHAR(255),
am_pm VARCHAR(255),
city VARCHAR(255),
state VARCHAR(255),
country VARCHAR(255),
venue VARCHAR(255),
lineup VARCHAR(255),
url text,
ticket_available BOOLEAN
);