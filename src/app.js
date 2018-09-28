/*
Maniac Engine.
A simple JS Engine based off of the AWESOME (<3) tutorials by One Lone Coder.
Seriously - his channel is amazing and you should all subscribe and show support https://www.youtube.com/watch?v=ih20l3pJoeU

TODO:
 * Multiple light support - most of the code is setup but need to expose in update function
 * Ability to update camera during update Fn

Example of setting up the engine
var settings = ManiacEngine.EngineSettings;
settings.canvasIdentifier = 'canvas';
var engine = new ManiacEngine.Engine(settings);
engine.run({
	return [new Model()];
}, {
	// Run Forever
	return true;
});
*/

import {EngineSettings} from './modules/settings';
import {Vector} from './modules/vector';
import {Matrix} from './modules/matrix';
import {Light} from './modules/lighting';
import {Primitives} from './modules/primitives';
import {Model, Triangle, Quad, Geometry, Clipping} from './modules/geometry';

// Main entry point for engine
class Engine {
	constructor(settings = EngineSettings) {
		this.settings = settings;

		// TODO: Move these into EngineSettings
		// Camera constants
		this.cameraNear = 0.1;
		this.cameraFar = 1000.0;
		this.cameraFOVDegrees = 90.0;
		this.cameraFOV = 1.0 / Math.tan(this.cameraFOVDegrees * 0.5 / 180.0 * 3.14159); // Convert to radians
		this.cameraAspectRatio = 0; // This needs inputs to evaluate
		this.cameraPosition = new Vector(0, 0, 0);
		this.cameraRotation = 0;

		// Lighting
		// Will contain an array of array of colors per light based on shade
		this.lightColorTables = [];
		this.ambientLightColorTable = [];
		// Used to determine how much a light affects a model
		this.lightNormals = [];
		this.lightPositions = [];
		this.colorDepth = 1;
		this.ambientLightVector;
		this.ambientLightNormal;

		// World/Environment
		this.screenSize;

		// Keep track of all our models to render
		this.models = [];
	}

	// Call this to begin running the engine
	// updateFn should return an array of Model objects to draw
	// endFn should return true if the engine is done, or false to continue ticking
	run(updateFn = () => { return []; }, endFn = () => { return false; }) {
		this.updateFn = updateFn;
		this.endFn = endFn;
		this.canvas = document.getElementById(this.settings.canvasIdentifier);
		this.canvasContext = canvas.getContext("2d");
		requestAnimationFrame(this._mainEventLoop.bind(this));
	}

	_mainEventLoop() {
		// Abort if we are done
		if (this.endFn()) {
			return;
		}

		// Allow for a chance to update the engine
		this.models = this.updateFn();
		this._update();
		this._render();

		// Loop
		requestAnimationFrame(this._mainEventLoop.bind(this));
	}

