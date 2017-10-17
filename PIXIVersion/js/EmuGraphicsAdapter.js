// Create a graphics class.
var EmuGraphicsAdapter = function(newwidth, newheight, bgcolor, bordercolor)
{
	var PIXIStage = RSTAGE();

	var emuBorderColor = 0x111133; 		// usually same as the browser background color.
	var emuBackgroundColor = 0x000000;	// the background color of the emulator itself.
	this.getBackgroundColor = function() {return emuBackgroundColor;}

	var emuBorderWidth = 10; 	// better cover more than less space.

	// width and height of the emulator screen.
	var emuScreenWidth = 40;
	var emuScreenHeight = 40;

	// NEW FOR Part 2.1_3
	this.screenWidth = function() {return emuScreenWidth;}
	this.screenHeight = function() {return emuScreenHeight;}
	// ENDOF NEW

	// drawing width and height is emu width and height * 2
	var emuDrawWidth = emuScreenWidth * 2;
	var emuDrawHeight = emuScreenHeight * 2;

	// double buffering.
	var doubleBufferIndex = 0;		// 0 or 1.
	var screenArray = [];			// this array holds 2 screen arrays for double buffering.
	
	// NEW FOR Anpassungen 
	var g_resizeParameter = 0;		// fit to screen.
	this.getResizeParameter = function() {return g_resizeParameter;}
	// ENDOF NEW
	
	this.initialize = function(width, height,bgColor,borderColor)
	{
		// get and set some values.
		if(width)
			emuScreenWidth = width;
		if(height)
			emuScreenHeight = height;

		// maybe set the border color.
		if(bgColor)
			emuBackgroundColor=bgColor;
		if(borderColor)
			emuBorderColor = borderColor;

		// drawing width and height is emu width and height * 2
		emuDrawWidth = emuScreenWidth * 2;
		emuDrawHeight = emuScreenHeight * 2;

		// maybe detach the old containers.
		if(EmuGraphicsAdapter.containers.length>0)
		{
			for(var i=0;i<EmuGraphicsAdapter.containers.length;i++)
				PIXIStage.removeChild(EmuGraphicsAdapter.containers[i]);
			EmuGraphicsAdapter.containers = [];
		}

		// maybe we need to create the original pixel texture.
		EmuGraphicsAdapter.createOriginalPixelTex();

		// create the background texture.
		var gbg = new PIXI.Graphics();
		gbg.beginFill(emuBackgroundColor, 1.0);
			gbg.drawRect(0,0,emuDrawWidth,emuDrawHeight); // add border width to position to draw border later.
		gbg.endFill();

		// draw borders to cover pixels which may be overlap the emulator screen.
		var gbord = new PIXI.Graphics();
		gbord.beginFill(emuBorderColor, 1.0);
			gbord.drawRect(0,0,emuDrawWidth+emuBorderWidth*2,emuBorderWidth); // from top right to top left.
			gbord.drawRect(0,0,emuBorderWidth,emuDrawHeight+emuBorderWidth*2); // from top right to bottom right.
			gbord.drawRect(emuDrawWidth+emuBorderWidth,0,emuBorderWidth,emuDrawHeight+emuBorderWidth*2); // from top left to bottom left.
			gbord.drawRect(0,emuDrawHeight+emuBorderWidth,emuDrawWidth+emuBorderWidth*2,emuBorderWidth); // from bottom right to bottom left.
		gbord.endFill();

		// generate a texture from that stuff
		var backgroundTex = gbg.generateCanvasTexture();
		var borderTex = gbord.generateCanvasTexture();

		var backgroundsprite1 = new PIXI.Sprite(backgroundTex);
		var backgroundsprite2 = new PIXI.Sprite(backgroundTex);
		var bordersprite1 = new PIXI.Sprite(borderTex);
		var bordersprite2 = new PIXI.Sprite(borderTex);

		// the container holds the whole emulator screen.
		var container1 = new PIXI.Container();
		var container2 = new PIXI.Container();
		container1.addChild(backgroundsprite1);
		container2.addChild(backgroundsprite2);
		var arr1 = [];
		var arr2 = [];

		// create pixels and add them to the containers.
		for(y=0;y<emuScreenHeight;y++)
		{
			for(x=0;x<emuScreenWidth;x++)
			{
				// double it all for double buffering.
				var pixel1 = new PIXI.Sprite(EmuGraphicsAdapter.originalPixelTex);
				pixel1.x = x*2;
				pixel1.y = y*2;

				var pixel2 = new PIXI.Sprite(EmuGraphicsAdapter.originalPixelTex);
				pixel2.x = x*2;
				pixel2.y = y*2;

				container1.addChild(pixel1);
				container2.addChild(pixel2);
				arr1.push(pixel1);
				arr2.push(pixel2);
			}
		}

		// add the border.
		bordersprite1.x = -emuBorderWidth;
		bordersprite1.y = -emuBorderWidth;
		bordersprite2.x = -emuBorderWidth;
		bordersprite2.y = -emuBorderWidth;
		container1.addChild(bordersprite1);
		container2.addChild(bordersprite2);
		
		// NEW FOR Anpassungen: Container Anker
		container1.pivot.x = -emuBorderWidth;
		container1.pivot.y = -emuBorderWidth;
		container2.pivot.x = -emuBorderWidth;
		container2.pivot.y = -emuBorderWidth;
		// ENDOF NEW FOR Anpassungen

		// add the containers and the screen arrays to the buffer arrays.
		EmuGraphicsAdapter.containers = [];
		EmuGraphicsAdapter.containers.push(container1);
		EmuGraphicsAdapter.containers.push(container2);
		screenArray = [];
		screenArray.push(arr1);
		screenArray.push(arr2);

		doubleBufferIndex = 0;

		// add the containers to the pixi stage.
		PIXIStage.addChild(container1);
		PIXIStage.addChild(container2);

		// center and scale the containers.
		this.resize();

		// hide one of the screens.
		this.switchBuffers();

		// clear the buffers.
		fillBuffer(emuBackgroundColor, 0);
		fillBuffer(emuBackgroundColor, 1);

		console.log("EmuGraphicsAdapter: Screen with size "+emuScreenWidth+"x"+emuScreenHeight+" created (double sized and double buffered).");
	}

// NEW FOR PART 2.1_2

	// switch the buffers.
	this.switchBuffers = function()
	{
		var oldBuf = doubleBufferIndex;
		doubleBufferIndex=Math.abs(doubleBufferIndex - 1);	// create the new index: abs(0 - 1) = 1, abs(1 - 1) = 0 ....
		EmuGraphicsAdapter.containers[doubleBufferIndex].visible = false;	// actual buffer is hidden for drawing on it.
		EmuGraphicsAdapter.containers[oldBuf].visible = true;	// show the old buffer.
	}

// NEW FOR Anpassungen: Bildschirmgrösse.
	this.resize=function(resizeParameter)
	{
		// nothing = 0 = -1 = fit to screen.
		if(!resizeParameter)
			resizeParameter = -1;
		
				// fit to original size
		var resizeMultiplier = Math.abs(resizeParameter);
		var withBorder=1;
		
		// fit to screen
		if(resizeParameter==0 || resizeParameter=='auto' || resizeParameter==-1)
		{
			resizeParameter = -1;
			resizeMultiplier = 1;
		}
		
		// fit to screen without borders.
		if(resizeParameter == 'noborder' || resizeParameter==-2)
		{
			resizeMultiplier=1;
			resizeParameter = -2;
			withBorder=0;
		}
		
		// set the new resize parameter.
		g_resizeParameter=resizeParameter;
		
		// fit to screen
		if(resizeParameter < 0)
		{
			// get the screen size to fit to screen.
			var realScreenWidth = RUNPIXI.getScreenSize().w;
			var realScreenHeight = RUNPIXI.getScreenSize().h;
			
			// include the borders.
			var emuWidth = emuDrawWidth + withBorder*(emuBorderWidth *2);
			var emuHeight = emuDrawHeight + withBorder*(emuBorderWidth *2);
			
			var mul = 1;
			// get the multipliers. We need the DRAW width and height.
			// first try with x multiplication.
			if(emuWidth>0 && realScreenWidth>0)
				mul = realScreenWidth/emuWidth;
			
			// it does not fit in height, try it with y multiplication.
			if(emuHeight * mul > realScreenHeight && emuHeight > 0 && realScreenHeight > 0)
				mul = realScreenHeight/emuHeight;
			
			// fitted to screen, now multiply with desired resolution.
			resizeMultiplier = resizeMultiplier * mul;
		}else{
			// screen is double the size of original so take the half of the value.
			resizeMultiplier = resizeMultiplier * 0.5;
		}
		
		// apply the multiplier
		for(var i=0;i<EmuGraphicsAdapter.containers.length;i++)
		{
			var container = EmuGraphicsAdapter.containers[i];
			container.scale.x = resizeMultiplier;
			container.scale.y = resizeMultiplier;
		}
				
		// finally center the screen again.
		this.reposition();
	}
// ENDOF NEW FOR Anpassungen.
	
	// reposition the screen.
	this.reposition = function()
	{
		// get the screen size to center the sprite.
		var realScreenWidth = RUNPIXI.getScreenSize().w;
		var realScreenHeight = RUNPIXI.getScreenSize().h;

		for(var i=0;i<EmuGraphicsAdapter.containers.length;i++)
		{
			var container = EmuGraphicsAdapter.containers[i];
			container.x = realScreenWidth*0.5-container.width*0.5;
			container.y = realScreenHeight*0.5-container.height*0.5;
			console.log("*** EmuGraphicsAdapter Resize ***")
			console.log(i+"_X: Real: "+realScreenWidth+" / Draw: "+emuDrawWidth+" / Cont: "+container.width+ " / Pos: "+container.x);
			console.log(i+"_Y: Real: "+realScreenHeight+" / Draw: "+emuDrawHeight+" / Cont: "+container.height+ " / Pos: "+container.y);
		}
	}

	// fill the whole screen with a specific color.
	var fillBuffer = function(color, bufferIndex)
	{
		if(screenArray[bufferIndex].length<=0)
			return;

		for(z=0;z<screenArray[bufferIndex].length;z++)
		{
			screenArray[bufferIndex][z].tint = color;
		}
	}

	this.fill = function(color) { fillBuffer(color, doubleBufferIndex);	}

	// fill the whole screen with the emulator background color.
	this.clear = function() {this.fill(emuBackgroundColor);}
	
	// NEW FOR 2.1_3
	
	// color one specific pixel by array index.
	this.pixelIndex = function(arrIndex, color)
	{
		if(arrIndex >= 0&&arrIndex < screenArray[doubleBufferIndex].length)
			screenArray[doubleBufferIndex][arrIndex].tint = color;
	}

	// color one specific pixel.
	this.pixel = function(x,y,color)
	{
		var z = y * emuScreenWidth + x;
		this.pixelIndex(z, color);
	}
	
	// copy a color array to the screen.
	this.arrayToScreen = function(arr)
	{
		var maxZ = arr.length;
		if(screenArray[doubleBufferIndex].length<maxZ)
			maxZ = screenArray[doubleBufferIndex].length;
		for(var z=0;z < maxZ;z++)
		{
			this.pixelIndex(z,arr[z]);
		}
	}
	
	// uses the array values as palette index.
	this.arrayFromPaletteToScreen = function(arr, paletteArray)
	{
		var maxZ = arr.length;
		if(screenArray[doubleBufferIndex].length<maxZ)
			maxZ = screenArray[doubleBufferIndex].length;
		var paletteSize = paletteArray.length;
		for(var z=0;z < maxZ;z++)
		{
			this.pixelIndex(z, emuBackgroundColor);
			var a = arr[z] % paletteSize;	// modulo the value through paletteSize
			this.pixelIndex(z,paletteArray[a]);
		}
		
	}

	// returns an array in the size of the screen.
	// filled with the backbuffer content.
	this.screenToArray = function()
	{
		var arr = [];
		for(z=0;z < screenArray[doubleBufferIndex].length; z++)
		{
			arr.push(screenArray[doubleBufferIndex][z]);
		}
		return arr;
	}

	// ENDOF NEW FOR 2.1_3

	// initialize the new screen.
	this.initialize(newwidth, newheight, bgcolor, bordercolor);
}

// the containers are outside the class so that we can detach old ones when creating a new emulator screen.
EmuGraphicsAdapter.containers = [];

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

// NEW FOR 2.1_3

// return the combined color (0xRRGGBB)
var RGB = function(red, green, blue) {return ((red << 16) & 0xFF0000) | ((green<<8) & 0x00FF00) | (blue & 0x0000FF);}
var RED = function(color) {return (color>>16) & 0x0000FF;}
var GREEN = function(color) {return (color>>8) & 0x0000FF;}
var BLUE = function(color) {return color & 0x0000FF;}
// ENDOF NEW

