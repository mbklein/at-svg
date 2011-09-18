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
end
