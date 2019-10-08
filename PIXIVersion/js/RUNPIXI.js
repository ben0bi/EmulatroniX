// v0.6.5 (v0.6.4 => 0.6.3 => 0.6.2 => 0.6.1 => 0.6.0 => 0.5.0 => 0.4.1 => 0.4.0 => 0.3.5 => ???)
/* Helper to get PIXI.js to run.
	Needs PIXI.js

		Just use RUNPIXI.initialize to get a running PIXI screen.
		RUNPIXI provides you with three stages (containers) to draw on:
			The BACKSTAGE is fixed and used for backgrounds like sky images.
			The SCROLLSTAGE is the main stage, it can be easily scrolled.
			The HUDSTAGE is the most foreground stage, also fixed, used for menus and HUD.

	Usage:
		<div id="mypixiscreen" style="width: XXXpx; height: YYYpx"></div>
		<script>
			function loopfunction()
			{
				// add your loop stuff here.
			}

			// you need only this single line of code to make pixi run inside your div.
			RUNPIXI.initialize("mypixiscreen", loopfunction);

			// Additional Stuff:

			// get access to the main stage with RSTAGE(), RUNPIXI.STAGE() or RUNPIXI.instance.SCROLLSTAGE().
			// RBACKSTAGE(), RUNPIXI.BACKSTAGE() or RUNPIXI.instance.BACKSTAGE() for the background stage.
			// RHUDSTAGE(), RUNPIXI.HUDSTAGE() or RUNPIXI.instance.HUDSTAGE() for the foreground stage.		

			RSTAGE().addChild(myPixiSprite);

			// more in the readme file.
		</script>
*/

/*
Hierarchy
	ROOT
		RBGSTAGE			- fixed
		RSTAGE				- moving
		RHUDSTAGE			- fixed
*/

/*
	TODO:
	Texture Manager
		Load Texture if not loaded.
		Else get it from the list.
*/

// 0.4.0 NEW RUNPIXIKEY
// Funcs need one param p.
var RUNPIXIKEY = function()
{
	// 0.5.0 Use isKeyCode instead of keycode
	var _isKeyCode = false;
	var _keyChar = '';
	var _func_keyDown = null;
	var _func_keyUp = null;
	var _func_params_down = null;
	var _func_params_up = null;
	// 0.6.0: use control?
	var _useCtrl = false;
	var _ctrlPressed = false;
	this.useCtrl = function(v) {_useCtrl=v;};

	// set that stuff.
	this.Set = function(keychar, iskeycode, keydownfunc, keyupfunc)
	{
		_keyChar = keychar;
		_isKeyCode = iskeycode;
		_func_keyDown = keydownfunc;
		_func_keyUp = keyupfunc;
	};

	this.SetDownFuncParams = function(params) {_func_params_down = params;};
	this.SetUpFuncParams = function(params) {_func_params_up = params;};

	// return if the event has the given key "activated".
	var _state = function(e)
	{
		var k = String.fromCharCode(e.which);

		// 0.5.0 Check for isKeyCode == true instead of keyCode > 0
		//	.. and use keyChar for keyCode if isKeyCode == true
		if((_isKeyCode == true && e.keyCode == _keyChar) || 
		(_isKeyCode == false && _keyChar.toLowerCase() == k.toLowerCase()))
		{
			// 0.6.0: use with control key?
			if((_useCtrl && _ctrlPressed) || !_useCtrl)
				return true;
		}

		return false;
	};

	// called if a key is pressed down.
	this.Down = function(event)
	{
		// 0.6.0: check for ctrl.
		if(event.ctrlKey)
			_ctrlPressed = true;

		// return if it is not a function.
		if(typeof(_func_keyDown) !== 'function')
			return;
		if(_state(event)==true)
			_func_keyDown(_func_params_down);
	};

	// called if a key is released.
	this.Up = function(event)
	{
		// 0.6.0: check for ctrl.
		if(!event.ctrlKey)
			_ctrlPressed = false;

		// return if it is not a function.
		if(typeof(_func_keyUp) !== 'function')
			return;
		if(_state(event)==true)
			_func_keyUp(_func_params_up);
	};
};
// ENDOF 0.4.0

