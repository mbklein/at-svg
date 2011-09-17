Marker = (function($) {
  return function(controller,one_mile,margin) {
    var paper, objects;
        
    var createObjects = function(pos) {
      var y = controller.contourAt(pos).y - 40;
      var pathSpec = 'M'+pos+' '+(y-60)+'L'+pos+' '+y;
        objects.push(paper.text(pos, y, '☟')).attr({
          'font-size': '24pt', 
          'font-weight': 'normal',
          'fill': 'red', 
          'stroke-width': 0
        })
//      objects.push(paper.text(pos - 6, y, 'You are here!').attr({ 
//        'font-family': 'Helvetica Neue;Verdana;Lucida Sans;sans-serif',
//        'font-size': '10pt', 
//        'font-weight': 'normal',
//        'fill': 'red', 
//        'stroke-width': 0,
//        'rotation': 270,
//        'align': 'left'
//      }));
      return objects;
    }

    return {
      position: 0,
      objects: objects,

      initialize: function(mi) {
        paper = Raphael('overlay', $('#overlay').width(), $('#overlay').height());
        objects = paper.set();
        var pos = (one_mile * mi) + margin;
        this.objects = createObjects(pos);
        this.position = pos;
      },

      moveTo: function(mi) {
        var pos = (one_mile * mi) + margin;
        var startPoint = controller.contourAt(this.position).at;
        var endPoint = controller.contourAt(pos).at;
        var path = controller.contour.getSubpath(Math.min(startPoint, endPoint), Math.max(startPoint, endPoint));
        var ms = controller.scrollTo(mi);
        if (startPoint < endPoint) {
          objects.animateAlong(path, ms);
        } else {
          objects.animateAlongBack(path, ms);
        }
        this.position = pos;
      }
    }
  }
}(jQuery));