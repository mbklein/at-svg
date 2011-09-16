TrailController = (function($) {
  var margin, one_mile, center;
  
  $(document).ready(function() {
    margin = 24.1375;
    one_mile = 24.1375;
    center = $('#profile').width() / 2;
  });
  
  return {
    marker: null,
    markerText: null,
    easing: 'easeOutExpo',
    
    scrollTo: function(mi) {
      var newPos = ((mi * one_mile) + margin) - center;
      var currentPos = $('#profile').scrollLeft();
      var distance = Math.abs(newPos - currentPos);
      var time = Math.min((distance / one_mile) * 100, 5000);

      $('#profile').animate( { scrollLeft: newPos }, time, this.easing );
      return time;
    },
    
    scrollBy: function(delta) {
      var currentPos = $('#profile').scrollLeft() / one_mile;
      var mi = (currentPos + delta);
      return this.scrollTo(mi);
    },
    
    markerAt: function(mi) {
      var pos = (one_mile * mi) + margin;
      var pathSpec = 'M'+pos+' 20L'+pos+' 310';
      if (this.marker == null) {
        var c = Raphael('overlay', $('#overlay').width(), $('#overlay').height());
        this.marker = c.path(pathSpec).attr( { stroke: '#FF0000' } );
        this.markerText = c.text(pos - 6, 60, 'You are here!').attr({ 
          'font-family': 'Helvetica Neue;Verdana;Lucida Sans;sans-serif',
          'font-size': '10pt', 
          'font-weight': 'normal',
          'fill': 'red', 
          'stroke-width': 0,
          'rotation': 270 
        })
        this.scrollTo(mi);
      } else {
        var ms = this.scrollTo(mi);
        this.marker.animate({ path: pathSpec }, ms, '>');
        this.markerText.animateWith(this.marker, { x: pos - 6 }, ms, '>');
      }
    }
  };
}(jQuery))