	/*
	Main evaluation function. Here we do the following:
	- Calculate geometry from the models, whether it's triangles or quads
	- Apply transformation matrix and world matrix
	- Calculate which tris/quads are visible, and skip those that aren't
	- Calculate lighting
	- Project into 2d space
	*/
	_update() {
		this.canvas.width  = window.innerWidth;
		this.canvas.height = window.innerHeight;
		var screenSize = {
			width: this.canvas.width, 
			height: this.canvas.height
		};

		this.cameraAspectRatio = screenSize.height / screenSize.width;
		// TODO: Allow for camera position updating
		this.cameraPosition = new Vector(0, -1, 1);
		this.cameraRotation = 0;

		this.cameraNear = this.settings.cameraNear;
		this.cameraFar = this.settings.cameraFar;
		this.cameraFOVDegrees = this.settings.cameraFOVDegrees;

		// Generate the color LUT based on the color depth (lower depth is faster/smaller loops)
		function ColorsForLight(lightVector, depth) {
			var colors = [];
			for (var j = 0; j < depth; j++) {
				var slicePercentage = j / depth;
				colors.push(Light.ShadeForPercentage(lightVector, slicePercentage));
			}
			return colors;
		}
		
		this.colorDepth = this.settings.colorDepth;
		this.lightColorTables = [];
		this.lightNormals = [];

		// Map ambient light
		this.ambientLightVector = new Vector(0.8, 0.3, 0.7);
		this.ambientLightColorTable = ColorsForLight(this.ambientLightVector, this.colorDepth);
		this.ambientLightNormal = Vector.Normalize(new Vector(0, 0, -1));

		// Process point lights
		var lights = [];
		for (var i = 0; i < lights.length; i++) {
			var lightDef = lights[i];

			var light = new Vector(lightDef.color.X, lightDef.color.Y, lightDef.color.Z);
			// Map a range of dark->light for this color
			var lightPos = new Vector(lightDef.position.X, lightDef.position.Y, lightDef.position.Z);
			this.lightPositions.push(lightPos);
			this.lightColorTables.push(ColorsForLight(light, this.colorDepth));
			this.lightNormals.push(Vector.Normalize(lightPos));
		}

		// Keep track of geometry we need to render
		var geometryToDraw = [];

		// Make View and Projection Matrices
		// View
		var vecUp = new Vector(0, 1, 0);
		var vecTarget = new Vector(0, 0, 1);
		var cameraRotationMatrix = Matrix.RotationY(this.cameraRotation);
		var vecLookDir = Vector.MultiplyWithMatrix(vecTarget, cameraRotationMatrix);
		vecTarget = Vector.Add(this.cameraPosition, vecLookDir);
		var viewMatrix = Matrix.Inverse(Matrix.LookAt(this.cameraPosition, vecTarget, vecUp));
		
		// Projection
		var projectionMatrix = Matrix.Projection(this.cameraAspectRatio, this.cameraFOV, this.cameraNear, this.cameraFar);

		// Process our models and convert them to renderable geometry!
		for (var i = 0; i < this.models.length; i++) {
			var model = this.models[i];

			// World matrix for model
			var worldMatrix = Matrix.Identity();

			// Rotation
			var rotationMatrix = Matrix.Rotation(model.rotation);
			worldMatrix = Matrix.Multiply(worldMatrix, rotationMatrix);

			// Translation
			var translationMatrix = Matrix.Translation(model.translation);
			worldMatrix = Matrix.Multiply(worldMatrix, translationMatrix);

			// Scale
			var scaleMatrix = Matrix.Scale(model.scale);
			worldMatrix = Matrix.Multiply(worldMatrix, scaleMatrix);

			// Enumerate our array of vertices and project into 2D space
			for (var x = 0; x < model.vertices.length; ++x) {
				// This will hold our projected vertices
				var projectedGeometry = [];

				// We may have 3 or 4 points depending on triangles vs quads in the model
				// This is the raw array of points for this vertex
				var points = model.vertices[x]; 

				// Traverse all points in this vertex and adjust based on our 'world' matrix
				for (var j = 0; j < points.length; j++) {
					// Build a vector from this point
					var world = new Vector(
						points[j][0],
						points[j][1],
						points[j][2]
					);
					
					// Apply transform matrices
					world = Vector.MultiplyWithMatrix(world, worldMatrix);

					// Add to our geometry
					projectedGeometry.push(world);
				}

				var trianglesToProcess = [projectedGeometry];

				// If this is a quad we want to process as 2 triangles, this just makes clipping easier
				if (projectedGeometry.length == 4) {
					trianglesToProcess = [
						[
							projectedGeometry[0],
							projectedGeometry[1],
							projectedGeometry[3]
						],
						[
							projectedGeometry[1],
							projectedGeometry[2],
							projectedGeometry[3]
						]
					]
				}

				for (var tIndex = 0; tIndex < trianglesToProcess.length; tIndex++) {
					projectedGeometry = trianglesToProcess[tIndex];
					// Now that we have the projected vertices we need to calculate some normals and do some culling for invisible geometry
					var line1 = Vector.Subtract(projectedGeometry[1], projectedGeometry[0]);
					var line2 = Vector.Subtract(projectedGeometry[2], projectedGeometry[0]);
					var normal = Vector.Normalize(Vector.Cross(line1, line2));
					var cameraRay = Vector.Subtract(projectedGeometry[0], this.cameraPosition);

					// Is this visible?
					if (Vector.Dot(normal, cameraRay) < 0) {
						// Calculate lighting
						var shadingIndices = [];
						for (var l = 0; l < this.lightNormals.length; l++) {
							var index = Light.GetShadingIndex(Vector.Dot(normal, this.lightNormals[l]), this.settings.colorDepth);
							shadingIndices.push(index);
						}
						var ambientIndex = Light.GetShadingIndex(Vector.Dot(normal, this.ambientLightNormal), this.settings.colorDepth);

						if (!this.settings.disableClipping) {
							// Clip vertices
							projectedGeometry = Clipping.ClipVertices(new Vector(0, 0, 0.1), new Vector(0, 0, 1), projectedGeometry);
							// Skip if we have fully clipped this geometry
							if (projectedGeometry.length == 0) {
								continue;
							}
						}
						
						var projectedVertices = [];
						var lightPositionForGeometry = projectedGeometry[0]; // Choose the first point for now

						// Project into 2D space
						for (var j = 0; j < projectedGeometry.length; j++) {
							// Convert to world space
							var projection = Vector.MultiplyWithMatrix(projectedGeometry[j], viewMatrix);
							
							// Project to 2d space
							projection = Vector.MultiplyWithMatrix(projection, projectionMatrix);

							// Normalize
							projection = Vector.Divide(projection, projection.w);

							// Scale into view
							projection.x += 1.0;
							projection.x *= 0.5 * screenSize.width;
							projection.y += 1.0;
							projection.y *= 0.5 * screenSize.height;

							projectedVertices.push(projection);
						}

						var isQuad = projectedGeometry.length == 4;
						if (isQuad) {
							geometryToDraw.push(new Geometry(true, {}, new Quad(
								projectedVertices[0],
								projectedVertices[1],
								projectedVertices[2],
								projectedVertices[3],
								shadingIndices,
								ambientIndex,
							), lightPositionForGeometry));
						} else {
							geometryToDraw.push(new Geometry(false, new Triangle(
								projectedVertices[0],
								projectedVertices[1],
								projectedVertices[2],
								shadingIndices,
								ambientIndex,
							), {}, lightPositionForGeometry));
						}
					}
				}
			}
		}

		this.geometryToDraw = geometryToDraw;
		this.screenSize = screenSize;
	}

