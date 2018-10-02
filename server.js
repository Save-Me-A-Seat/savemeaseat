`use strict`;

// Application dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');

// Application setup
require('dotenv').config();
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
const app = express();
const PORT = process.env.PORT || 3000;

// Allows us to use PUT and DELETE
app.use(bodyParser.urlencoded());
app.use(methodOverride(function (request, response) {
  if (request.body && typeof request.body === 'object' && '_method' in request.body) {
    let method = request.body._method;
    delete request.body._method;
    return method;
  }
}));

// Application middleware
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Proof of life
app.listen(PORT, () => console.log(`Listening on port: ${process.env.PORT}`));

app.get('/', searchOrSavedSeats);
app.get('/search', searchForArtist);
app.post('/add-saved-seats', addToSavedSeats);
app.get('*', (request, response) => response.status(404).send('This route does not exist'));



// Event constructor function
function Event(event) {
  this.month = event.datetime ? event.datetime.slice(5, 7) : 'Not available';
  this.day = event.datetime ? event.datetime.slice(8, 10) : 'Not available';
  this.year = event.datetime ? event.datetime.slice(0, 4) : 'Not available';
  this.hour = event.datetime ? (parseInt(event.datetime.slice(11, 13)) - 12).toString() : 'Not available';
  this.minute = event.datetime ? event.datetime.slice(14,16) : 'Not available';
  this.amOrPm = !event.datetime ? 'Not available' : parseInt(event.datetime.slice(11, 13)) < 12 ? 'AM' : 'PM';
  this.city = event.venue.city ? event.venue.city : 'Not available';
  this.state = event.venue.region ? event.venue.region : 'Not available';
  this.country = event.venue.country ? event.venue.country : 'Not available' ;
  this.venue = event.venue.name ? event.venue.name : 'Not available' ;
  this.lineup = event.lineup ? event.lineup.reduce((accumulator, currentValue) => accumulator + `, ${currentValue}`) : 'Not available';
  this.urlToBuyTickets = event.offers.length > 0 ? event.offers[0].url : 'Not available';
  this.ticketAvailability = event.offers.length > 0 && event.offers[0].status === 'available' ? true : false;
}

// HELPER FUNCTIONS!!!!

// Renders homepage depending on if saved seats is empty
function searchOrSavedSeats(request, response) {
  const SQL = 'SELECT * FROM events;';
  return client.query(SQL)
    .then(seatCheck => {
      if (seatCheck.rowCount > 0) {
        response.redirect('pages/saved-seats')
      } else {
        response.render('pages/index')
      }
    })
}

// Searches for the artist
function searchForArtist(request, response) {
  const url = `https://rest.bandsintown.com/artists/${request.query.search}/events?app_id=${process.env.BANDS_IN_TOWN_KEY}&date=upcoming`;

  superagent.get(url)
    .then(upcomingEvents => upcomingEvents.body.map(event => new Event(event)))
    .then(eventList => response.render('pages/index', { eventList: eventList }))
    .catch(error => handleError(error, response));
}

// Error handling
const handleError = (error, response) => console.log(error);

function addToSavedSeats(request, response) {
  let {month, day, year, hour, minute, am_pm, city, state, country, venue, lineup, url, ticket_available} = request.body;

  const SQL = 'INSERT INTO events (month, day, year, hour, minute, am_pm, city, state, country, venue, lineup, url, ticket_available) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);';
  const values = [month, day, year, hour, minute, am_pm, city, state, country, venue, lineup, url, ticket_available];

  client.query(SQL, values)
    .then(() => response.redirect('/saved-seats/'))
    .catch(error => handleError(error, response));
}
