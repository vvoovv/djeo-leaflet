define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array"
], function(declare, lang, array){
	
return declare(null, {
	constructor: function(kwArgs) {
		lang.mixin(this, kwArgs);
	},

	push: function(feature, point) {
		var shape = feature.baseShapes[0];
		if (feature.getCoordsType() == "LineString") {
			shape.addLatLng([point[1],point[0]]);
		}
	},

	set: function(feature, index, point) {
		var shape = feature.baseShapes[0];
		if (feature.getCoordsType() == "LineString") {
			shape.spliceLatLngs(index, 0, [point[1],point[0]]);
		}
	},
	
	remove: function(feature, index) {
		var shape = feature.baseShapes[0];
		if (feature.getCoordsType() == "LineString") {
			shape.spliceLatLngs(index, 1);
		}
	}
});

});