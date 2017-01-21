/* global model in MVVM structure */

var meetupapp = meetupapp || {};

(function () {
  'use strict';

  // App constants
  meetupapp.sfCoords = {
    lat: 37.76,
    lng: -122.44
  };
  meetupapp.zoomIn = 13;
  meetupapp.zoomOut = 12;
  meetupapp.queryTime = Date.now();

  meetupapp.initEvents = function () {

    function findUniqueCategories(categories) {
      categories.sort();
      var uniqueCategories = [categories[0]];
      for (var i = 1; i < categories.length; i++) {
        if (categories[i] !== uniqueCategories[uniqueCategories.length - 1]) {
          uniqueCategories.push(categories[i]);
        }
      }
      return uniqueCategories;
    }

    // Use a signed query (signed with both my Meetup API key and Meetup's key)
    // to request event data. This keeps my Meetup API key private, to prevent
    // someone from accessing my personal Meetup groups and act on my behalf.
    var signedEventQuery3Days =
      "https://api.meetup.com/2/open_events?callback=?&and_text=False&offset=0&format=json&lon=-122.44&limited_events=False&photo-host=public&page=200&time=%2C3d&radius=4&fields=group_photo%2Ccategory&lat=37.77&order=distance&desc=False&status=upcoming&sig_id=14614002&sig=8f79ee3b6ecb826b867d07b84e8399d51d01d430";
    var jqxhr = $.getJSON(signedEventQuery3Days, function (json) {
      meetupapp.events = [];
      meetupapp.categories = [];
      var categories = [];

      // Use the json results to create arrays of events and markers on initialize.
      for (var i = 0; i < json.results.length; i++) {

        var eventData = json.results[i];

        // Only save events that have a designated venue address.
        if (eventData.venue) {
          var event = {
            name: eventData.name,
            groupName: eventData.group.name,
            groupCategory: eventData.group.category.name,
            group_photo:
              (eventData.group.group_photo) ? eventData.group.group_photo.thumb_link : "https://a248.e.akamai.net/secure.meetupstatic.com/photos/event/8/f/1/d/highres_454596637.jpeg",
            time: eventData.time,
            yes_rsvp_count: eventData.yes_rsvp_count,
            venueName: eventData.venue.name,
            venueAddress: eventData.venue.address_1,
            venueCoords: {
              lat: eventData.venue.lat,
              lng: eventData.venue.lon
            },
            event_url: eventData.event_url,
            id: meetupapp.events.length
          };
          // Push the event data and categories to our arrays.
          meetupapp.events.push(event);
          categories.push(eventData.group.category.name.toLowerCase());
        };

      };
      meetupapp.categories = findUniqueCategories(categories);
    });
    return jqxhr;
  };

})();
