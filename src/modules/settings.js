/*
This object is passed into the engine on instantiation. Override settings to customize parts of the engine
*/
var EngineSettings = {
	// The ID of the canvas element used to render, we need this to get the screen size
	canvasIdentifier: 'canvas',

    // This affects how deep the color depth is - the higher the number the smoother the shading. A lower number can create older style effects where
    // engines could only render a certain number of colors
	colorDepth: 100,

	// This is how far lights will shine (I think, bad at math but I try to blend lights based on how far/close the vector distance is)
	lightDistanceThreshold: 10,

	// The default screen scale when rounding the output to the pixel grid
	screenScale: 2,

	// Disable clipping. Can affect performance but useful to ensure that clipping is working as expected
	disableClipping: false,

	// The near clipping plane
	cameraNear: 0.1,

	// The far clipping plane
	cameraFar: 1000.0,

	// The field of view (in degrees)
	cameraFOVDegrees: 90.0
};

export {EngineSettings};