@water-color: #cef;
@forest-color: #bdb;

Map {
  background-color: #fff;
}

#island {
  polygon-fill: #fff;
}

#water_polygons {
  polygon-fill: @water-color;
}

#water {
  polygon-fill: @water-color;
}

#waterway {
  line-color: @water-color;
  line-width: 1.5;
  [waterway='river'],[waterway='canal'] { line-width: 3; }
}

#forest {
  polygon-fill: @forest-color;
}

#wetland {
  polygon-pattern-file: url('symbols/wetland.png');
  polygon-pattern-alignment: global;
}

#border {
  line-width: 3;
  line-color: #888;
  line-dasharray: 25,25;
}

#aeroway {
  line-width: 4;
  line-color: #aaa;
  [aeroway='runway'] { line-width: 10; }
}

#apron {
  polygon-fill: #aaa;
}

#building {
  polygon-fill: #888;
}

#railway {
  line-width: 4;
  line-color: #666;
  light/line-width: 3;
  light/line-color: #fff;
  light/line-dasharray: 10,10;
  [service=~".+"] {
    line-width: 2.5;
    line-color: #888;
    light/line-width: 1.5;
    light/line-color: #fff;
    light/line-dasharray: 8,8;
  }
}

#road {
  [highway='motorway'],[highway='trunk'],[highway='motorway_link'] {
    ::casing {
      line-width: 6;
      line-color: #888;
    }
    line-width: 4;
    line-color: #bbb;
  }
  [highway='primary'],[highway='trunk_link'] {
    ::casing {
      line-width: 5;
      line-color: #000;
    }
    line-width: 4;
    line-color: #bbb;
  }
  [highway='secondary'] {
    line-width: 3.5;
    line-color: #888;
  }
  [highway='tertiary'] {
    line-width: 2.5;
    line-color: #888;
  }
  [highway='service'],[highway='residential'],[highway='unclassified'] {
    line-width: 1.5;
    line-color: #888;
  }
  [highway='track'],[highway='living_street'] {
    line-width: 0.7;
    line-color: #888;
  }
  [highway='cycleway'],[highway='footway'] {
    line-width: 0.5;
    line-color: #888;
    line-dasharray: 4,4;
  }
}

#power_line {
  line-color: #aaa;
  line-width: 1;
}

#power_tower {
  marker-fill: #aaa;
  marker-width: 3;
}