var RUNPIXI = function()
{
	// PIXI STUFF
	// stages
	var _PIXIRootStage = new PIXI.Container();	// DONE all other stages are childs of the root stage.
	var _PIXIBackStage = new PIXI.Container();	// the fixed background stage.
	var _PIXIScrollStage = new PIXI.Container();	// the scrolling flexible stage.
	var _PIXIHUDStage = new PIXI.Container();	// the fixed foreground stage.

	var _shaders = Array();				// array with the shaders.
	var _keys = Array();				// 0.4.0 array with registered keys.

	// 0.6.4: Scroll boundaries (local space on RSTAGE, converted to global space.)
	// NOT FUNCTIONAL, only used for centering the screen.
	var boundarX1 = 'not set';
	var boundarX2 = 'not set';
	var boundarY1 = 'not set';
	var boundarY2 = 'not set';
	this.setScrollBoundaries = function(x1,y1, x2, y2)
	{
		boundarX1 = x1;
		boundarX2 = x2;
		boundarY1 = y1;
		boundarY2 = y2;
	};

	this.getScrollBoundaries = function() 
	{
		var result=Array();
		result[0]=result["x1"]=result["X1"]=boundarX1;
		result[1]=result["x2"]=result["X2"]=boundarX2;
		result[2]=result["y1"]=result["Y1"]=boundarY1;
		result[3]=result["y2"]=result["Y2"]=boundarY2;
		return result;
	};

	/*
	var updateScrollBoundaries = function()
	{
		if(_PIXIScrollStage==null)
			return;

		var globalBX1 = boundarX1;
		var globalBX2 = boundarX2;
		var globalBY1 = boundarY1;
		var globalBY2 = boundarY2;

		// TODO: CONTINUE HERE XHEREX
		if(globalBX1 != 'not set')
			globalBX1 = 0;

	};
*/
	// center screen along boundaries on the x position.
	var _centerScreenX=function()
    {
		if(boundarX1 == 'not set' || boundarX2 == 'not set')
			return;
        // center the screen.
        var sc=RUNPIXI.getScreenSize();
        var sw = sc.w - boundarX2 - boundarX1;
        RSTAGE().position.x = sw *0.5;
	};
	this.centerScreenX=function() {_centerScreenX();};
	// ENDOF 0.6.4

	// DONE this function is called each frame.
	var _MainLoopFunction = function() {};
	this.setMainLoopFunction = function(m)
	{
		if(typeof(m) === 'function')
			_MainLoopFunction = m;
		else
			console.log("ERROR: RUNPIXI.setMainLoopMethod needs a function as parameter.");
	};

	// DONE this is called after resize.	
	var _resizeFunction = null;
	this.setResizeFunction = function(m)
	{
		if(typeof(m) === 'function')
			_resizeFunction = m;
		else
			console.log("ERROR: RUNPIXI.setResizeMethod needs a function as parameter.");
	};

	// 0.4.0 Register a key.
	// 0.5.0 Use isKeyCode instead of keyCode
	// 0.6.0 Use ctrl key.
	this.registerKey = function(keychar, iskeycode, needsCtrl, downfunction, upfunction, downparams, upparams)
		{return _registerKey(keychar, iskeycode, needsCtrl, downfunction, upfunction, downparams, upparams);};

	// 0.4.1 Register key in private function.
	// 0.5.0 Use isKeyCode instead of keyCode
	// 0.6.0 new: use control key.
	var _registerKey = function(keychar, iskeycode, needsCtrl, downfunction, upfunction, downparams, upparams)
	{
		var k = new RUNPIXIKEY();
		k.Set(keychar, iskeycode, downfunction, upfunction);
		k.useCtrl(needsCtrl);
		k.SetDownFuncParams(downparams);
		k.SetUpFuncParams(upparams);
		_keys.push(k);
		return k;
	};

	// 0.4.1 Register key for scrolling.
	// 0.5.0 Use isKeyCode instead of keyCode
	// 0.6.0 needs ctrl flag
	this.registerScrollKey = function(keyCharacter, direction, isKeyCode, needsCtrl)
	{
		var params = new Object();
		params.direction = 0;
		if(direction == 'left' || direction == 'up')
			params.direction = -1;
		if(direction == 'right' || direction == 'down')
			params.direction = 1;

		if(params.direction == 0)
		{
			console.log("RUNPIXI: registerScrollKey: Direction must be 'left', 'right', 'up' or 'down'. It's ["+direction+"].");
			return;
		}

		params.isVertical = false;
		// on keyup, the direction is 0. We need new params.
		var upparams = new Object();
		upparams.direction = 0;
		upparams.isVertical = false;

		if(direction == 'up' || direction == 'down')
		{
			params.isVertical = true;
			upparams.isVertical = true;
		};

		_registerKey(keyCharacter, isKeyCode, needsCtrl, _scrollHook, _scrollHook, params, upparams);
	};

	// 0.4.0 clear all keys.
	this.clearAllKeys = function() {_keys = new Array();};

	this.BACKSTAGE = function() {return _PIXIBackStage;};
	this.SCROLLSTAGE = function() {return _PIXIScrollStage;};
	this.HUDSTAGE = function() {return _PIXIHUDStage;};

	// DONE ground work
	var _PIXIRenderer = null;
	// 0.3.3: get renderer
	this.RENDERER = function() {return _PIXIRenderer;};

	var _PIXIDOMScreen = null; 	// [new] not using jquery.
	var _PIXIWidth = 0;
	var _PIXIHeight = 0;

	// DONE 0.3.2: Return screen size.
	this.getScreenSize = function() {var o=new Object();o.x = _PIXIWidth;o.w = _PIXIWidth; o.y=_PIXIHeight; o.h=_PIXIHeight; return o;}

	// DONE render function.
	// _MainLoopFunction is "your" function.
	var _PIXILoopMethod = function()
	{
		requestAnimationFrame(_PIXILoopMethod);
		_MainLoopFunction();
		_ScrollUpdate();
		_PIXIRenderer.render(_PIXIRootStage);
	};

	// DONE Initialize PIXI.
	/*
		0.6.3: New backgroundColor (not offensive to older versions.)
			Use "transparent" for a transparent background.
			You can use hex colors: 0xRRGGBB (R = Red, G = Green, B = Blue), e.g. 0x00FF00 for full green.
	*/
	var _PIXIInitialize = function(pixicontainerID, backgroundColor)
	{
		if(document.getElementById(pixicontainerID) == null)
		{
			console.log("ERROR: DOM element for PIXI screen not found. Aborting!");
			return;
		}

		// just initialize it once.
		if(_PIXIDOMScreen == null || _PIXIRenderer == null)
		{
			_PIXIDOMScreen = document.getElementById(pixicontainerID);

			_PIXIWidth = _PIXIDOMScreen.clientWidth;
			_PIXIHeight = _PIXIDOMScreen.clientHeight;

			// 0.6.3 set background color.
			var transpar = false;
			var bgcolor = 0x1099bb; // default background color.
			if(backgroundColor=="transparent")
			{
				bgcolor = 0x000000;
                transpar = true;
            }else {
                bgcolor = backgroundColor;
            }
			_PIXIRenderer = PIXI.autoDetectRenderer(_PIXIWidth, _PIXIHeight,{backgroundColor : bgcolor, transparent : transpar});
			_PIXIDOMScreen.appendChild(_PIXIRenderer.view);

			// create hierarchy
			_PIXIRootStage.addChild(_PIXIBackStage);
			_PIXIRootStage.addChild(_PIXIScrollStage);
			_PIXIRootStage.addChild(_PIXIHUDStage);

			// start the pixi loop.
			_PIXILoopMethod();
		}else{
			console.log("PIXI Screen already initialized.");
		}
	};
	// DONE 0.6.3 new: backgroundColor, non offensive to older versions.
	this.initialize = function(pixicontainerID, backgroundColor) {
		if(backgroundColor)
			_PIXIInitialize(pixicontainerID, backgroundColor);
		else
			_PIXIInitialize(pixicontainerID, 0x1099bb);
	};

// 0.4.0
// NEW SCROLLING ENGINE
	var _ScrollDirX = 0; // -1, 0, 1
	var _ScrollDirY = 0; // -1, 0, 1
	var _ScrollRateX = 0;
	var _ScrollRateY = 0;

	this.ScrollX= function(direction) {_scrollActivate(direction, false);};
	this.ScrollY= function(direction) {_scrollActivate(direction, true);};

	// 0.4.1 Hook for the registerscrollkeys function.
	var _scrollHook = function(params)
	{
		// params needs .direction and .isVertical
		_scrollActivate(params.direction, params.isVertical);
	};

	var _scrollActivate = function(direction, isvertical)
	{
		// maybe invert direction
		if((RUNPIXI.Scroll_InvertX == true && isvertical == false) ||
		(RUNPIXI.Scroll_InvertY == true && isvertical == true))
			direction = -direction;

		// get the right value
		var v = _ScrollDirX;
		if(isvertical)
			v = _ScrollDirY;

		// process
		if(direction == 0)
			v = 0;
		else
			v += direction;

		if(v < -1) v = -1;
		if(v > 1) v = 1;

		// set
		if(isvertical)
			_ScrollDirY = v;
		else
			_ScrollDirX = v;
	};

	var _scrollIt = function(isvertical)
	{
		var v = _ScrollDirX;
		var r = _ScrollRateX;
		if(isvertical)
		{
			v = _ScrollDirY;
			r = _ScrollRateY;
		}

		if(v == 0)
		{
			r *= 0.9;
			if(Math.abs(r) < 0.5)
				r = 0;
		}else{
			r += v * (RUNPIXI.ScrollRateMax * 0.1);
		}

		if(r < -RUNPIXI.ScrollRateMax) r = -RUNPIXI.ScrollRateMax;
		if(r > RUNPIXI.ScrollRateMax) r = RUNPIXI.ScrollRateMax;

		if(isvertical)
			_ScrollRateY = r;
		else
			_ScrollRateX = r;
	};

	var _ScrollUpdate = function()
	{
		_scrollIt(false);
		_scrollIt(true);

		_PIXIScrollStage.position.x += _ScrollRateX;
		_PIXIScrollStage.position.y += _ScrollRateY;
	};
// ENDOF NEW SCROLL ENGINE.

	// create and return a sprite
	this.CreateSprite = function(texture, x, y, rotation, anchorx, anchory, scalex,scaley)
	{
		var s = new PIXI.Sprite(texture);
		s.position.x = x;
		s.position.y = y;
		s.anchor.x =anchorx;
		s.anchor.y =anchory;
		s.rotation =rotation;
		s.scale.x=scalex;
		s.scale.y=scaley;
		return s;
	};

	// shader stuff.
	// WARNING: It uses the .shader variable, not the .filters array!
	this.CreateFragmentShader = function(name, shadercode)
	{
		_shaders[name] = new PIXI.AbstractFilter('', shadercode);
		console.log("RUNPIXI: Fragment shader {"+name+"} created.");
		return _shaders[name];
	};
	this.CreateVertexShader = function(name, shadercode)
	{
		_shaders[name] = new PIXI.AbstractFilter(shadercode, '');
		console.log("RUNPIXI: Vertex shader {"+name+"} created.");
		return _shaders[name];
	};

	// 0.6.5 Create a hard coded colour overlay shader.
	// it is named "sh_color_"+myColor (like: "sh_color_"+0xFFFFFF for full white)
    this.CreateColorShader = function(hexColor)
    {
        var shader = RUNPIXI.GetShader('sh_color_'+hexColor);
        if(shader==null)
        {
            // shader does not exist, create it.
            var shCode = "precision mediump float;varying vec2 vTextureCoord;uniform sampler2D uSampler;";
            shCode += "void main(){gl_FragColor=texture2D(uSampler,vTextureCoord);";
            shCode += "if(gl_FragColor.r==0.0 && gl_FragColor.g==0.0 && gl_FragColor.b==0.0){return;}";
            shCode += "gl_FragColor.r="+ getRedFromHex_normalized(hexColor) + ";";
            shCode += "gl_FragColor.g="+ getGreenFromHex_normalized(hexColor) + ";";
            shCode += "gl_FragColor.b="+ getBlueFromHex_normalized(hexColor) + ";";
            shCode += "}";
            return RUNPIXI.CreateFragmentShader('sh_color_' + hexColor, shCode);
        }
		return false;
    };

    this.GetShader = function(name) {return _shaders[name];};
	// pre-0.6.5 -> Set shader to shader variable.
	this.ApplyShader = function(pixiSprite, shaderName)
	{
		var shader = this.GetShader(shaderName);
		if(shader)
		{
            pixiSprite.shader = shader;
            return true;
        }
        return false;
	};

	// 0.6.5 -> Set shader to filters array.
	this.ApplyFilter =function(pixiSprite, shaderName)
	{
		var shader= this.GetShader(shaderName);
		if(shader)
		{
			pixiSprite.filters = [shader];
            		return true;
        	}
		return false;
	};

	// render the screen to a texture and return that.
	this.getScreenAsTexture = function(renderWidth, renderHeight)
	{
		// _PIXIRootStage is the container which has to be scaled and rendered to texture.
		// _PIXIRenderer is the renderer of this class.

		var renderer = _PIXIRenderer;

		// set render size if <= 0
		if(renderWidth <= 0)
			renderWidth = renderer.width;
		if(renderHeight <= 0)
			renderHeight = renderer.height;

		// compute scaling factor.
		var scale = 1;
		var sc = renderWidth;
		var sc2 = renderer.width;
		if(renderHeight<renderWidth)
		{
			sc = renderHeight;
			sc2 = renderer.height;
		}
		if(sc > 0 && sc2 > 0)
			scale = sc / sc2;

		// first, render the screen to a texture.
		var origTex = new PIXI.RenderTexture(renderer, renderer.width, renderer.height);
		origTex.render(_PIXIRootStage);

		// create sprite and container to resize the texture
		var stage = new PIXI.Container();
		var sprite = new PIXI.Sprite(origTex);
		sprite.scale.x = scale;
		sprite.scale.y = scale;
		stage.addChild(sprite);

		// render the original again in scaled mode.
		var renderTex = new PIXI.RenderTexture(renderer, renderWidth, renderHeight);
		renderTex.render(stage);

		// remove the unused stuff.
		stage.destroy();
		sprite.destroy();
		origTex.destroy();

		// finally return the scaled texture.
 		return renderTex;
	};

	// returns the screen as an array of size 4*width*height, rgba
	this.getScreenAsArray = function(width, height)
	{
		if(_PIXIRenderer==null)
			return;
		var rtex = this.getScreenAsTexture(width, height);
		var data = rtex.getPixels();
		rtex.destroy();
		return data;
	};

	// 0.6.1: reset scrolling and zooming factor.
	var _resetScrollRotationZoom = function(unusedparameter)
	{
		if(_PIXIScrollStage==null)
			return;

		_PIXIScrollStage.position.x = 0;
		_PIXIScrollStage.position.y = 0;
		_PIXIScrollStage.rotation = 0;
		_PIXIScrollStage.scale.x = 1;
		_PIXIScrollStage.scale.y = 1;
		// 0.6.2 also reset pivot.
		_PIXIScrollStage.pivot.x = 0;
		_PIXIScrollStage.pivot.y = 0;

		// 0.6.4 Center screen if boundaries are set. (horizontally)
		_centerScreenX();
	};

	// 0.6.2: returns the global mouse position as an x,y object.
	this.GlobalMousePosition = function()
	{
		if(_PIXIRenderer!=null)
			return _PIXIRenderer.plugins.interaction.mouse.global;
        return {'x':0,'y':0};
	};

	// press or release a registered key.
	var _key = function(event, keystate)
	{
		for(var i = 0; i < _keys.length; i++)
		{
			if(keystate=='down')
				_keys[i].Down(event);
			if(keystate=='up')
				_keys[i].Up(event);
		};
	};

	// DONE resize renderer if size changes.
	window.addEventListener('resize', function(event){
		if(_PIXIDOMScreen==null || _PIXIRenderer==null)
			return;

		_PIXIWidth = _PIXIDOMScreen.clientWidth;
		_PIXIHeight = _PIXIDOMScreen.clientHeight;
		_PIXIRenderer.resize(_PIXIWidth, _PIXIHeight);
		if(typeof(_resizeFunction) === 'function')
			_resizeFunction(event);
	});

	// keydown and keyup.
	document.addEventListener('keydown', function(e){_key(e,'down');});
	document.addEventListener('keyup', function(e) {_key(e,'up');});

	// 0.6.1: ADD Scroll Reset KEY (Ctrl+Enter)
	_registerKey(13, true, true, _resetScrollRotationZoom, null, null, null);

};
// DONE
RUNPIXI.instance = new RUNPIXI();

