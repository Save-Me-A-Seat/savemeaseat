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
app.use(bodyParser.urlencoded({ extended: true }));
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

app.get('/index', goToMainPage);
app.get('/saved-seats', goToSavedSeatsPage);
app.get('/about-us', goToAboutPage);

app.get('/', searchOrSavedSeats);
app.get('/search', searchForArtist);
app.post('/add-saved-seats', addToSavedSeats);
app.delete('/delete/:id', deleteFromDatabase);
app.get('*', (request, response) => response.status(404).send('This route does not exist'));

// Proof of life
app.listen(PORT, () => console.log(`Listening on port: ${process.env.PORT}`));

// Constructor function to pass API data through
function Event(event) {
  this.artistName = event.lineup ? event.lineup[0] : 'Not available';
  this.month = event.datetime ? numberToMonth(event.datetime.slice(5, 7)) : 'Not available';
  this.day = event.datetime ? event.datetime.slice(8, 10) : 'Not available';
  this.year = event.datetime ? event.datetime.slice(0, 4) : 'Not available';
  this.hour = event.datetime ? formatHour(event.datetime) : 'Not available';
  this.minute = event.datetime ? event.datetime.slice(14,16) : 'Not available';
  this.amOrPm = !event.datetime ? 'Not available' : parseInt(event.datetime.slice(11, 13)) < 12 ? 'AM' : 'PM';
  this.city = event.venue.city ? event.venue.city : 'Not available';
  this.state = event.venue.region ? ' ' + event.venue.region : '';
  this.country = event.venue.country ? event.venue.country : 'Not available' ;
  this.venue = event.venue.name ? event.venue.name : 'Not available' ;
  this.lineup = event.lineup ? event.lineup.reduce((accumulator, currentValue) => accumulator + `, ${currentValue}`) : 'Not available';
  this.urlToBuyTickets = event.offers.length > 0 ? event.offers[0].url : 'Not available';
  this.ticketAvailability = event.offers.length > 0 && event.offers[0].status === 'available' ? true : false;
}

// Constructor function to pass database data through
function FromDatabase(event) {

  this.artistName = event.artistname;
  this.id = event.id;
  this.month = event.month;
  this.day = event.day;
  this.year = event.year;
  this.hour = event.hour;
  this.minute = event.minute;
  this.am_pm = event.am_pm;
  this.city = event.city;
  this.state = event.state;
  this.country = event.country;
  this.venue = event.venue;
  this.lineup = event.lineup;
  this.urlToBuyTickets = event.url;
  this.ticketAvailability = event.ticket_available;
}

// HELPER FUNCTIONS!!!!

// Renders homepage depending on if saved seats is empty
function searchOrSavedSeats(request, response) {
  const SQL = 'SELECT * FROM events;';
  return client.query(SQL)
    .then(seatCheck => {
      if (seatCheck.rowCount > 0) {
        const eventList = seatCheck.rows.map(event => new FromDatabase(event))
        response.render('pages/saved-seats', {eventList: eventList});
      } else {
        response.render('pages/index', { eventList: [] })
      }
    })
}

function showSavedSeats(request, response) {
  const SQL = 'SELECT * FROM events;';
  return client.query(SQL)
    .then(seatCheck => {
      if (seatCheck.rowCount > 0) {
        const eventList = seatCheck.rows.map(event => new FromDatabase(event))
        response.render('pages/saved-seats', {eventList: eventList});
      } else {
        const eventList = 'You have no saved seats';
        response.render('pages/saved-seats', { eventList: eventList });
      }
    })
}

// Searches for the artist
function searchForArtist(request, response) {
  const url = `https://rest.bandsintown.com/artists/${request.query.search.trim()}/events?app_id=${process.env.BANDS_IN_TOWN_KEY}&date=upcoming`;

  superagent.get(url)
    .then(upcomingEvents => upcomingEvents.body.map(event => new Event(event)))
    .then(eventList => {
      if (eventList.length > 0)
      {
        response.render('pages/index', { eventList: eventList })
      }
      else
      {
        response.render('pages/index', { eventList: `There are no available seats for '${request.query.search}'` })
      }
    })
    .catch(error => {
      response.render('pages/index', { eventList: `There are no results for '${request.query.search}'` })
      handleError(error, response)
    });
}

// Error handling
const handleError = (error, response) => console.log(error);

function addToSavedSeats(request, response) {

  let {artistName, month, day, year, hour, minute, am_pm, city, state, country, venue, lineup, url, ticket_available} = request.body;

  const SQL = 'INSERT INTO events (artistName, month, day, year, hour, minute, am_pm, city, state, country, venue, lineup, url, ticket_available) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);';
  const values = [artistName, month, day, year, hour, minute, am_pm, city, state, country, venue, lineup, url, ticket_available];

  client.query(SQL, values)
    .then(() => response.redirect('/saved-seats'))
    .catch(error => handleError(error, response));
}

// Deletes an event from the database
function deleteFromDatabase(request, response) {

  const SQL = 'DELETE FROM events WHERE id=$1;';
  const value = [request.params.id];
  client.query(SQL, value)
    .then(response.redirect('/saved-seats'))
    .catch(error => handleError(error, response));
}

function formatHour(hour) {
  const hourAsANumber = hour.slice(11, 13);
  if (hourAsANumber > 13) {
    const newHour = hourAsANumber - 12;
    return newHour.toString();
  } else {
    return hour.slice(11, 13);
  }
}

//----------------------------------------------------------------
//    pages menu functions
//----------------------------------------------------------------

// main page
function goToMainPage(request, response)
{
  response.render('pages/index', { eventList: [] });
}

// saved seats page
function goToSavedSeatsPage(request, response)
{
  showSavedSeats(request, response);
}

// about page
function goToAboutPage(request, response)
{
  response.render('pages/about-us');
}

//----------------------------------------------------------------
//    function to convert number to month
//----------------------------------------------------------------
function numberToMonth(monthNumber)
{
  switch (monthNumber)
  {
  case '1':
    return 'January';
  case '2':
    return 'February';
  case '3':
    return 'March';
  case '4':
    return 'April';
  case '5':
    return 'May';
  case '6':
    return 'June';
  case '7':
    return 'July';
  case '8':
    return 'August';
  case '9':
    return 'September';
  case '10':
    return 'October';
  case '11':
    return 'November';
  case '12':
    return 'December';
  default:
    return 'December';
  }
}
