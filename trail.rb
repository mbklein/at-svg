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
  
  post '/waypoint' do
    doc = Nokogiri::XML(File.open(File.expand_path('../public/svg/waypoints.xml', __FILE__)))
    n = doc.at_xpath("//string[@index='#{params[:index]}']")
    unless [params[:x],params[:y]].include? 'NaN'
      n['x'] = params[:x]
      n['y'] = params[:y]
    end
    File.open(File.expand_path('../public/svg/waypoints.xml', __FILE__),'w') { |f| doc.write_to(f) }
    content_type :json
    true.to_json
  end
  
  get '/waypoints' do
    content_type :json
    doc = Nokogiri::XML(File.open(File.expand_path('../public/svg/waypoints.xml', __FILE__)))
    doc.xpath('//string').collect { |n|
      color = (n['color'] || 'black')
      pos = (n['x'] and (n['y'] != 'NaN')) ? [n['x'].to_f,n['y'].to_f] : n["mi"].to_f
      {
        :index => n['index'],
        :mi => n["mi"].to_f,
        :x => n['x'] ? n['x'].to_f : nil,
        :y => n['y'] ? n['y'].to_f : nil,
        :text => n.text.gsub(/\\n/,"\n"),
        :color => color
      }
    }.to_json
  end
end