// SCROLL stuff
RUNPIXI.ScrollRateMax = 10; // Maximum scroll speed in pixels/frame.
// 0.4.1
RUNPIXI.Scroll_InvertX = true;
RUNPIXI.Scroll_InvertY = true;

// 0.4.1 register some keys for scrolling.
// 0.5.0 function gets other parameters.
// 0.6.0 use control key for scrolling, only arrow keys.
// ASDW
/*RUNPIXI.instance.registerScrollKey('a','left', false, true);
RUNPIXI.instance.registerScrollKey('d','right', false, true);
RUNPIXI.instance.registerScrollKey('w','up', false, true);
RUNPIXI.instance.registerScrollKey('s','down', false, true);
*/
// ARROW KEYS
RUNPIXI.instance.registerScrollKey(37,'left', true, true);
RUNPIXI.instance.registerScrollKey(39,'right', true, true);
RUNPIXI.instance.registerScrollKey(38,'up', true, true);
RUNPIXI.instance.registerScrollKey(40,'down', true, true);
// ENDOF Scroll stuff.

// 0.3.2: DONE Return PIXI size.
RUNPIXI.getScreenSize = function() {return RUNPIXI.instance.getScreenSize();}

// create sprite with position, rotation, anchor and size.
RUNPIXI.CreateSprite = function(texture, x, y, rotation, anchorx, anchory, scalex, scaley) {return RUNPIXI.instance.CreateSprite(texture,x,y,rotation,anchorx,anchory, scalex, scaley);};
// short of createsprite, only with position - anchor is 0.5, scale is 1, rotation is 0
RUNPIXI.Sprite = function(texture, x, y) {return RUNPIXI.instance.CreateSprite(texture, x, y,0,0.5,0.5,1,1);};

