// Create a graphics class.
var EmuGraphicsAdapter = function(newwidth, newheight)
{
	var borderBackgroundColor = 0x111133; 	// usually same as the browser background color.
	var emuBackgroundColor = 0x000000;		// the background color of the emulator itself.
	this.getBackgroundColor = function() {return emuBackgroundColor;}
	
	var emuBorderWidth = 10; 				// better cover more than less space.
	this.getBorderWidth = function() {return emuBorderWidth;}
	
	// width and height of the emulator screen.
	var emuScreenWidth = newwidth;
	var emuScreenHeight = newheight;
	
	var screenArray = []					// this array holds 2 screen arrays for double buffering.
	
	this.initialize = function(width, height)
	{
		// maybe we must create the original pixel texture.
		EmuGraphicsAdapter.createOriginalPixelTex();
	}
	
	// fill the whole screen with a specific color.
	this.fill = function(color)
	{
		if(screenArray.length<=0)
			return;
		
		for(z=0;z<screenArray.length;z++)
		{
			screenArray[z].tint = color;
		}
	}
	
	// fill the whole screen with the emulator background color.
	this.clear = function() {this.fill(emuBackgroundColor);}
	
	// initialize the new screen.
	this.initialize(emuScreenWidth, emuScreenHeight);
}

// blank white pixel texture for creating the pixel sprites.
EmuGraphicsAdapter.originalPixelTex = null;
EmuGraphicsAdapter.createOriginalPixelTex = function()
{
	if(EmuGraphicsAdapter.originalPixelTex!=null)
	{
		console.log("EmuGraphicsAdapter: Pixel texture already created.");
		return;
	}
	
	// create the pixel texture.
	var gpix = new PIXI.Graphics();
	gpix.beginFill(0xFFFFFF, 1.0);
		gpix.drawRect(0,0,2,2);
	gpix.endFill();
			
	EmuGraphicsAdapter.originalPixelTex = gpix.generateCanvasTexture();
	console.log("EmuGraphicsAdapter: CREATED original pixel texture.");
}
//EmuGraphicsAdapter.singleton = new EmuGraphicsAdapter();