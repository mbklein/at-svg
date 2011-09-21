Marker = (function($) {
  return function(controller,one_mile,margin) {
    var paper, objects;
    var animating = { 
      spriteOrder: [0,1,2,1],
      direction: 'R', 
      index: 0,
      lastUpdate: new Date(),
      nextSprite: function() {
        var t = new Date();
        if ((t - this.lastUpdate) > 75) {
          this.lastUpdate = t;
          this.index += 1;
          (this.index == this.spriteOrder.length) && (this.index = 0);
          return '/img/hiker-'+this.direction+this.spriteOrder[this.index]+'.png';
        } else {
          return false;
        }
      }
    }

    var createObjects = function(x,y) {
      objects && objects.remove();
      var pathSpec = 'M'+x+' '+(y)+'L'+x+' '+y;
      objects = paper.image('/img/hiker-F1.png', x-16, y-15, 32, 32);
      objects.onAnimation(function() {
        var s = animating.nextSprite();
        s && objects.attr({ src: s })
      });
      return objects;
    }

    return $m = {
      position: 0,
      objects: objects,
      speed: 250,
      
      initialize: function(mi) {
        paper = Raphael('overlay', $('#overlay').width(), $('#overlay').height());
        this.position = mi;
        this.reinitialize();
      },
      
      reinitialize: function() {
        this.contourPos = controller.contourAtMile(this.position);
        this.objects = createObjects(this.contourPos.x,this.contourPos.y);
      },

      moveTo: function(mi) {
        var x1 = Math.min(this.position,mi),
            x2 = Math.max(this.position,mi),
            px1 = controller.milesToPixels(x1),
            px2 = controller.milesToPixels(x2),
            dx = x2-x1;
            
        var pos = this.position;
        var aniFunc = pos < mi ? objects.animateAlong : objects.animateAlongBack;
        animating.direction = pos > mi ? 'L' : 'R';
        objects.attr({ src: animating.nextSprite() });
        if (px2 - px1 < controller.viewport.width()) {
          // Less than one screen? Just center it and go.
          var path = controller.getSubContour(x1,x2);
          controller.scrollTo((x1+x2)/2, function() {
            aniFunc.call(objects,path,$m.speed*dx,false, function() {objects.attr({ src: '/img/hiker-F1.png' })});
          });
        } else {
          // Otherwise, use one path to get us off the screen, and another to reenter
          var e1 = x1+40, s2 = x2-40;
          if (s2 < e1) {
            e1 = s2 = ((e1+s2)/2);
          }
          
          var path1 = controller.getSubContour(x1, e1);
          var path2 = controller.getSubContour(s2, x2);
          var pInfo;
          if (pos < mi) {
            aniFunc = objects.animateAlong;
            var ps = path2.attr('path');
            pInfo = { paths: [path1,path2], sPos: x2, mPos: ps[0] }
          } else {
            aniFunc = objects.animateAlongBack;
            var ps = path1.attr('path');
            pInfo = { paths: [path2,path1], sPos: x1, mPos: ps[ps.length-1] }
          }
          aniFunc.call(objects,pInfo.paths[0],$m.speed*40,false,function() { 
            controller.scrollTo(pInfo.sPos, function() {
              objects.attr({ x: pInfo.mPos[1]-16, y: pInfo.mPos[2]-15});
              aniFunc.call(objects,pInfo.paths[1],$m.speed*40,false,function() { objects.attr({ src: '/img/hiker-F1.png' }) });
            });
          });
        }
        this.position = mi
      }
    }
  }
}(jQuery));