// Shader stuff.
RUNPIXI.CreateFragmentShader = function(name, shadercode) {return RUNPIXI.instance.CreateFragmentShader(name,shadercode);};
RUNPIXI.CreateVertexShader = function(name, shadercode) {return RUNPIXI.instance.CreateVertexShader(name,shadercode);};
RUNPIXI.ApplyShader = function(pixiSprite, shaderName) {return RUNPIXI.instance.ApplyShader(pixiSprite,shaderName);};
RUNPIXI.GetShader = function(name) {return RUNPIXI.instance.GetShader(name);};
// 0.6.5 Create a color shader.
RUNPIXI.CreateColorShader = function(hexColor) {return RUNPIXI.instance.CreateColorShader(hexColor);};
// 0.6.5 apply the shader to the filters array.
RUNPIXI.ApplyFilter = function(pixiSprite, shaderName) {return RUNPIXI.instance.ApplyFilter(pixiSprite,shaderName);};

// shorts to the stages.
RUNPIXI.STAGE = function() {return RUNPIXI.instance.SCROLLSTAGE();};
RUNPIXI.BACKSTAGE = function() {return RUNPIXI.instance.BACKSTAGE();};
RUNPIXI.HUDSTAGE = function() {return RUNPIXI.instance.HUDSTAGE();};

