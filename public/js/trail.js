$tc = (function($) {
  var margin, one_mile, center;
  var stuff = {};
  
  var getHashAsNumber = function() {
    var hash = document.location.hash;
    if (hash != "") {
      var loc = Number(hash.substring(1,hash.length));
      if (loc != NaN) {
        return loc;
      } else {
        return null;
      }
    } else {
      return null;
    }
  };
    
  var $t = {
    easing: 'easeOutExpo',
    stuff: stuff,
    
    initialize: function() {
      margin = 24.1375;
      one_mile = 24.1375;
      this.viewport = $('#profile');
      this.center = center = $('#profile').width() / 2;
      this.paper = Raphael('overlay', $('#overlay').width(), $('#overlay').height());
      stuff.waypoints = this.paper.set();
      
      this.drawMiles();
      
      $.get('/path_info/Shaded_Profile').success(function(data) { 
        stuff.profile = $tc.paper.path(data[0]).translate(0,-1).attr({ 'fill' : '#e1a51b' });
      });

      $.get('/path_info/Simplified_Path').success(function(data) { 
        stuff.contour = $tc.paper.set();
        $.each(data,function(i) { stuff.contour.push($tc.paper.path(data[i]).attr({ 'stroke' : 'none' }).translate(0,20)) });
        // .translate(0,20);
        stuff.marker = marker = new Marker($t, one_mile, margin);
        var loc = getHashAsNumber();
        if (loc == null) {
          loc = $.cookie('trail-location') || 0;
        }
        stuff.marker.initialize(loc);
        $(profile).scrollLeft($t.milesToPixels(stuff.marker.position) - center);
      });
      
      $(window).hashchange(function() {
        $t.position(getHashAsNumber());
      });

      setTimeout(function() {
        $('#container').animate({'opacity':1},2000);
        $('#overlay').animate({opacity:1},2500);
      },2000);
    },
    
    background: function() {
      var result = this.paper.set();
      result.push(stuff.profile);
      result.push(stuff.contour);
      result.push(stuff.waypoints);
      result.push(stuff.grid);
      return result;
    },
    
    drawMiles: function() {
      var p = this.paper;
      var g = stuff.grid = p.set();
      g.push(p.rect(0,20,$('#overlay').width(),290));
      for (var i = 0; i < 2200; i += 1) { 
        var xPos = (i*one_mile)+margin;
        if (i % 5 == 0) {
          g.push(p.text(xPos,320,i).attr({ 'font-size': '12pt', stroke: 'none', fill: 'black' }));
          g.push(p.path('M'+xPos+' 20L'+xPos+' 25').attr({ stroke: 'black' }))
        } else {
          g.push(p.path('M'+xPos+' 20L'+xPos+' 22').attr({ stroke: 'black' }))
        }
      }
    },
    
    drawWaypoint: function(mi, text, color) {
      if (color == null) { color = 'black' }
      var p = this.contourAtMile(mi);
      var m = this.paper.set();
      m.push(this.paper.path("M"+p.x+" "+p.y+"L"+p.x+" "+(p.y-15)).attr({ stroke: 'black', 'stroke-weight': '1pt' }));
      m.push(this.paper.text(p.x, p.y-20, text).attr({'text-anchor':'start',fill: color,stroke: 'none'}).rotate(270,p.x,p.y-20));
      stuff.waypoints.push(m);
      return m
    },
    
    milesToPixels: function(mi) {
      return (one_mile * mi) + margin;
    },
    
    contourAt: function(pos) {
      var tries = 0;
      var report = function(iter,x,p,d) {
        //console.debug(iter + ': Test value '+x+' found point at '+p+' when looking for '+d+'. ('+(p/d*100)+'%)')
      }
      var px = pos + margin;
      
      var pathIndex = 0;
      var path = null;
      var zero;
      for (pathIndex; pathIndex < stuff.contour.items.length; pathIndex++) {
//        console.debug("Checking path "+pathIndex)
        var tp = stuff.contour.items[pathIndex].attr('path');
        if (tp[0][1] <= px && tp[tp.length-1][1] >= px) {
          path = stuff.contour.items[pathIndex];
          zero = (tp[0][1]);
          break;
        }
      }
      if (path == null) {
        return;
      }
      
      var testX = Math.max(px - margin,margin);
      var result = path.getPointAtLength(testX);
      var delta = testX * (result.x / px)
      report(delta,testX,result.x,px);
      while (delta > 2) {
        while ( px > result.x ) { report(delta,testX,result.x,px); testX += delta; result = path.getPointAtLength(testX) }
        delta /= 2
        while ( px < result.x ) { report(delta,testX,result.x,px); testX -= delta; result = path.getPointAtLength(testX) }
        delta /= 2
      }

      result.x = px
      result.at = testX;
      result.path = path;
      result.pathIndex = pathIndex;
//      console.debug(result.x/px)
      return result;
    },

    contourAtMile: function(mi) {
      var result = this.contourAt(one_mile * mi);
      if (result == null) { console.warn("Warning: null contour at "+mi) }
      return result;
    },
    
    getSubContour: function(x1,x2) {
      var lcp = this.contourAtMile(Math.min(x1,x2));
      var rcp = this.contourAtMile(Math.max(x1,x2));
      var result;
      if (lcp.pathIndex == rcp.pathIndex) {
        result = lcp.path.getSubpath(lcp.at,rcp.at);
      } else {
        var result = lcp.path.getSubpath(lcp.at,lcp.path.getTotalLength());
        var i = lcp.pathIndex + 1;
        while (i < rcp.pathIndex) {
          var mp = this.contour.items[i];
          $.each(mp.attr('path'), function(pi) { 
            if (pi[0] != 'M') {
              result += pi.join(',');
            } 
          })
        }
        result += rcp.path.getSubpath(0,rcp.at).replace(/^M\s*[0-9.,]+/,'')
      }
      return this.paper.path(result).attr({stroke:'none'});
    },
    
    position: function(mi) { 
      if (mi == null) {
        return stuff.marker.position;
      } else {
        if (mi.toString().match(/^[+-]/)) {
          mi = this.position() + Number(mi);
        }
        stuff.marker.moveTo(mi);
        $.cookie('trail-location', mi, { expires: 365 });
        return mi;
      }
    },
    
    scrollPos: function(mi) {
      var absPos = ((mi * one_mile) + margin) - center;
      return absPos;
//      return Math.max(Math.min(absPos,center),$('#profile').width()-center);
    },
    
    scrollTo: function(mi, callback) {
      var newPos = this.scrollPos(mi);
      var currentPos = $('#profile').scrollLeft();
      var distance = Math.abs(newPos - currentPos);
      var time = Math.min((distance / one_mile) * 100, 5000);
      currentMileage = mi;
      
      var cbCalled = false;
      var cb = callback ? function() { if (!cbCalled) { cbCalled = true; callback(); }} : null;
      $('#profile').animate( { scrollLeft: newPos }, time, $t.easing, cb );
      return time;
    },
    
    scrollBy: function(delta, callback) {
      var currentPos = $('#profile').scrollLeft() / one_mile;
      var mi = (currentPos + delta);
      return $t.scrollTo(mi, callback);
    },
    
    rectify: function(shape, callback) {
      shape.scale(6.262,6.262,24.1375,145.013)
      if (typeof callback == 'function') {
        callback(shape);
      }
      // console.debug(shape.attr('path').map(function(n) { return n.join(' ') }).join(''))
    }
  };
  return $t;
}(jQuery));

$(window).load(function() {
  $tc.initialize();
});
