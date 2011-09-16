Marker = (function($) {
  return function(controller,one_mile,margin) {
    var paper, objects;
        
    var createObjects = function(pos) {
      var pathSpec = 'M'+pos+' 20L'+pos+' 310';
      objects.push(paper.path(pathSpec).attr( { stroke: '#FF0000' } ));
      objects.push(paper.text(pos - 6, 60, 'You are here!').attr({ 
        'font-family': 'Helvetica Neue;Verdana;Lucida Sans;sans-serif',
        'font-size': '10pt', 
        'font-weight': 'normal',
        'fill': 'red', 
        'stroke-width': 0,
        'rotation': 270 
      }));
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
        var delta = pos - this.position;
        var ms = controller.scrollTo(mi);
        objects.animate({ translation: [delta,0].join(',') }, ms, '>');
        this.position = pos;
      }
    }
  }
}(jQuery));