	/*
	Here we draw to canvas
	*/
	_render() {
		// Enumerate geometry and draw!
		this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// We need to sort the geometry from back to front before rendering
		this.geometryToDraw.sort(function (geo1, geo2) {
			// Find the average of the z and compare by that
			return geo1.averageZ() < geo2.averageZ();
		});

		for (var i = 0; i < this.geometryToDraw.length; i++) {
			var mesh = this.geometryToDraw[i];

			// Clip against the screen edges now that we've projected the geometry
			var rawPoints = mesh.rawPoints();
			if (!this.settings.disableClipping) {
				rawPoints = Clipping.ClipVertices(new Vector(0, 0, 0), new Vector(0, 1, 0), rawPoints);
				rawPoints = Clipping.ClipVertices(new Vector(0, this.screenSize.height  - 1, 0), new Vector(0, -1, 0), rawPoints);
				rawPoints = Clipping.ClipVertices(new Vector(0, 0, 0), new Vector(1, 0, 0), rawPoints);
				rawPoints = Clipping.ClipVertices(new Vector(this.screenSize.width - 1, 0, 0), new Vector(-1, 0, 0), rawPoints);
				// Skip if we have clipped
				if (rawPoints.length == 0) {
					continue;
				}
			}
			mesh.setRawPoints(rawPoints);
			mesh.pixelAlign(this.settings.screenScale);

			// Calculate lighting
			var light = 
			Light.Blend(
				this.lightColorTables,
				mesh.colorIndices(), 
				this.ambientLightVector,
				this.ambientLightColorTable,
				mesh.getAmbientIndex(),
				this.lightPositions, 
				mesh.worldPositionForLighting(), 
				this.settings.lightDistanceThreshold);

			var lightDef = 'rgba(' + light.x * 255 + ', ' + light.y * 255 + ', ' + light.z * 255 + ', ' + light.w + ")";
			this.canvasContext.fillStyle = lightDef;

			if (mesh.isQuad) {
				// Render quad
				var quad = mesh.quad;
				this.canvasContext.beginPath();
				this.canvasContext.moveTo(quad.p0.x, quad.p0.y);
				this.canvasContext.lineTo(quad.p1.x, quad.p1.y);
				this.canvasContext.lineTo(quad.p2.x, quad.p2.y);
				this.canvasContext.lineTo(quad.p3.x, quad.p3.y);
				this.canvasContext.closePath();
				this.canvasContext.fill();
			} else {
				// Render triangle
				var triangle = mesh.triangle;
				this.canvasContext.beginPath();
				this.canvasContext.moveTo(triangle.p0.x, triangle.p0.y);
				this.canvasContext.lineTo(triangle.p1.x, triangle.p1.y);
				this.canvasContext.lineTo(triangle.p2.x, triangle.p2.y);
				this.canvasContext.closePath();
				this.canvasContext.fill();
			}
		}
	}

}

export {Model, Engine, Vector, Primitives};