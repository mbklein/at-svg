Marker = (function($) {
  return function(controller,one_mile,margin) {
    var paper, hiker;

    var $a = { 
      spriteOrder: [0,1,2,1],
      direction: 'R', 
      index: 0,
      lastUpdate: new Date(),
      
      createObjects: function(x,y) {
        hiker && hiker.remove();
        hiker = paper.image('/img/hiker-R1.png', x-16, y-25, 32, 32);
        hiker.onAnimation(function() {
          var s = $a.nextSprite();
          s && hiker.attr({ src: s })
        });
        $a.peek();
        return hiker;
      },
      
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
      },
      
      peekTimeout: null,
      peek: function() {
        $a.peekTimeout = setTimeout(function() {
          var face = ['F','F','B'][Math.round(Math.random()*2)];
          hiker.attr({ src: '/img/hiker-'+face+'1.png' });
          $a.peekTimeout = setTimeout(function() {
            $a.end();
          }, (Math.random() * 4000)+1);
        }, (Math.random() * 15000)+2);
      },
      
      start: function(dir) {
        clearTimeout($a.peekTimeout);
        $a.direction = dir;
        hiker.attr({ src: $a.nextSprite() });
      },
      
      end: function() {
        hiker.attr({ src: '/img/hiker-R1.png' });
        $a.peek();
      }
    }

    return $m = {
      position: 0,
      speed: 250,
      
      initialize: function(mi) {
        paper = Raphael('overlay', $('#overlay').width(), $('#overlay').height());
        this.position = mi;
        this.reinitialize();
      },
      
      reinitialize: function() {
        this.contourPos = controller.contourAtMile(this.position);
        this.hiker = $a.createObjects(this.contourPos.x,this.contourPos.y);
      },

      moveTo: function(mi) {
        var x1 = Math.min(this.position,mi),
            x2 = Math.max(this.position,mi),
            px1 = controller.milesToPixels(x1),
            px2 = controller.milesToPixels(x2),
            dx = x2-x1;
            
        var pos = this.position;
        var aniFunc = pos < mi ? hiker.animateAlong : hiker.animateAlongBack;
        $a.start(pos > mi ? 'L' : 'R');
        if (px2 - px1 < controller.viewport.width()) {
          // Less than one screen? Just center it and go.
          var path = controller.getSubContour(x1,x2);
          controller.scrollTo((x1+x2)/2, function() {
            aniFunc.call(hiker,path,$m.speed*dx,false, function() { $a.end() });
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
            aniFunc = hiker.animateAlong;
            var ps = path2.attr('path');
            pInfo = { paths: [path1,path2], sPos: x2, mPos: ps[0] }
          } else {
            aniFunc = hiker.animateAlongBack;
            var ps = path1.attr('path');
            pInfo = { paths: [path2,path1], sPos: x1, mPos: ps[ps.length-1] }
          }
          aniFunc.call(hiker,pInfo.paths[0],$m.speed*40,false,function() { 
            controller.scrollTo(pInfo.sPos, function() {
              hiker.attr({ x: pInfo.mPos[1]-16, y: pInfo.mPos[2]-25});
              aniFunc.call(hiker,pInfo.paths[1],$m.speed*40,false,function() { $a.end() });
            });
          });
        }
        this.position = mi
      }
    }
  }
}(jQuery));