// shorter short for RUNPIXI.STAGE() or RUNPIXI.instance.STAGE()
RSTAGE = function() {return RUNPIXI.instance.SCROLLSTAGE();};
RBACKSTAGE = function() {return RUNPIXI.instance.BACKSTAGE();};
RHUDSTAGE = function() {return RUNPIXI.instance.HUDSTAGE();};

// Get renderer.
RUNPIXI.RENDERER = function() {return RUNPIXI.instance.RENDERER();};

// the MAIN function. ;)
// 0.6.3: new backgroundColor, non offensive to older versions.
RUNPIXI.initialize = function(pixicontainerID, mainLoopFunction, backgroundColor) 
{
	if(backgroundColor)
		RUNPIXI.instance.initialize(pixicontainerID, backgroundColor);
	else
		RUNPIXI.instance.initialize(pixicontainerID);
	RUNPIXI.instance.setMainLoopFunction(mainLoopFunction);
};

// Helper to create a pixelart screen.
RUNPIXI.PIXELATED = function() {PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;};

// get screen as texture.
RUNPIXI.GetScreenAsTexture = function(w,h) {return RUNPIXI.instance.getScreenAsTexture(w,h);};
// ..and as array.
RUNPIXI.GetScreenAsArray = function(w,h) {return RUNPIXI.instance.getScreenAsArray(w,h);};

// 0.6.2 Return global mouse position.
RUNPIXI.MOUSE = function() {return RUNPIXI.instance.GlobalMousePosition();};

// 0.6.5 Get Some colour values.
function getRedFromHex_normalized(hexColor) {var r =((1.0 / 0xFF) * ((hexColor >> 16) & 0xFF)); return r.toFixed(4);}
function getGreenFromHex_normalized(hexColor) {var g=((1.0 / 0xFF) * ((hexColor >> 8) & 0xFF)); return g.toFixed(4);}
function getBlueFromHex_normalized(hexColor) {var b=((1.0 / 0xFF) * (hexColor  & 0xFF));return b.toFixed(4);}

console.log("RUNPIXI.js loaded.");
