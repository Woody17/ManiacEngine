class Light {
	static Print(light, name = "Light") {
		console.log(name + ": " + "x: " + light.x + " y: " + light.y + " z:" + light.z);
	}

	static ShadeForPercentage(light, percent) {
		return {
			x: ((light.x * 255.0) * percent) / 255.0,
			y: ((light.y * 255.0) * percent) / 255.0,
			z: ((light.z * 255.0) * percent) / 255.0,
			w: 1
		}
	}

	static Blend(lightTable, colorIndices, ambientColor, aColorTable, aIndex, positions, geometryPosition, distanceCutoff) {
		function colorChannelMixer(colorChannelA, colorChannelB, amountToMix){
			var channelA = colorChannelA*amountToMix;
			var channelB = colorChannelB*(1-amountToMix);
			return parseInt(channelA+channelB);
		}

		function colorMixer(rgbA, rgbB, amountToMix){
			var r = colorChannelMixer(rgbA[0],rgbB[0],amountToMix);
			var g = colorChannelMixer(rgbA[1],rgbB[1],amountToMix);
			var b = colorChannelMixer(rgbA[2],rgbB[2],amountToMix);
			return [r, g, b];
		}

		var color = {x:ambientColor.x, y:ambientColor.y, z:ambientColor.z, w:1};
		color = aColorTable[aIndex];
		for (var i = 0; i < lightTable.length; i++) {
			// We need to blend here
			var toBlend = lightTable[i][colorIndices[i]];
			var position = positions[i];
			// Work out how far this is from the geometry and blend with that factor
			var distance = Vector.Length(Vector.Subtract(position, geometryPosition));
			if (distance < distanceCutoff) { // Light blending cutoff
				var blendPercentage = distance / distanceCutoff;
				// Blend colors
				var base = [color.x * 255, color.y * 255, color.z * 255, 1];
				var added = [toBlend.x * 255, toBlend.y * 255, color.z * 255, 1];
				var mix = colorMixer(base, added, blendPercentage);
				
				// Update color
				color = {
					x:mix[0] / 255.0,
					y:mix[1] / 255.0,
					z:mix[2] / 255.0,
					w:1
				}
			}
		}
		return color;
    }
    
    // Helper Fn to lookup the shading index based on color depth
    static GetShadingIndex(shading, colorDepth) {
        var index = Math.round((colorDepth - 1) * shading);
        if (index > colorDepth - 1) { index = colorDepth - 1; }
        if (index < 0) { index = 0; }
        return index;
    };
}

export {Light};