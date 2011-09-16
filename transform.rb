#!/usr/bin/env ruby
# 
require 'matrix'

def transform(coords, a, b, c, d, e, f)
  matrix = Matrix[[a,c,e],[b,d,f],[0,0,1]]
  puts matrix.to_s
  points = coords.collect { |c| c.is_a?(Array) ? Matrix[[c[0]],[c[1]],[1]] : c }
  result = points.collect { |p| p.is_a?(Matrix) ? matrix * p : p}
  result.collect { |p| p.is_a?(Matrix) ? p.to_a.flatten[0..1] : p }
end

data = File.read('coords.txt').split(/\s/).collect { |c| 
  c =~ /,/ ? c.split(/,/).collect { |x| x.to_f } : c
}
result = transform(data,1.25,0,0,-1.25,0,360)
coords = result.collect { |d| Array(d).join(',') }.join(' ')
File.open('public/js/trail_path.js','w') { |f| f.write %{
  function drawTrail() {
    var pathInfo="m #{coords}";
    var paper = Raphael('overlay', $('#overlay').width(), $('#overlay').height());
    return paper.path(pathInfo).attr({stroke:'red'})
  }
}}

