var Utils = {};

Utils.RoundToPixelGrid = (x, scale) => {
	return Math.round(x * scale) / scale;
}

Utils.IsEmpty = (object) => {
	 for (var i in object) {
		return true; 
	} 
	return false; 
}

export {Utils}
