(function ()
{
  TANK.registerComponent("InputManager")

  .construct(function ()
  {
    var that = this;

    // ### Mouse position
    // Stored as an array [x, y]
    this.mousePos = [0, 0];
    this.lastMousePos = [0, 0];
    this.mousePosWorld = [0, 0];

    // ### Mouse movement
    // The last delta the mouse had
    // Stored as array [x, y]
    this.mouseDelta = [0, 0];

    // ### Prevent default keyboard events
    // When set to true the browser won't handle
    // keyboard events like F5 and Back
    this.preventKeyboardDefault = true;

    // ### Prevent default mouse
    // When set to true the browser won't handle
    // mouse events like drag selecting
    this.preventMouseDefault = true;

    // ### Prevent right click
    // When set to true the browser won't
    // display the default context menu on a
    // right click
    this.preventRightClick = true;

    this.addMouseListeners = function(context)
    {
      context.addEventListener("mousemove", that.mousemove);
      context.addEventListener("mousedown", that.mousedown);
      context.addEventListener("mouseup", that.mouseup);
      context.addEventListener("touchmove", that.touchmove);
      context.addEventListener("touchstart", that.touchstart);
      context.addEventListener("touchend", that.touchend);
      context.addEventListener("mousewheel", that.mousewheel);
      context.addEventListener("contextmenu", that.contextmenu);
      context.addEventListener("gestureend", that.gestureend);
      context.addEventListener("gesturechange", that.gesturechange);
    };

    this.removeMouseListeners = function(context)
    {
      context.removeEventListener("mousemove", that.mousemove);
      context.removeEventListener("mousedown", that.mousedown);
      context.removeEventListener("mouseup", that.mouseup);
      context.removeEventListener("touchmove", that.touchmove);
      context.removeEventListener("touchstart", that.touchstart);
      context.removeEventListener("touchend", that.touchend);
      context.removeEventListener("mousewheel", that.mousewheel);
      context.removeEventListener("contextmenu", that.contextmenu);
      context.removeEventListener("gestureend", that.gestureend);
      context.removeEventListener("gesturechange", that.gesturechange);
    };

    // ### Input UI element
    // Defines which HTML element mouse input is relative to
    // If left null mouse input will be relative to window
    addProperty(this, "context", function ()
    {
      return that._context;
    }, function (val)
    {
      if (that._context)
      {
        that.removeMouseListeners(that.context);
      }
      else
      {
        that.removeMouseListeners(window);
      }

      that._context = val;
      if (that._context)
      {
        that.addMouseListeners(that.context);
      }
      else
      {
        that.addMouseListeners(window);
      }
    });

    this._context = null;
    this._keyDownEvents = [];
    this._keyUpEvents = [];
    this._mouseMoveEvents = [];
    this._mouseDownEvents = [];
    this._mouseUpEvents = [];
    this._mouseWheelEvents = [];
    this._gestureEndEvents = [];
    this._gestureChangeEvents = [];
    this._keysHeld = {};
    this._buttonsHeld = {};

    var that = this;
    this.keydown = function (e)
    {
      if (!that._keysHeld[e.keyCode])
        that._keyDownEvents.push(e);

      if (that.preventKeyboardDefault)
      {
        if (e.preventDefault)
          e.preventDefault();
        if (e.stopPropagation)
          e.stopPropagation();
      }

      return false;
    };

    this.keyup = function (e)
    {
      if (that._keysHeld[e.keyCode])
        that._keyUpEvents.push(e);
      if (e.preventDefault)
        e.preventDefault();
      if (e.stopPropagation)
        e.stopPropagation();

      if (that.preventKeyboardDefault)
      {
        if (e.preventDefault)
          e.preventDefault();
        if (e.stopPropagation)
          e.stopPropagation();
      }

      return false;
    };

    this.mousemove = function (e)
    {
      that._mouseMoveEvents.push(e);

      if (that.preventMouseDefault)
      {
        if (e.preventDefault)
          e.preventDefault();
        if (e.stopPropagation)
          e.stopPropagation();
      }

      return false;
    };

    this.mousedown = function (e)
    {
      that._mouseDownEvents.push(e);

      if (that.preventMouseDefault)
      {
        if (e.preventDefault)
          e.preventDefault();
        if (e.stopPropagation)
          e.stopPropagation();
      }

      return false;
    };

    this.mouseup = function (e)
    {
      that._mouseUpEvents.push(e);

      if (that.preventMouseDefault)
      {
        if (e.preventDefault)
          e.preventDefault();
        if (e.stopPropagation)
          e.stopPropagation();
      }

      return false;
    };

    this.mousewheel = function (e)
    {
      that._mouseWheelEvents.push(e);

      if (that.preventMouseDefault)
      {
        if (e.preventDefault)
          e.preventDefault();
        if (e.stopPropagation)
          e.stopPropagation();
      }

      return false;
    }

    this.touchmove = function(e)
    {
      for (var i = 0; i < e.touches.length; ++i)
      {
        e.touches[i].x = e.touches[i].pageX;
        e.touches[i].y = e.touches[i].pageY;
        that._mouseMoveEvents.push(e.touches[i]);
      }
      if (e.touches.length === 0)
      {
        e.x = e.pageX;
        e.y = e.pageY;
        that._mouseMoveEvents.push(e);
      }

      if (that.preventMouseDefault)
      {
        if (e.preventDefault)
          e.preventDefault();
        if (e.stopPropagation)
          e.stopPropagation();
      }
    };

    this.touchstart = function(e)
    {
      for (var i = 0; i < e.touches.length; ++i)
      {
        e.touches[i].x = e.touches[i].pageX;
        e.touches[i].y = e.touches[i].pageY;
        e.touches[i].button = 0;
        that._mouseDownEvents.push(e.touches[i]);
      }

      if (that.preventMouseDefault)
      {
        if (e.preventDefault)
          e.preventDefault();
        if (e.stopPropagation)
          e.stopPropagation();
      }
    };

    this.touchend = function(e)
    {
      for (var i = 0; i < e.touches.length; ++i)
      {
        e.touches[i].x = e.touches[i].pageX;
        e.touches[i].y = e.touches[i].pageY;
        e.touches[i].button = 0;
        that._mouseUpEvents.push(e.touches[i]);
      }
      if (e.touches.length === 0)
      {
        e.button = 0;
        that._mouseUpEvents.push(e);
      }

      if (that.preventMouseDefault)
      {
        if (e.preventDefault)
          e.preventDefault();
        if (e.stopPropagation)
          e.stopPropagation();
      }
    };

    this.gestureend = function (e)
    {
      that._gestureEndEvents.push(e);

      if (that.preventMouseDefault)
      {
        if (e.preventDefault)
          e.preventDefault();
        if (e.stopPropagation)
          e.stopPropagation();
      }

      return false;
    }

    this.gesturechange = function (e)
    {
      that._gestureChangeEvents.push(e);

      if (that.preventMouseDefault)
      {
        if (e.preventDefault)
          e.preventDefault();
        if (e.stopPropagation)
          e.stopPropagation();
      }

      return false;
    }

    this.contextmenu = function (e)
    {
      if (that.preventRightClick)
      {
        if (e.preventDefault)
          e.preventDefault();
        if (e.stopPropagation)
          e.stopPropagation();
      }

      return false;
    }

    this.context = null;
  })

  .initialize(function ()
  {
    addEventListener("keydown", this.keydown);
    addEventListener("keyup", this.keyup);
    this.update = OnEnterFrame;
  })

  .destruct(function ()
  {
    removeEventListener("keydown", this.keydown);
    removeEventListener("keyup", this.keyup);
    if (this.context)
    {
      this.removeMouseListeners(this.context);
    }
    else
    {
      this.addMouseListeners(window);
    }
  });

  var OnEnterFrame = function (dt)
  {
    var e;
    // Handle key down events
    for (var i in this._keyDownEvents)
    {
      e = this._keyDownEvents[i];
      this.space.dispatchEvent("OnKeyPress", e.keyCode, this._keysHeld, this._buttonsHeld);
      this._keysHeld[e.keyCode] = true;
    }
    this._keyDownEvents = [];

    for (var i in this._keysHeld)
    {
      this.space.dispatchEvent("OnKeyHeld", i);
    }

    // Handle key up events
    for (var i in this._keyUpEvents)
    {
      e = this._keyUpEvents[i];
      this.space.dispatchEvent("OnKeyRelease", e.keyCode, this._keysHeld, this._buttonsHeld);
      delete this._keysHeld[e.keyCode];
    }
    this._keyUpEvents = [];

    // Handle mouse move events
    for (var i in this._mouseMoveEvents)
    {
      e = this._mouseMoveEvents[i];

      this.mousePos = [e.x, e.y];
      if (this._context)
      {
        this.mousePos[0] -= this._context.offsetLeft;
        this.mousePos[1] -= this._context.offsetTop;
      }
      this.mouseDelta = [this.mousePos[0] - this.lastMousePos[0], this.mousePos[1] - this.lastMousePos[1]];

      this.lastMousePos[0] = this.mousePos[0];
      this.lastMousePos[1] = this.mousePos[1];

      this.mousePosWorld = [this.mousePos[0], this.mousePos[1]];
      this.mousePosWorld[0] -= window.innerWidth / 2;
      this.mousePosWorld[1] -= window.innerHeight / 2;
      this.mousePosWorld[0] *= TANK.RenderManager.camera.z;
      this.mousePosWorld[1] *= TANK.RenderManager.camera.z;
      this.mousePosWorld[0] += TANK.RenderManager.camera.x;
      this.mousePosWorld[1] += TANK.RenderManager.camera.y;

      var mouseEvent = {};
      mouseEvent.x = this.mousePos[0];
      mouseEvent.y = this.mousePos[1];
      mouseEvent.moveX = this.mouseDelta[0];
      mouseEvent.moveY = this.mouseDelta[1];
      this.space.dispatchEvent("OnMouseMove", mouseEvent, this._keysHeld, this._buttonsHeld);
    }
    this._mouseMoveEvents = [];

    // Handle mouse down events
    for (var i in this._mouseDownEvents)
    {
      e = this._mouseDownEvents[i];

      this.mousePos = [e.x, e.y];
      if (this._context)
      {
        this.mousePos[0] -= this._context.offsetLeft;
        this.mousePos[1] -= this._context.offsetTop;
      }

      this.mousePosWorld = [this.mousePos[0], this.mousePos[1]];
      this.mousePosWorld[0] -= window.innerWidth / 2;
      this.mousePosWorld[1] -= window.innerHeight / 2;
      this.mousePosWorld[0] *= TANK.RenderManager.camera.z;
      this.mousePosWorld[1] *= TANK.RenderManager.camera.z;
      this.mousePosWorld[0] += TANK.RenderManager.camera.x;
      this.mousePosWorld[1] += TANK.RenderManager.camera.y;

      this.space.dispatchEvent("OnMouseDown", e.button, this._keysHeld, this._buttonsHeld);
      this._buttonsHeld[e.button] = true;
    }
    this._mouseDownEvents = [];

    for (var i in this._buttonsHeld)
    {
      this.space.dispatchEvent("OnMouseButtonHeld", i);
    }

    // Handle mouse up events
    for (var i in this._mouseUpEvents)
    {
      e = this._mouseUpEvents[i];
      this.space.dispatchEvent("OnMouseUp", e.button, this._keysHeld, this._buttonsHeld);
      delete this._buttonsHeld[e.button];
    }
    this._mouseUpEvents = [];

    // Handle mouse wheel events
    for (var i in this._mouseWheelEvents)
    {
      e = this._mouseWheelEvents[i];
      this.space.dispatchEvent("OnMouseWheel", e.wheelDelta, this._keysHeld, this._buttonsHeld);
    }
    this._mouseWheelEvents = [];

    // Handle gesture events
    for (var i = 0; i < this._gestureChangeEvents.length; ++i)
    {
      e = this._gestureChangeEvents[i];
      this.space.dispatchEvent("OnGestureChange", e);
    }
    this._gestureChangeEvents = [];

    for (var i = 0; i < this._gestureEndEvents.length; ++i)
    {
      e = this._gestureEndEvents[i];
      this.space.dispatchEvent("OnGestureEnd", e);
    }
    this._gestureEndEvents = [];

    this.mousePosWorld = [this.mousePos[0], this.mousePos[1]];
    this.mousePosWorld[0] -= window.innerWidth / 2;
    this.mousePosWorld[1] -= window.innerHeight / 2;
    this.mousePosWorld[0] *= TANK.RenderManager.camera.z;
    this.mousePosWorld[1] *= TANK.RenderManager.camera.z;
    this.mousePosWorld[0] += TANK.RenderManager.camera.x;
    this.mousePosWorld[1] += TANK.RenderManager.camera.y;
  };
}());