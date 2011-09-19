#!/usr/bin/env ruby

require 'rubygems'
require 'sinatra'
require 'nokogiri'
require 'json'

# Image center is @ 484px
# Zero point is @ 24.14px
# 1 mi = 24.14px
# $('#profile').animate({ scrollLeft:  })

class TrailApp < Sinatra::Application
  
  @@svg = nil
  
  helpers do
    def doc
      svg_file = File.expand_path('../public/svg/at.svg', __FILE__)
      if @@svg.nil? or @@svg[:time] < File.mtime(svg_file)
        @@svg = {
          :doc => Nokogiri::XML(File.read(svg_file)),
          :time => File.mtime(svg_file)
        }
      end
      @@svg[:doc]
    end
  end
  
  get '/trail' do
    erb :trail
  end
  
  get '/path_info/:name' do
    content_type :json
    result = doc.xpath(%{//svg:g[@id="#{params[:name]}"]/svg:path}, { 'svg' => 'http://www.w3.org/2000/svg' }).collect { |n| 
      n['d'].gsub(/\s+/, ' ')
    }.to_json
  end
  
  get '/js/waypoints.js' do
    doc = Nokogiri::XML(File.open(File.expand_path('../public/svg/waypoints.xml', __FILE__)))
    content_type 'text/javascript'
    result = StringIO.new('')
    result.puts "function drawWaypoints() {"
    result.puts "  var waypoints = ["
    doc.xpath('//string').each { |n|
      color = (n['color'] || 'black').to_json
      pos = (n["x-pos"].to_f / 24.1375)-0.347246653060874
      text = n.text.to_json
      result.puts(%{    [#{pos}, #{text}, #{color}],})
    }
    result.puts "  null];"
    result.puts "  waypoints.pop();"
    result.puts "  var drawNextWaypoint = function() { var wp = waypoints.shift(); $tc.drawWaypoint(wp[0],wp[1],wp[2]); if (waypoints.length > 0) { setTimeout(drawNextWaypoint, 1) }}"
    result.puts "  drawNextWaypoint();"
    result.puts "}"
    result.string
  end
end
