const { Transform } = require("stream");
const path = require("path");
const node_sass = require("node-sass");
const applySourceMap = require("vinyl-sourcemaps-apply");

module.exports = function({
  sourceMap = true,
  importer,
  includePaths = []
} = {}) {
  var options = {
    sourceMap,
    includePaths
  }

	if(sourceMap) {
		options.omitSourceMapUrl = true;
		options.sourceMapContents = true;
	}

	if(importer) {
		options.importer = importer
	}

  class SASSStream extends Transform {
    constructor() {
      super({
        objectMode : true
      });
    }
    _transform(file, encoding, callback) {
      if (file.isNull()) {
        return cb(null, file);
      }

      if (file.isStream()) {
        return cb(new TypError('gulp-sass does not support streaming'));
      }

      node_sass.render({
        file : file.path, //for resolve deps
        data : file.contents.toString(), //use existing buffer
        outFile : file.path, //for sourcemap
        ...options
      }, (err, response) => {
        if(err) {
          return callback(err);
        }


        Object.assign(file, {
          contents : response.css,
          extname : ".css",
          dependencies : response.stats.includedFiles
        });

        if(response.map) {
          applySourceMap(file, response.map.toString());
        }

        callback(null, file);

        /*
        let imports = response.stats.includedFiles;

        file.contents = new Buffer(response.css);

        if(response.map) {
          let sassMap = JSON.parse(response.map.toString());

          sassMap.sources = sassMap.sources.map(function(source) {
            return path.relative(BASE, path.parse(source));
          });

          applySourceMap(file, sassMap);
        }

        callback(null, file);*/
      });
    }
  }

  return SASSStream;
}
