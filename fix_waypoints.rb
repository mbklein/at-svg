#!/usr/bin/env ruby

require 'rubygems'
require 'nokogiri'

class FixWaypoints
  MILE = 23.898347102873828

  @@file = File.expand_path('../public/svg/waypoints.xml',__FILE__)
  @@doc = nil
  
  class << self
    def avg(n1,n2,a)
      n1[a].nil? or n2[a].nil? ? nil : (n1[a].to_f + n2[a].to_f) / 2.0
    end

    def combine(*nodes)
      nodes.each { |n2|
        ix = n2['index'].to_i
        n1 = doc.at_xpath(%{//string[@index="#{ix-1}"]})
        ['mi','x','y'].each { |a|
          val = avg(n1,n2,a)
          n1[a] = val.to_s unless val.nil?
        }
        n1.content += "\\n#{n2.text}"
        n2.remove
      }
    end
    
    def color(color, *nodes)
      nodes.each { |n|
        n['color'] = color
      }
    end
    
    def doc
      @@doc ||= Nokogiri::XML(File.read(@@file))
    end

    def save
      File.open(@@file,'w') { |f| doc.write_to(f) }
    end

    def reposition
      offset = nil
      fudge = nil
      set = doc.xpath('//string')
      offset = set.first["x-pos"].to_f / MILE
      fudge = 2178.25 / ((set.last["x-pos"].to_f / MILE) - offset)

      doc.xpath('//string').each_with_index { |n,i|
        n['index'] = i.to_s
        n['mi'] = '%.3f' % (((n["x-pos"].to_f / MILE)-offset)*fudge)

        n.attribute('x').name = 'prev-x' unless n['x'].nil?
        n.attribute('y').name = 'prev-y' unless n['y'].nil?
      }
      doc
    end
  end
end