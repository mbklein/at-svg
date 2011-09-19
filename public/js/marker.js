Marker = (function($) {
  return function(controller,one_mile,margin) {
    var paper, objects;
        
    var createObjects = function(x,y) {
      $.each(objects.items, function(i) { objects.items[i].remove() });
      var pathSpec = 'M'+x+' '+(y)+'L'+x+' '+y;
      objects.push(paper.text(x, y-15, '☟')).attr({
        'font-size': '24pt', 
        'font-weight': 'normal',
        'fill': 'red', 
        'stroke-width': 0
      });
      return objects;
    }

    return {
      position: 0,
      objects: objects,

      initialize: function(mi) {
        paper = Raphael('overlay', $('#overlay').width(), $('#overlay').height());
        objects = paper.set();
        this.contourPos = controller.contourAtMile(mi);
//        console.debug(mi + ' : ' + this.contourPos.x);
        this.objects = createObjects(this.contourPos.x,this.contourPos.y);
        this.position = mi;
      },

      moveTo: function(mi) {
        var x1 = Math.min(this.position,mi),
            x2 = Math.max(this.position,mi),
            px1 = controller.milesToPixels(x1),
            px2 = controller.milesToPixels(x2);
            
        var pos = this.position;
        if (px2 - px1 < controller.viewport.width()) {
          // Less than one screen? Just center it and go.
          var path = controller.getSubContour(x1,x2);
          console.dir(path);
          controller.scrollTo((x1+x2)/2, function() {
            if (pos < mi) {
              objects.animateAlong(path,5000, function() { path.remove() });
            } else {
              objects.animateAlongBack(path,5000, function() { path.remove() });
            }
          });
        } else {
          // Otherwise, use one path to get us off the screen, and another to reenter
          var path1 = controller.getSubContour(x1, x1+40);
          var path2 = controller.getSubContour(x2-40, x2);
          if (pos < mi) {
            objects.animateAlong(path1,5000,function() { 
              controller.scrollTo(x2, function() {
                var node = path2.attr('path')[0];
                createObjects(node[1],node[2]);
                objects.animateAlong(path2,5000,function() {
                  setTimeout(function() { 
                    path1.remove();
                    path2.remove();
                  }, 10000);
                })
              });
            });
          } else {
            objects.animateAlongBack(path2,5000,function() { 
              controller.scrollTo(x1, function() {
                var path = path1.attr('path');
                var node = path[path.length-1];
                createObjects(node[1],node[2]);
                objects.animateAlongBack(path1,5000,function() {
                  setTimeout(function() { 
                    path1.remove();
                    path2.remove();
                  }, 10000);
                })
              });
            });
          }
        }
        
        this.position = mi;
      }
    }
  }
}(jQuery));