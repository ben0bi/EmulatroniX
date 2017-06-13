var Plasma = function(emuGraphicsAdapter)
{
	var GFX = null;
	if(emuGraphicsAdapter)
		GFX = emuGraphicsAdapter;

	var plasmaImage = null;
	var plasmaPalette = null;
	var plasmaPaletteMultiplier = 4;

	// create a plasma image.
	this.createPlasmaImage = function()
	{
		if(GFX==null)
		{
			console.log("Plasma Error: No EmuGraphicsAdapter given!");
		}

		// plasma image has a palette with 256 entries, each 32 entries another color raises/lowers.
		// first we create the palette.
		plasmaPalette = [];
		// we need just one palette and repeat it with the height map values (index%paletteSize).
		var red = 0;
		var green = 0;
		var blue = 0;

		// 0-31 + black to red
		for(var p=0;p<32;p++)
		{
			red = p*8; 		// red up
			blue = 0;
			green = 0;
			plasmaPalette.push(RGB(red,green,blue));
		}

		// 32-63 + red to yellow
		for(var p=0;p<32;p++)
		{
			red = 0xFF; 	// red stays
			green = p * 8;  // green up
			blue = 0;
			plasmaPalette.push(RGB(red,green,blue));
		}

		// 64-95 + yellow to green
		for(var p=0;p<32;p++)
		{
			red = (31-p)*8; // red down
			blue = 0;
			green = 0xFF; 	// green stays
			plasmaPalette.push(RGB(red,green,blue));
		}

		// 96-127 + green to turkis
		for(var p=0;p<32;p++)
		{
			red = 0;
			blue = p * 8;		// blue up
			green = 0xFF;		// green stays
			plasmaPalette.push(RGB(red,green,blue));
		}
			
		// 128-159 + turkis to blue
		for(var p=0;p<32;p++)
		{
			red = 0;
			blue = 0xFF;		// blue stays
			green = (31-p)*8;	// green down
			plasmaPalette.push(RGB(red,green,blue));
		}

		// 160-191 + blue to magenta
		for(var p=0;p<32;p++)
		{
			red = p * 8;		// red up
			blue = 0xFF;		// blue stays
			green=0;
			plasmaPalette.push(RGB(red,green,blue));
		}

		// 192-224 + magenta to red
		for(var p=0;p<32;p++)
		{
			red = 0xFF;		// red stays
			blue = (31-p)*8;	// blue down
			green = 0; 
			plasmaPalette.push(RGB(red,green,blue));
		}
			
		// 226-255 + red to black
		for(var p=0;p<32;p++)
		{
			red = (31-p)*8;		// red down 
			blue = 0;
			green = 0;		 
			plasmaPalette.push(RGB(red,green,blue));
		}

		// now generate the image itself.
		plasmaImage = GFX.screenToArray();	// get screen image
		var arraySize = plasmaImage.length;		// length of screen image array.
		var palSize = plasmaPalette.length;
		var maxValue = (palSize * plasmaPaletteMultiplier)-1;
		
		// just generate a random noise image
		for(var z = 0; z < arraySize; z++)
		{
			var color = parseInt(Math.random()*maxValue);
			
			// little more black in the image.
			if(color < maxValue * 0.25)
				color = 0;
			
			plasmaImage[z] = color;
		}
		
		// refine the image, create "height map"
		for(var steps =0;steps < 4;steps++)
		{
			var emuScreenHeight = GFX.screenHeight();
			var emuScreenWidth = GFX.screenWidth();

			for(var y=0;y<emuScreenHeight;y++)
			{
				for(var x=0;x<emuScreenWidth;x++)
				{
					var myIndex = y*emuScreenWidth+x;
					var color = 0;
					var dividor = 0;
					
					// get all colors around that pixel
					for(difx = -1; difx<=1; difx++)
					{
						for(dify = -1; dify<=1; dify++)
						{
							var index = (y+dify)*emuScreenWidth+x+difx;
							if(index>=0 && index<arraySize)
							{
								color+=plasmaImage[index];
								dividor++;
							}
						}
					}

					if(color>0 && dividor>0)
						color = parseInt(color/dividor);
					
					if(color>maxValue)
						color=maxValue;

					plasmaImage[myIndex] = color;
				}
			}
		}
		console.log("Plasma Effect image and palette created.");
	}
	
	// update the plasma image.
	this.update = function()
	{
		if(plasmaImage==null || plasmaPalette==null || !GFX)
			return;
		
		// cycle palette colors
		// warning: FROM 1, not from 0!!
		var first = plasmaPalette[0];
		for(var pz=1;pz<plasmaPalette.length;pz++)
		{
			plasmaPalette[pz-1] = plasmaPalette[pz];
		}
		plasmaPalette[plasmaPalette.length-1]=first;
		
		GFX.arrayFromPaletteToScreen(plasmaImage, plasmaPalette);
		//this.arrayToScreen(plasmaImage);
	}
	
	this.createPlasmaImage();
}
