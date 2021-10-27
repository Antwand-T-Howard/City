import SimplexNoise from "./SimplexNoise.js";

export class Mapper {
  constructor () {
    
  }
  map(width, height) {
    var m = SimplexNoise().noise2D(width,height);
    return m;
  }
}