/* global variables and knockout ViewModel */
var meetupapp = meetupapp || {};

/* initialize the ViewModel */
(function () {
  'use strict';

  var ViewModel = function () {

    var self = this;

    var EventListItem = function (name, id) {
      this.name = ko.observable(name);
      this.id = ko.observable(id);
      this.visible = ko.observable(false);
    };

    // Setup the filter options.
    self.dateFilterOptions = [{
      name: "1 day",
      days: 1
    }, {
      name: "2 days",
      days: 2
    }, {
      name: "3 days",
      days: 3
    }];

    self.rangeFilterOptions = [{
      name: "1 mile",
      miles: 1
    }, {
      name: "2 miles",
      miles: 2
    }, {
      name: "3 miles",
      miles: 3
    }, {
      name: "4 miles",
      miles: 4
    }, {
      name: "5 miles",
      miles: 5
    }, {
      name: "6 miles",
      miles: 6
    }, {
      name: "7 miles",
      miles: 7
    }];

    self.eventFilters = {
      dateFilter: ko.observable(meetupapp.dateFilter),
      rangeFilter: ko.observable(meetupapp.rangeFilter),
      locationFilter: ko.observable(meetupapp.locationFilter)
    };

    function createCategoryList(categories) {
      var categoryList = [{
        name: categories[0],
        selected: ko.observable(false)
      }];
      for (var i = 1; i < categories.length; i++) {
        if (categories[i] !== categoryList[categoryList.length - 1].name) {
          categoryList.push({
            name: categories[i],
            selected: ko.observable(false)
          });
        };
      };
      return categoryList;
    };

    function setLocationFilterCoords(location) {
      meetupapp.locationFilterCoords = location;
      meetupapp.setLocationFilterMarker(location);
    }

    self.applyEventFilters = function () {

      function applyDateFilter(event) {
        return event.time <= meetupapp.queryTime +
          (self.eventFilters.dateFilter() * 24 * 60 * 60 * 1000);
      }

      function applyRangeFilter(event) {
        // Avoid using Google Maps to calculate driving distance to each event destination. Instead, use an approximation for distance "as the bird flies" from http://www.movable-type.co.uk/scripts/latlong.html.
        var R = 6371e3; // meters
        var r = Math.PI / 180;
        var λ1 = meetupapp.locationFilterCoords.lng * r;
        var λ2 = event.venueCoords.lng * r;
        var φ1 = meetupapp.locationFilterCoords.lat * r;
        var φ2 = event.venueCoords.lat * r;
        var x = (λ2 - λ1) * Math.cos((φ1 + φ2) / 2);
        var y = (φ2 - φ1);
        var d = Math.sqrt(x * x + y * y) * R; // meters
        return (d * 0.000621371) < self.eventFilters.rangeFilter();
      }

      function applyCategoryFilter(event) {
        var pass = false;
        var selectionFound = false;
        for (var i = 0; i < self.categoryList.length; i++) {
          var category = self.categoryList[i];
          if (category.selected()) {
            selectionFound = true;
            if (category.name == event.groupCategory.toLowerCase()) {
              pass = true;
              break;
            };
          };
        };
        return (pass || !selectionFound);
      }

      meetupapp.events.forEach(function (event, index) {
        var dateFilterPass = applyDateFilter(event);
        var rangeFilterPass = applyRangeFilter(event);
        var categoryFilterPass = applyCategoryFilter(event);
        var show = dateFilterPass && rangeFilterPass && categoryFilterPass;
        self.eventList()[index].visible(show);
        meetupapp.showMarker(event.id, show);
      });
    };

    self.geocodeLocationFilter = function () {
      var geocoder = new google.maps.Geocoder();
      var address = self.eventFilters.locationFilter();
      // Make sure the address isn't blank.
      if (address) {
        // Geocode the address/area entered to get the center. Then, center the map
        // on it and zoom in
        geocoder.geocode({
          address: address,
          componentRestrictions: {
            locality: 'San Francisco'
          }
        }, function (results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            var location = {
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng()
            };
            setLocationFilterCoords(location);
            self.applyEventFilters();
          } else {
            window.alert('We could not find that location - try entering a more' +
              ' specific place.');
          }
        });
      } else {
        setLocationFilterCoords(meetupapp.sfCoords);
        self.applyEventFilters();
      };
    };

    // Setup the category filter list.
    self.categoryList = createCategoryList(meetupapp.categories);

    self.toggleCategoryListItem = function (data) {
      data.selected(!data.selected());
      self.applyEventFilters();
    };

    // Setup the sidebar event selection list.
    self.eventList = ko.observableArray([]);

    meetupapp.events.forEach(function (event) {
      self.eventList.push(new EventListItem(event.name, event.id));
    });

    self.selectEventListItem = function (data, event) {
      meetupapp.closeMenus();
      meetupapp.populateInfoWindow(
        meetupapp.markers[data.id()], meetupapp.events[data.id()], meetupapp.largeInfowindow);
    };

    self.applyEventFilters();

  }; // ViewModel

  meetupapp.dateFilter = 3;
  meetupapp.rangeFilter = 4;
  meetupapp.locationFilter = "";
  meetupapp.locationFilterCoords = meetupapp.sfCoords;

  var jqxhrMap = meetupapp.initMap()
    .fail(function () {
      alert("Problem encountered while downloading Google map.");
    });

  var jqxhrEvents = meetupapp.initEvents()
    .done(function () {
      meetupapp.setLocationFilterMarker(meetupapp.locationFilterCoords);
      meetupapp.initMarkers();
      ko.applyBindings(new ViewModel());
    })
    .fail(function () {
      alert("Problem encountered while downloading Meetup events.");
    });

})();
