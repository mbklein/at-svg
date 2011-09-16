#!/usr/bin/env ruby

require 'rubygems'
require 'sinatra'

# Image center is @ 484px
# Zero point is @ 24.14px
# 1 mi = 24.14px
# $('#profile').animate({ scrollLeft:  })

class TrailApp < Sinatra::Application
  
  get '/trail' do
    erb :trail
  end
  
end
