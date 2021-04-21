// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
  Module['arguments'] = process['argv'].slice(2);

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    var data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    window['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
if (!Module['thisProgram']) {
  Module['thisProgram'] = './this.program';
}

// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in: 
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at: 
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  setTempRet0: function (value) {
    tempRet0 = value;
  },
  getTempRet0: function () {
    return tempRet0;
  },
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  STACK_ALIGN: 16,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      assert(args.length == sig.length-1);
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      assert(sig.length == 1);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    var source = Pointer_stringify(code);
    if (source[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (source.indexOf('"', 1) === source.length-1) {
        source = source.substr(1, source.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + source + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    try {
      // Module is the only 'upvar', which we provide directly. We also provide FS for legacy support.
      var evalled = eval('(function(Module, FS) { return function(' + args.join(',') + '){ ' + source + ' } })')(Module, typeof FS !== 'undefined' ? FS : null);
    } catch(e) {
      Module.printErr('error in executing inline EM_ASM code: ' + e + ' on: \n\n' + source + '\n\nwith args |' + args + '| (make sure to use the right one out of EM_ASM, EM_ASM_ARGS, etc.)');
      throw e;
    }
    return Runtime.asmConstCache[code] = evalled;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[sig]) {
      Runtime.funcWrappers[sig] = {};
    }
    var sigCache = Runtime.funcWrappers[sig];
    if (!sigCache[func]) {
      sigCache[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return sigCache[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          (((codePoint - 0x10000) / 0x400)|0) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      /* TODO: use TextEncoder when present,
        var encoder = new TextEncoder();
        encoder['encoding'] = "utf-8";
        var utf8Array = encoder['encode'](aMsg.data);
      */
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+15)&-16);(assert((((STACKTOP|0) < (STACK_MAX|0))|0))|0); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + (assert(!staticSealed),size))|0;STATICTOP = (((STATICTOP)+15)&-16); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + (assert(DYNAMICTOP > 0),size))|0;DYNAMICTOP = (((DYNAMICTOP)+15)&-16); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 16))*(quantum ? quantum : 16); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  if (!func) {
    try {
      func = eval('_' + ident); // explicit lookup
    } catch(e) {}
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

var cwrap, ccall;
(function(){
  var stack = 0;
  var JSfuncs = {
    'stackSave' : function() {
      stack = Runtime.stackSave();
    },
    'stackRestore' : function() {
      Runtime.stackRestore(stack);
    },
    // type conversion from js to c
    'arrayToC' : function(arr) {
      var ret = Runtime.stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    },
    'stringToC' : function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        ret = Runtime.stackAlloc((str.length << 2) + 1);
        writeStringToMemory(str, ret);
      }
      return ret;
    }
  };
  // For fast lookup of conversion functions
  var toC = {'string' : JSfuncs['stringToC'], 'array' : JSfuncs['arrayToC']};

  // C calling interface. 
  ccall = function ccallFunc(ident, returnType, argTypes, args) {
    var func = getCFunc(ident);
    var cArgs = [];
    assert(returnType !== 'array', 'Return type should not be "array".');
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (stack === 0) stack = Runtime.stackSave();
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func.apply(null, cArgs);
    if (returnType === 'string') ret = Pointer_stringify(ret);
    if (stack !== 0) JSfuncs['stackRestore']();
    return ret;
  }

  var sourceRegex = /^function\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
  function parseJSFunc(jsfunc) {
    // Match the body and the return value of a javascript function source
    var parsed = jsfunc.toString().match(sourceRegex).slice(1);
    return {arguments : parsed[0], body : parsed[1], returnValue: parsed[2]}
  }
  var JSsource = {};
  for (var fun in JSfuncs) {
    if (JSfuncs.hasOwnProperty(fun)) {
      // Elements of toCsource are arrays of three items:
      // the code, and the return value
      JSsource[fun] = parseJSFunc(JSfuncs[fun]);
    }
  }

  
  cwrap = function cwrap(ident, returnType, argTypes) {
    argTypes = argTypes || [];
    var cfunc = getCFunc(ident);
    // When the function takes numbers and returns a number, we can just return
    // the original function
    var numericArgs = argTypes.every(function(type){ return type === 'number'});
    var numericRet = (returnType !== 'string');
    if ( numericRet && numericArgs) {
      return cfunc;
    }
    // Creation of the arguments list (["$1","$2",...,"$nargs"])
    var argNames = argTypes.map(function(x,i){return '$'+i});
    var funcstr = "(function(" + argNames.join(',') + ") {";
    var nargs = argTypes.length;
    if (!numericArgs) {
      // Generate the code needed to convert the arguments from javascript
      // values to pointers
      funcstr += JSsource['stackSave'].body + ';';
      for (var i = 0; i < nargs; i++) {
        var arg = argNames[i], type = argTypes[i];
        if (type === 'number') continue;
        var convertCode = JSsource[type + 'ToC']; // [code, return]
        funcstr += 'var ' + convertCode.arguments + ' = ' + arg + ';';
        funcstr += convertCode.body + ';';
        funcstr += arg + '=' + convertCode.returnValue + ';';
      }
    }

    // When the code is compressed, the name of cfunc is not literally 'cfunc' anymore
    var cfuncname = parseJSFunc(function(){return cfunc}).returnValue;
    // Call the function
    funcstr += 'var ret = ' + cfuncname + '(' + argNames.join(',') + ');';
    if (!numericRet) { // Return type can only by 'string' or 'number'
      // Convert the result to a string
      var strgfy = parseJSFunc(function(){return Pointer_stringify}).returnValue;
      funcstr += 'ret = ' + strgfy + '(ret);';
    }
    if (!numericArgs) {
      // If we had a stack, restore it
      funcstr += JSsource['stackRestore'].body + ';';
    }
    funcstr += 'return ret})';
    return eval(funcstr);
  };
})();
Module["cwrap"] = cwrap;
Module["ccall"] = ccall;


function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;


function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  if (length === 0) return '';
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    assert(ptr + i < TOTAL_MEMORY);
    t = HEAPU8[(((ptr)+(i))>>0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    assert(ptr + i < TOTAL_MEMORY);
    t = HEAPU8[(((ptr)+(i))>>0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;


function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;


function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;


function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  var hasLibcxxabi = !!Module['___cxa_demangle'];
  if (hasLibcxxabi) {
    try {
      var buf = _malloc(func.length);
      writeStringToMemory(func.substr(1), buf);
      var status = _malloc(4);
      var ret = Module['___cxa_demangle'](buf, 0, 0, status);
      if (getValue(status, 'i32') === 0 && ret) {
        return Pointer_stringify(ret);
      }
      // otherwise, libcxxabi failed, we can try ours which may return a partial result
    } catch(e) {
      // failure when using libcxxabi, we can try ours which may return a partial result
    } finally {
      if (buf) _free(buf);
      if (status) _free(status);
      if (ret) _free(ret);
    }
  }
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    if (rawList) {
      if (ret) {
        list.push(ret + '?');
      }
      return list;
    } else {
      return ret + flushList();
    }
  }
  var final = func;
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    final = parse();
  } catch(e) {
    final += '?';
  }
  if (final.indexOf('?') >= 0 && !hasLibcxxabi) {
    Runtime.warnOnce('warning: a problem occurred in builtin C++ name demangling; build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
  }
  return final;
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function jsStackTrace() {
  var err = new Error();
  if (!err.stack) {
    // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
    // so try that as a special-case.
    try {
      throw new Error(0);
    } catch(e) {
      err = e;
    }
    if (!err.stack) {
      return '(no stack trace available)';
    }
  }
  return err.stack.toString();
}

function stackTrace() {
  return demangleAll(jsStackTrace());
}
Module['stackTrace'] = stackTrace;

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}


var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 64*1024;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be compliant with the asm.js spec');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['buffer'] = buffer;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;
var runtimeExited = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    Module.printErr('Exiting runtime. Any attempt to access the compiled C code may fail from now. If you want to keep the runtime alive, set Module["noExitRuntime"] = true or build with -s NO_EXIT_RUNTIME=1');
  }
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true;
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools


function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))>>0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))>>0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
    HEAP8[(((buffer)+(i))>>0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))>>0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 10000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===





STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 1024624;
  /* global initializers */ __ATINIT__.push();
  

/* memory initializer */ allocate([0,0,0,0,0,0,0,0,12,0,0,0,13,0,0,0,27,0,0,0,35,0,0,0,64,0,0,0,111,0,0,0,163,0,0,0,246,0,0,0,91,1,0,0,249,1,0,0,26,3,0,0,165,4,0,0,227,6,0,0,56,11,0,0,213,16,0,0,210,25,0,0,133,38,0,0,87,40,0,0,84,76,0,0,6,135,0,0,185,124,0,0,253,158,0,0,226,148,1,0,211,135,2,0,61,253,1,0,147,22,5,0,148,164,7,0,227,24,13,0,9,0,0,0,11,0,0,0,28,0,0,0,27,0,0,0,66,0,0,0,42,0,0,0,154,0,0,0,189,0,0,0,146,1,0,0,220,0,0,0,69,1,0,0,120,3,0,0,250,3,0,0,161,12,0,0,174,14,0,0,65,27,0,0,63,14,0,0,158,29,0,0,214,77,0,0,107,37,0,0,215,192,0,0,223,13,1,0,40,234,1,0,23,98,1,0,167,156,3,0,58,186,5,0,249,162,8,0,126,2,14,0,9,0,0,0,17,0,0,0,10,0,0,0,27,0,0,0,28,0,0,0,54,0,0,0,83,0,0,0,242,0,0,0,66,1,0,0,89,2,0,0,192,3,0,0,3,1,0,0,220,5,0,0,254,5,0,0,194,15,0,0,150,6,0,0,233,15,0,0,212,27,0,0,62,45,0,0,110,49,0,0,230,42,0,0,8,47,1,0,74,234,0,0,21,234,0,0,155,174,1,0,17,144,1,0,147,23,6,0,210,168,7,0,13,0,0,0,10,0,0,0,11,0,0,0,36,0,0,0,28,0,0,0,118,0,0,0,43,0,0,0,102,0,0,0,162,1,0,0,132,2,0,0,16,2,0,0,58,4,0,0,176,1,0,0,125,11,0,0,171,7,0,0,235,14,0,0,231,9,0,0,22,32,0,0,105,43,0,0,232,104,0,0,199,13,0,0,78,252,0,0,27,183,0,0,101,228,2,0,3,235,1,0,56,218,5,0,179,246,9,0,61,149,3,0,12,0,0,0,15,0,0,0,11,0,0,0,22,0,0,0,44,0,0,0,20,0,0,0,82,0,0,0,250,0,0,0,215,0,0,0,100,2,0,0,247,0,0,0,213,2,0,0,52,5,0,0,94,11,0,0,218,2,0,0,10,9,0,0,102,13,0,0,128,37,0,0,9,96,0,0,241,147,0,0,186,105,0,0,229,153,0,0,116,45,1,0,63,8,1,0,163,220,0,0,22,119,4,0,192,106,5,0,21,7,7,0,12,0,0,0,15,0,0,0,20,0,0,0,29,0,0,0,44,0,0,0,31,0,0,0,92,0,0,0,250,0,0,0,220,0,0,0,160,0,0,0,247,0,0,0,43,3,0,0,155,8,0,0,137,1,0,0,130,2,0,0,15,22,0,0,137,38,0,0,31,40,0,0,22,34,0,0,150,151,0,0,170,51,0,0,155,129,0,0,77,68,1,0,43,36,1,0,39,110,1,0,187,160,0,0,155,144,6,0,252,124,0,0,12,0,0,0,15,0,0,0,11,0,0,0,29,0,0,0,55,0,0,0,31,0,0,0,150,0,0,0,102,0,0,0,83,1,0,0,206,0,0,0,82,1,0,0,124,2,0,0,126,0,0,0,4,7,0,0,222,5,0,0,113,15,0,0,14,11,0,0,209,39,0,0,66,67,0,0,61,115,0,0,202,218,0,0,106,42,0,0,184,239,1,0,13,11,1,0,229,147,3,0,86,183,5,0,18,4,5,0,122,125,11,0,12,0,0,0,15,0,0,0,11,0,0,0,20,0,0,0,67,0,0,0,72,0,0,0,59,0,0,0,250,0,0,0,83,1,0,0,206,0,0,0,110,1,0,0,197,3,0,0,192,8,0,0,151,3,0,0,198,8,0,0,30,14,0,0,112,36,0,0,48,42,0,0,163,1,0,0,119,67,0,0,223,73,0,0,23,152,0,0,205,56,0,0,61,142,2,0,133,236,0,0,160,187,0,0,216,59,10,0,150,232,3,0,12,0,0,0,15,0,0,0,28,0,0,0,45,0,0,0,10,0,0,0,17,0,0,0,76,0,0,0,24,1,0,0,83,1,0,0,206,0,0,0,79,3,0,0,241,1,0,0,183,6,0,0,190,1,0,0,250,14,0,0,251,19,0,0,224,16,0,0,126,35,0,0,54,19,0,0,79,14,0,0,126,158,0,0,121,168,0,0,235,219,0,0,46,50,2,0,11,5,0,0,253,164,6,0,81,48,6,0,129,12,3,0,12,0,0,0,15,0,0,0,13,0,0,0,5,0,0,0,10,0,0,0,94,0,0,0,76,0,0,0,118,0,0,0,81,1,0,0,166,1,0,0,241,2,0,0,241,1,0,0,4,5,0,0,151,3,0,0,231,5,0,0,167,1,0,0,25,23,0,0,61,9,0,0,54,19,0,0,11,42,0,0,31,81,0,0,140,138,0,0,116,170,0,0,160,36,1,0,241,110,1,0,149,75,4,0,81,48,6,0,63,41,15,0,12,0,0,0,22,0,0,0,13,0,0,0,5,0,0,0,10,0,0,0,14,0,0,0,47,0,0,0,196,0,0,0,218,0,0,0,134,0,0,0,241,2,0,0,210,5,0,0,110,3,0,0,151,3,0,0,78,4,0,0,167,1,0,0,125,40,0,0,57,17,0,0,54,19,0,0,11,74,0,0,31,81,0,0,140,138,0,0,135,45,0,0,121,141,2,0,43,190,3,0,24,119,5,0,198,122,6,0,157,189,3,0,12,0,0,0,15,0,0,0,28,0,0,0,5,0,0,0,10,0,0,0,14,0,0,0,11,0,0,0,118,0,0,0,59,1,0,0,6,2,0,0,236,0,0,0,210,5,0,0,191,7,0,0,93,4,0,0,78,4,0,0,32,21,0,0,80,32,0,0,244,53,0,0,85,61,0,0,18,5,0,0,214,37,0,0,159,20,0,0,200,205,0,0,253,38,1,0,221,253,2,0,201,189,1,0,228,57,10,0,71,30,12,0,3,0,0,0,15,0,0,0,13,0,0,0,21,0,0,0,10,0,0,0,11,0,0,0,11,0,0,0,191,0,0,0,59,1,0,0,134,0,0,0,78,1,0,0,136,1,0,0,10,1,0,0,103,0,0,0,242,5,0,0,2,29,0,0,122,14,0,0,29,22,0,0,46,69,0,0,192,103,0,0,243,185,0,0,78,240,0,0,229,89,1,0,212,31,0,0,87,242,3,0,12,75,5,0,228,57,10,0,5,218,1,0,3,0,0,0,6,0,0,0,13,0,0,0,21,0,0,0,10,0,0,0,14,0,0,0,100,0,0,0,215,0,0,0,59,1,0,0,134,0,0,0,78,1,0,0,11,5,0,0,10,1,0,0,103,0,0,0,242,5,0,0,167,1,0,0,42,24,0,0,128,36,0,0,197,15,0,0,236,66,0,0,243,185,0,0,78,240,0,0,108,116,0,0,74,160,2,0,185,122,2,0,142,165,3,0,51,202,9,0,91,76,2,0,3,0,0,0,6,0,0,0,13,0,0,0,21,0,0,0,38,0,0,0,14,0,0,0,131,0,0,0,121,0,0,0,59,1,0,0,6,2,0,0,205,1,0,0,252,1,0,0,10,1,0,0,103,0,0,0,99,13,0,0,167,1,0,0,126,30,0,0,128,36,0,0,197,15,0,0,236,66,0,0,216,45,0,0,41,109,0,0,6,142,1,0,207,236,1,0,247,177,2,0,129,215,4,0,28,74,3,0,120,192,5,0,12,0,0,0,6,0,0,0,14,0,0,0,21,0,0,0,38,0,0,0,14,0,0,0,116,0,0,0,121,0,0,0,167,0,0,0,140,2,0,0,199,2,0,0,252,1,0,0,10,1,0,0,103,0,0,0,99,13,0,0,231,1,0,0,126,30,0,0,122,40,0,0,192,61,0,0,145,18,0,0,216,45,0,0,63,21,1,0,11,188,1,0,27,140,0,0,95,32,3,0,62,129,2,0,168,230,0,0,163,88,12,0,7,0,0,0,15,0,0,0,14,0,0,0,21,0,0,0,10,0,0,0,94,0,0,0,116,0,0,0,49,0,0,0,167,0,0,0,126,1,0,0,140,2,0,0,11,5,0,0,235,2,0,0,103,0,0,0,88,15,0,0,83,24,0,0,126,30,0,0,128,36,0,0,137,44,0,0,145,18,0,0,129,162,0,0,63,21,1,0,168,187,0,0,27,140,0,0,137,30,1,0,169,138,0,0,232,169,9,0,163,88,12,0,7,0,0,0,15,0,0,0,14,0,0,0,21,0,0,0,10,0,0,0,10,0,0,0,116,0,0,0,49,0,0,0,167,0,0,0,206,0,0,0,125,1,0,0,11,5,0,0,235,2,0,0,103,0,0,0,147,3,0,0,100,10,0,0,162,33,0,0,128,36,0,0,198,75,0,0,9,34,0,0,88,50,0,0,206,81,1,0,11,188,1,0,27,140,0,0,31,161,2,0,130,19,1,0,114,60,1,0,223,69,12,0,12,0,0,0,9,0,0,0,14,0,0,0,21,0,0,0,10,0,0,0,10,0,0,0,116,0,0,0,49,0,0,0,167,0,0,0,158,0,0,0,125,1,0,0,252,1,0,0,127,0,0,0,103,0,0,0,147,3,0,0,83,24,0,0,3,10,0,0,137,33,0,0,94,101,0,0,192,72,0,0,180,128,0,0,206,81,1,0,171,136,0,0,94,219,1,0,209,112,0,0,130,19,1,0,53,81,0,0,24,7,1,0,12,0,0,0,13,0,0,0,14,0,0,0,21,0,0,0,10,0,0,0,10,0,0,0,116,0,0,0,49,0,0,0,105,1,0,0,185,1,0,0,125,1,0,0,11,5,0,0,127,0,0,0,7,9,0,0,234,14,0,0,197,4,0,0,38,45,0,0,106,43,0,0,94,101,0,0,26,51,0,0,81,120,0,0,34,80,0,0,180,188,0,0,203,203,0,0,83,22,2,0,151,162,6,0,130,240,5,0,122,203,14,0,12,0,0,0,2,0,0,0,14,0,0,0,21,0,0,0,10,0,0,0,10,0,0,0,116,0,0,0,49,0,0,0,201,0,0,0,179,0,0,0,140,2,0,0,252,1,0,0,26,8,0,0,45,12,0,0,234,14,0,0,227,14,0,0,38,45,0,0,24,51,0,0,102,17,0,0,135,26,0,0,211,172,0,0,34,80,0,0,134,126,1,0,122,116,1,0,225,220,1,0,178,96,0,0,130,240,5,0,108,162,6,0,12,0,0,0,2,0,0,0,14,0,0,0,21,0,0,0,49,0,0,0,14,0,0,0,138,0,0,0,49,0,0,0,124,0,0,0,185,1,0,0,125,1,0,0,252,1,0,0,127,0,0,0,77,4,0,0,234,14,0,0,197,0,0,0,205,36,0,0,24,51,0,0,155,97,0,0,98,4,0,0,103,208,0,0,218,29,1,0,99,21,0,0,49,189,1,0,225,220,1,0,178,96,0,0,44,191,9,0,122,203,14,0,12,0,0,0,2,0,0,0,14,0,0,0,21,0,0,0,49,0,0,0,14,0,0,0,138,0,0,0,49,0,0,0,124,0,0,0,56,0,0,0,125,1,0,0,99,3,0,0,26,8,0,0,45,12,0,0,234,14,0,0,15,17,0,0,157,4,0,0,24,51,0,0,199,45,0,0,163,75,0,0,103,208,0,0,218,29,1,0,41,193,0,0,49,189,1,0,25,54,4,0,178,96,0,0,44,191,9,0,223,69,12,0,12,0,0,0,13,0,0,0,14,0,0,0,21,0,0,0,49,0,0,0,14,0,0,0,138,0,0,0,49,0,0,0,124,0,0,0,47,2,0,0,125,1,0,0,99,3,0,0,120,5,0,0,45,12,0,0,174,18,0,0,95,1,0,0,205,36,0,0,37,27,0,0,249,33,0,0,135,135,0,0,144,62,0,0,90,168,0,0,194,26,0,0,16,42,1,0,161,252,0,0,184,1,6,0,130,240,5,0,200,248,5,0,12,0,0,0,11,0,0,0,14,0,0,0,21,0,0,0,49,0,0,0,14,0,0,0,138,0,0,0,49,0,0,0,124,0,0,0,47,2,0,0,125,1,0,0,99,3,0,0,103,5,0,0,77,4,0,0,174,18,0,0,1,5,0,0,157,4,0,0,108,13,0,0,172,5,0,0,82,73,0,0,14,137,0,0,90,168,0,0,81,244,0,0,61,227,1,0,131,58,3,0,183,207,1,0,130,240,5,0,209,156,11,0,12,0,0,0,11,0,0,0,14,0,0,0,21,0,0,0,49,0,0,0,14,0,0,0,138,0,0,0,49,0,0,0,124,0,0,0,56,0,0,0,125,1,0,0,99,3,0,0,103,5,0,0,77,4,0,0,174,18,0,0,197,4,0,0,157,4,0,0,108,13,0,0,172,5,0,0,82,73,0,0,14,137,0,0,93,18,0,0,81,244,0,0,61,227,1,0,131,58,3,0,183,207,1,0,14,19,6,0,129,129,11,0,12,0,0,0,10,0,0,0,14,0,0,0,21,0,0,0,49,0,0,0,14,0,0,0,138,0,0,0,49,0,0,0,124,0,0,0,56,0,0,0,125,1,0,0,166,3,0,0,103,5,0,0,77,4,0,0,234,14,0,0,95,1,0,0,157,4,0,0,108,13,0,0,172,5,0,0,82,73,0,0,69,127,0,0,75,234,0,0,224,36,0,0,231,52,2,0,131,58,3,0,3,67,2,0,206,59,1,0,88,29,7,0,3,0,0,0,15,0,0,0,14,0,0,0,21,0,0,0,49,0,0,0,14,0,0,0,138,0,0,0,49,0,0,0,124,0,0,0,56,0,0,0,125,1,0,0,99,3,0,0,103,5,0,0,77,4,0,0,174,18,0,0,95,1,0,0,205,36,0,0,157,51,0,0,172,5,0,0,82,73,0,0,160,9,0,0,75,234,0,0,218,129,0,0,61,227,1,0,235,80,4,0,239,34,4,0,64,65,2,0,129,129,11,0,3,0,0,0,15,0,0,0,14,0,0,0,29,0,0,0,49,0,0,0,11,0,0,0,138,0,0,0,171,0,0,0,124,0,0,0,56,0,0,0,226,0,0,0,99,3,0,0,103,5,0,0,77,4,0,0,234,14,0,0,95,1,0,0,157,4,0,0,242,23,0,0,172,5,0,0,12,61,0,0,160,9,0,0,188,228,0,0,224,36,0,0,190,253,0,0,235,80,4,0,247,109,5,0,64,65,2,0,129,129,11,0,3,0,0,0,15,0,0,0,14,0,0,0,17,0,0,0,49,0,0,0,11,0,0,0,138,0,0,0,171,0,0,0,124,0,0,0,56,0,0,0,70,1,0,0,99,3,0,0,103,5,0,0,199,9,0,0,234,14,0,0,77,28,0,0,157,4,0,0,242,23,0,0,249,33,0,0,82,73,0,0,146,193,0,0,28,17,1,0,218,129,0,0,190,253,0,0,131,58,3,0,154,99,1,0,241,132,4,0,88,29,7,0,12,0,0,0,15,0,0,0,14,0,0,0,17,0,0,0,49,0,0,0,11,0,0,0,101,0,0,0,171,0,0,0,124,0,0,0,56,0,0,0,70,1,0,0,99,3,0,0,103,5,0,0,199,9,0,0,47,5,0,0,192,7,0,0,78,41,0,0,223,31,0,0,249,33,0,0,82,73,0,0,160,9,0,0,66,59,0,0,224,36,0,0,121,126,0,0,133,180,3,0,5,93,6,0,14,19,6,0,129,129,11,0,7,0,0,0,15,0,0,0,31,0,0,0,17,0,0,0,49,0,0,0,8,0,0,0,101,0,0,0,171,0,0,0,124,0,0,0,56,0,0,0,70,1,0,0,99,3,0,0,103,5,0,0,199,9,0,0,47,5,0,0,183,11,0,0,78,41,0,0,223,31,0,0,36,25,0,0,82,73,0,0,160,9,0,0,66,59,0,0,218,129,0,0,234,241,2,0,97,235,3,0,5,93,6,0,14,19,6,0,129,129,11,0,7,0,0,0,15,0,0,0,31,0,0,0,17,0,0,0,49,0,0,0,8,0,0,0,101,0,0,0,171,0,0,0,231,0,0,0,56,0,0,0,70,1,0,0,99,3,0,0,103,5,0,0,199,9,0,0,47,5,0,0,183,11,0,0,206,13,0,0,75,45,0,0,227,83,0,0,82,73,0,0,146,193,0,0,224,18,0,0,224,36,0,0,234,241,2,0,97,235,3,0,154,99,1,0,64,65,2,0,228,80,4,0,12,0,0,0,15,0,0,0,5,0,0,0,17,0,0,0,38,0,0,0,8,0,0,0,101,0,0,0,171,0,0,0,231,0,0,0,56,0,0,0,70,1,0,0,99,3,0,0,103,5,0,0,199,9,0,0,47,5,0,0,183,11,0,0,206,13,0,0,223,31,0,0,36,25,0,0,230,131,0,0,146,193,0,0,224,18,0,0,130,245,0,0,191,97,0,0,97,235,3,0,154,99,1,0,64,65,2,0,83,143,6,0,12,0,0,0,15,0,0,0,5,0,0,0,17,0,0,0,38,0,0,0,8,0,0,0,101,0,0,0,171,0,0,0,90,0,0,0,56,0,0,0,70,1,0,0,4,5,0,0,120,5,0,0,199,9,0,0,47,5,0,0,183,11,0,0,206,13,0,0,108,13,0,0,129,89,0,0,101,81,0,0,160,9,0,0,56,168,0,0,224,36,0,0,81,156,0,0,91,221,1,0,5,93,6,0,25,12,6,0,129,243,5,0,12,0,0,0,15,0,0,0,5,0,0,0,17,0,0,0,31,0,0,0,8,0,0,0,101,0,0,0,171,0,0,0,90,0,0,0,56,0,0,0,70,1,0,0,4,5,0,0,103,5,0,0,199,9,0,0,47,5,0,0,183,11,0,0,206,13,0,0,184,27,0,0,34,25,0,0,101,81,0,0,81,0,0,0,5,24,1,0,224,36,0,0,37,41,2,0,75,116,4,0,154,99,1,0,185,210,8,0,165,56,4,0,12,0,0,0,6,0,0,0,31,0,0,0,17,0,0,0,4,0,0,0,8,0,0,0,101,0,0,0,171,0,0,0,90,0,0,0,56,0,0,0,126,0,0,0,4,5,0,0,103,5,0,0,199,9,0,0,47,5,0,0,183,11,0,0,206,13,0,0,184,27,0,0,65,72,0,0,101,81,0,0,124,106,0,0,224,18,0,0,224,36,0,0,237,226,2,0,91,221,1,0,67,147,4,0,185,210,8,0,40,46,15,0,12,0,0,0,6,0,0,0,13,0,0,0,17,0,0,0,4,0,0,0,8,0,0,0,101,0,0,0,171,0,0,0,90,0,0,0,56,0,0,0,70,1,0,0,4,5,0,0,103,5,0,0,173,1,0,0,107,5,0,0,155,15,0,0,82,11,0,0,184,27,0,0,81,43,0,0,101,81,0,0,185,41,0,0,66,59,0,0,196,96,1,0,237,226,2,0,75,116,4,0,67,147,4,0,185,210,8,0,30,209,3,0,12,0,0,0,6,0,0,0,11,0,0,0,17,0,0,0,31,0,0,0,18,0,0,0,101,0,0,0,171,0,0,0,90,0,0,0,56,0,0,0,70,1,0,0,4,5,0,0,103,5,0,0,173,1,0,0,107,5,0,0,15,8,0,0,82,11,0,0,184,27,0,0,81,43,0,0,101,81,0,0,137,8,0,0,66,59,0,0,196,96,1,0,37,41,2,0,75,116,4,0,108,79,6,0,26,76,0,0,211,52,2,0,12,0,0,0,15,0,0,0,11,0,0,0,23,0,0,0,64,0,0,0,18,0,0,0,101,0,0,0,171,0,0,0,90,0,0,0,101,0,0,0,70,1,0,0,4,5,0,0,103,5,0,0,173,1,0,0,107,5,0,0,15,8,0,0,82,11,0,0,184,27,0,0,81,43,0,0,101,81,0,0,137,8,0,0,66,59,0,0,196,96,1,0,237,226,2,0,91,221,1,0,108,79,6,0,162,120,9,0,190,216,13,0,12,0,0,0,15,0,0,0,11,0,0,0,23,0,0,0,4,0,0,0,18,0,0,0,101,0,0,0,171,0,0,0,90,0,0,0,101,0,0,0,70,1,0,0,4,5,0,0,103,5,0,0,173,1,0,0,107,5,0,0,15,8,0,0,122,13,0,0,184,27,0,0,81,43,0,0,145,25,0,0,137,8,0,0,31,108,0,0,32,187,0,0,237,226,2,0,39,100,0,0,76,180,4,0,215,218,2,0,240,133,10,0,12,0,0,0,9,0,0,0,11,0,0,0,23,0,0,0,4,0,0,0,18,0,0,0,101,0,0,0,171,0,0,0,90,0,0,0,56,0,0,0,70,1,0,0,4,5,0,0,103,5,0,0,173,1,0,0,107,5,0,0,15,8,0,0,93,8,0,0,184,27,0,0,220,11,0,0,145,25,0,0,137,8,0,0,31,108,0,0,32,187,0,0,37,41,2,0,39,100,0,0,108,79,6,0,162,120,9,0,220,125,10,0,3,0,0,0,13,0,0,0,11,0,0,0,23,0,0,0,4,0,0,0,18,0,0,0,101,0,0,0,171,0,0,0,90,0,0,0,101,0,0,0,70,1,0,0,4,5,0,0,251,1,0,0,173,1,0,0,107,5,0,0,108,6,0,0,93,8,0,0,184,27,0,0,220,11,0,0,145,25,0,0,137,8,0,0,31,108,0,0,32,187,0,0,37,41,2,0,219,115,4,0,108,79,6,0,215,218,2,0,220,125,10,0,3,0,0,0,2,0,0,0,11,0,0,0,23,0,0,0,64,0,0,0,113,0,0,0,101,0,0,0,171,0,0,0,90,0,0,0,101,0,0,0,70,1,0,0,51,2,0,0,49,4,0,0,173,1,0,0,107,5,0,0,15,8,0,0,93,8,0,0,184,27,0,0,128,55,0,0,145,25,0,0,137,8,0,0,154,237,0,0,32,187,0,0,37,41,2,0,149,190,3,0,108,79,6,0,3,238,1,0,220,125,10,0,3,0,0,0,2,0,0,0,13,0,0,0,23,0,0,0,45,0,0,0,62,0,0,0,101,0,0,0,171,0,0,0,90,0,0,0,101,0,0,0,70,1,0,0,51,2,0,0,49,4,0,0,166,6,0,0,107,5,0,0,29,8,0,0,93,8,0,0,184,27,0,0,128,55,0,0,145,25,0,0,137,8,0,0,154,237,0,0,32,187,0,0,237,226,2,0,143,85,4,0,76,180,4,0,255,175,3,0,220,125,10,0,12,0,0,0,2,0,0,0,13,0,0,0,23,0,0,0,45,0,0,0,62,0,0,0,101,0,0,0,171,0,0,0,90,0,0,0,101,0,0,0,70,1,0,0,51,2,0,0,49,4,0,0,166,6,0,0,107,5,0,0,208,9,0,0,93,8,0,0,184,27,0,0,128,55,0,0,106,47,0,0,166,70,0,0,43,24,0,0,32,187,0,0,71,240,1,0,149,190,3,0,76,180,4,0,255,175,3,0,192,237,14,0,7,0,0,0,13,0,0,0,13,0,0,0,23,0,0,0,45,0,0,0,45,0,0,0,101,0,0,0,171,0,0,0,90,0,0,0,101,0,0,0,70,1,0,0,51,2,0,0,49,4,0,0,166,6,0,0,35,9,0,0,208,9,0,0,93,8,0,0,184,27,0,0,128,55,0,0,106,47,0,0,166,70,0,0,43,24,0,0,32,187,0,0,71,240,1,0,149,190,3,0,76,180,4,0,255,175,3,0,220,125,10,0,7,0,0,0,11,0,0,0,13,0,0,0,23,0,0,0,45,0,0,0,45,0,0,0,101,0,0,0,171,0,0,0,90,0,0,0,101,0,0,0,195,0,0,0,242,3,0,0,198,7,0,0,184,0,0,0,35,9,0,0,208,9,0,0,93,8,0,0,184,27,0,0,106,50,0,0,106,47,0,0,166,70,0,0,168,16,0,0,32,187,0,0,71,240,1,0,149,190,3,0,108,79,6,0,255,175,3,0,38,111,8,0,12,0,0,0,11,0,0,0,13,0,0,0,23,0,0,0,45,0,0,0,113,0,0,0,101,0,0,0,171,0,0,0,48,0,0,0,101,0,0,0,195,0,0,0,242,3,0,0,198,7,0,0,184,0,0,0,35,9,0,0,29,8,0,0,143,27,0,0,184,27,0,0,106,50,0,0,106,47,0,0,166,70,0,0,168,16,0,0,32,187,0,0,71,240,1,0,149,190,3,0,76,180,4,0,255,175,3,0,235,154,1,0,12,0,0,0,10,0,0,0,13,0,0,0,23,0,0,0,45,0,0,0,113,0,0,0,101,0,0,0,171,0,0,0,48,0,0,0,101,0,0,0,55,0,0,0,242,3,0,0,198,7,0,0,184,0,0,0,35,9,0,0,29,8,0,0,143,27,0,0,184,27,0,0,106,50,0,0,106,47,0,0,166,70,0,0,168,16,0,0,183,160,0,0,71,240,1,0,149,190,3,0,76,180,4,0,255,175,3,0,251,98,14,0,12,0,0,0,15,0,0,0,13,0,0,0,23,0,0,0,66,0,0,0,113,0,0,0,101,0,0,0,171,0,0,0,48,0,0,0,193,0,0,0,55,0,0,0,208,0,0,0,198,7,0,0,184,0,0,0,35,9,0,0,29,8,0,0,143,27,0,0,184,27,0,0,106,50,0,0,106,47,0,0,223,68,0,0,168,16,0,0,183,160,0,0,71,240,1,0,149,190,3,0,76,180,4,0,255,175,3,0,249,184,11,0,12,0,0,0,15,0,0,0,14,0,0,0,21,0,0,0,66,0,0,0,113,0,0,0,116,0,0,0,171,0,0,0,48,0,0,0,193,0,0,0,55,0,0,0,70,3,0,0,198,7,0,0,184,0,0,0,35,9,0,0,29,8,0,0,143,27,0,0,184,27,0,0,106,50,0,0,106,47,0,0,223,68,0,0,168,16,0,0,183,160,0,0,71,240,1,0,149,190,3,0,76,180,4,0,255,175,3,0,198,175,4,0,12,0,0,0,15,0,0,0,14,0,0,0,27,0,0,0,66,0,0,0,113,0,0,0,116,0,0,0,171,0,0,0,90,0,0,0,193,0,0,0,55,0,0,0,51,2,0,0,251,1,0,0,105,0,0,0,35,9,0,0,242,2,0,0,143,27,0,0,184,27,0,0,106,50,0,0,106,47,0,0,166,70,0,0,255,177,0,0,183,160,0,0,71,240,1,0,33,112,1,0,76,180,4,0,255,175,3,0,198,175,4,0,12,0,0,0,15,0,0,0,14,0,0,0,3,0,0,0,66,0,0,0,113,0,0,0,116,0,0,0,171,0,0,0,90,0,0,0,193,0,0,0,55,0,0,0,51,2,0,0,251,1,0,0,105,0,0,0,35,9,0,0,242,2,0,0,143,27,0,0,25,17,0,0,106,50,0,0,106,47,0,0,166,70,0,0,13,126,0,0,183,160,0,0,71,240,1,0,15,4,1,0,207,59,0,0,255,175,3,0,198,175,4,0,12,0,0,0,15,0,0,0,14,0,0,0,3,0,0,0,66,0,0,0,113,0,0,0,116,0,0,0,171,0,0,0,90,0,0,0,193,0,0,0,55,0,0,0,51,2,0,0,251,1,0,0,105,0,0,0,35,9,0,0,242,2,0,0,143,27,0,0,184,27,0,0,106,50,0,0,106,47,0,0,166,70,0,0,13,126,0,0,183,160,0,0,71,240,1,0,15,4,1,0,207,59,0,0,255,175,3,0,198,175,4,0,12,0,0,0,15,0,0,0,14,0,0,0,3,0,0,0,66,0,0,0,113,0,0,0,116,0,0,0,171,0,0,0,90,0,0,0,193,0,0,0,55,0,0,0,247,2,0,0,251,1,0,0,105,0,0,0,35,9,0,0,242,2,0,0,143,27,0,0,25,17,0,0,190,29,0,0,106,47,0,0,215,145,0,0,13,126,0,0,183,160,0,0,71,240,1,0,73,82,3,0,207,59,0,0,255,175,3,0,235,111,13,0,12,0,0,0,15,0,0,0,14,0,0,0,24,0,0,0,66,0,0,0,113,0,0,0,116,0,0,0,171,0,0,0,90,0,0,0,193,0,0,0,55,0,0,0,247,2,0,0,251,1,0,0,105,0,0,0,35,9,0,0,242,2,0,0,143,27,0,0,25,17,0,0,190,29,0,0,106,47,0,0,142,147,0,0,13,126,0,0,18,141,0,0,71,240,1,0,73,82,3,0,207,59,0,0,96,232,4,0,235,111,13,0,3,0,0,0,15,0,0,0,14,0,0,0,27,0,0,0,66,0,0,0,113,0,0,0,100,0,0,0,171,0,0,0,90,0,0,0,101,0,0,0,55,0,0,0,52,2,0,0,251,1,0,0,105,0,0,0,35,9,0,0,242,2,0,0,143,27,0,0,25,17,0,0,190,29,0,0,106,47,0,0,142,147,0,0,108,242,0,0,18,141,0,0,71,240,1,0,73,82,3,0,127,176,2,0,170,90,0,0,235,111,13,0,3,0,0,0,15,0,0,0,14,0,0,0,27,0,0,0,66,0,0,0,113,0,0,0,100,0,0,0,171,0,0,0,90,0,0,0,101,0,0,0,55,0,0,0,247,2,0,0,251,1,0,0,105,0,0,0,35,9,0,0,242,2,0,0,143,27,0,0,25,17,0,0,190,29,0,0,106,47,0,0,142,147,0,0,108,242,0,0,18,141,0,0,71,240,1,0,73,82,3,0,127,176,2,0,170,90,0,0,235,111,13,0,3,0,0,0,6,0,0,0,14,0,0,0,17,0,0,0,66,0,0,0,113,0,0,0,100,0,0,0,171,0,0,0,90,0,0,0,101,0,0,0,55,0,0,0,247,2,0,0,251,1,0,0,105,0,0,0,76,12,0,0,242,2,0,0,143,27,0,0,25,17,0,0,157,19,0,0,19,119,0,0,33,103,0,0,108,242,0,0,18,141,0,0,71,240,1,0,73,82,3,0,61,92,0,0,244,4,6,0,235,111,13,0,12,0,0,0,6,0,0,0,14,0,0,0,29,0,0,0,66,0,0,0,113,0,0,0,100,0,0,0,171,0,0,0,90,0,0,0,101,0,0,0,55,0,0,0,33,3,0,0,251,1,0,0,105,0,0,0,76,12,0,0,242,2,0,0,143,27,0,0,34,21,0,0,157,19,0,0,19,119,0,0,33,103,0,0,108,242,0,0,18,141,0,0,71,240,1,0,73,82,3,0,61,92,0,0,244,4,6,0,235,111,13,0,7,0,0,0,6,0,0,0,14,0,0,0,29,0,0,0,66,0,0,0,113,0,0,0,100,0,0,0,171,0,0,0,90,0,0,0,101,0,0,0,55,0,0,0,33,3,0,0,49,4,0,0,105,0,0,0,76,12,0,0,242,2,0,0,143,27,0,0,34,21,0,0,157,19,0,0,19,119,0,0,33,103,0,0,108,242,0,0,165,97,0,0,71,240,1,0,73,82,3,0,61,92,0,0,244,4,6,0,235,111,13,0,7,0,0,0,15,0,0,0,14,0,0,0,29,0,0,0,66,0,0,0,113,0,0,0,138,0,0,0,161,0,0,0,90,0,0,0,101,0,0,0,55,0,0,0,33,3,0,0,49,4,0,0,105,0,0,0,76,12,0,0,242,2,0,0,143,27,0,0,25,17,0,0,157,19,0,0,19,119,0,0,33,103,0,0,108,242,0,0,138,254,0,0,71,240,1,0,73,82,3,0,61,92,0,0,21,49,1,0,193,201,1,0,12,0,0,0,15,0,0,0,14,0,0,0,17,0,0,0,66,0,0,0,113,0,0,0,138,0,0,0,161,0,0,0,90,0,0,0,101,0,0,0,55,0,0,0,33,3,0,0,49,4,0,0,105,0,0,0,76,12,0,0,242,2,0,0,15,11,0,0,25,17,0,0,157,19,0,0,19,119,0,0,33,103,0,0,108,242,0,0,138,254,0,0,71,240,1,0,73,82,3,0,61,92,0,0,21,49,1,0,193,201,1,0,12,0,0,0,9,0,0,0,14,0,0,0,5,0,0,0,66,0,0,0,113,0,0,0,138,0,0,0,161,0,0,0,90,0,0,0,101,0,0,0,55,0,0,0,247,2,0,0,49,4,0,0,105,0,0,0,76,12,0,0,242,2,0,0,12,32,0,0,25,17,0,0,157,19,0,0,106,47,0,0,33,103,0,0,108,242,0,0,138,254,0,0,71,240,1,0,73,82,3,0,61,92,0,0,21,49,1,0,193,201,1,0,12,0,0,0,13,0,0,0,14,0,0,0,5,0,0,0,66,0,0,0,63,0,0,0,138,0,0,0,161,0,0,0,90,0,0,0,101,0,0,0,55,0,0,0,247,2,0,0,49,4,0,0,105,0,0,0,76,12,0,0,242,2,0,0,12,32,0,0,25,17,0,0,161,39,0,0,106,47,0,0,33,103,0,0,108,242,0,0,138,254,0,0,41,243,1,0,73,82,3,0,178,160,2,0,143,69,8,0,193,201,1,0,12,0,0,0,2,0,0,0,14,0,0,0,5,0,0,0,66,0,0,0,63,0,0,0,138,0,0,0,161,0,0,0,90,0,0,0,101,0,0,0,55,0,0,0,247,2,0,0,49,4,0,0,105,0,0,0,76,12,0,0,242,2,0,0,12,32,0,0,25,17,0,0,161,39,0,0,106,47,0,0,33,103,0,0,11,7,0,0,138,254,0,0,41,243,1,0,73,82,3,0,40,30,3,0,143,69,8,0,193,201,1,0,12,0,0,0,2,0,0,0,31,0,0,0,5,0,0,0,66,0,0,0,53,0,0,0,101,0,0,0,161,0,0,0,90,0,0,0,101,0,0,0,55,0,0,0,247,2,0,0,49,4,0,0,105,0,0,0,76,12,0,0,242,2,0,0,12,32,0,0,25,17,0,0,161,39,0,0,106,47,0,0,33,103,0,0,11,7,0,0,138,254,0,0,41,243,1,0,73,82,3,0,40,30,3,0,143,69,8,0,193,201,1,0,12,0,0,0,2,0,0,0,31,0,0,0,21,0,0,0,66,0,0,0,63,0,0,0,101,0,0,0,161,0,0,0,90,0,0,0,101,0,0,0,195,0,0,0,247,2,0,0,49,4,0,0,105,0,0,0,76,12,0,0,242,2,0,0,12,32,0,0,25,17,0,0,161,39,0,0,106,47,0,0,33,103,0,0,11,7,0,0,138,254,0,0,41,243,1,0,73,82,3,0,40,30,3,0,143,69,8,0,193,201,1,0,12,0,0,0,13,0,0,0,5,0,0,0,21,0,0,0,11,0,0,0,67,0,0,0,101,0,0,0,161,0,0,0,90,0,0,0,101,0,0,0,195,0,0,0,51,2,0,0,49,4,0,0,105,0,0,0,76,12,0,0,242,2,0,0,12,32,0,0,25,17,0,0,161,39,0,0,106,47,0,0,33,103,0,0,11,7,0,0,138,254,0,0,41,243,1,0,73,82,3,0,40,30,3,0,143,69,8,0,193,201,1,0,12,0,0,0,11,0,0,0,5,0,0,0,21,0,0,0,66,0,0,0,67,0,0,0,101,0,0,0,14,0,0,0,90,0,0,0,101,0,0,0,195,0,0,0,51,2,0,0,49,4,0,0,105,0,0,0,76,12,0,0,242,2,0,0,12,32,0,0,25,17,0,0,161,39,0,0,106,47,0,0,33,103,0,0,11,7,0,0,138,254,0,0,41,243,1,0,73,82,3,0,26,219,1,0,143,69,8,0,193,201,1,0,7,0,0,0,11,0,0,0,5,0,0,0,21,0,0,0,66,0,0,0,67,0,0,0,101,0,0,0,14,0,0,0,90,0,0,0,101,0,0,0,195,0,0,0,51,2,0,0,49,4,0,0,105,0,0,0,76,12,0,0,73,4,0,0,12,32,0,0,25,17,0,0,161,39,0,0,106,47,0,0,33,103,0,0,11,7,0,0,138,254,0,0,41,243,1,0,73,82,3,0,26,219,1,0,143,69,8,0,193,201,1,0,3,0,0,0,10,0,0,0,11,0,0,0,21,0,0,0,66,0,0,0,67,0,0,0,101,0,0,0,14,0,0,0,90,0,0,0,101,0,0,0,195,0,0,0,51,2,0,0,49,4,0,0,105,0,0,0,76,12,0,0,73,4,0,0,12,32,0,0,25,17,0,0,161,39,0,0,106,47,0,0,182,50,0,0,11,7,0,0,138,254,0,0,41,243,1,0,73,82,3,0,26,219,1,0,143,69,8,0,193,201,1,0,3,0,0,0,10,0,0,0,13,0,0,0,21,0,0,0,66,0,0,0,67,0,0,0,101,0,0,0,14,0,0,0,90,0,0,0,101,0,0,0,195,0,0,0,51,2,0,0,49,4,0,0,105,0,0,0,76,12,0,0,242,2,0,0,12,32,0,0,25,17,0,0,161,39,0,0,106,47,0,0,206,157,0,0,11,7,0,0,138,254,0,0,41,243,1,0,73,82,3,0,26,219,1,0,143,69,8,0,59,237,0,0,3,0,0,0,15,0,0,0,11,0,0,0,21,0,0,0,66,0,0,0,67,0,0,0,101,0,0,0,14,0,0,0,90,0,0,0,101,0,0,0,195,0,0,0,51,2,0,0,49,4,0,0,105,0,0,0,76,12,0,0,242,2,0,0,12,32,0,0,25,17,0,0,161,39,0,0,106,47,0,0,206,157,0,0,11,7,0,0,138,254,0,0,41,243,1,0,73,53,3,0,26,219,1,0,143,69,8,0,59,237,0,0,7,0,0,0,15,0,0,0,11,0,0,0,21,0,0,0,66,0,0,0,67,0,0,0,101,0,0,0,14,0,0,0,243,0,0,0,101,0,0,0,132,0,0,0,51,2,0,0,49,4,0,0,105,0,0,0,76,12,0,0,242,2,0,0,12,32,0,0,25,17,0,0,161,39,0,0,106,47,0,0,206,157,0,0,11,7,0,0,138,254,0,0,182,59,1,0,73,53,3,0,251,13,3,0,143,69,8,0,59,237,0,0,7,0,0,0,15,0,0,0,11,0,0,0,21,0,0,0,66,0,0,0,67,0,0,0,101,0,0,0,14,0,0,0,243,0,0,0,101,0,0,0,132,0,0,0,51,2,0,0,49,4,0,0,105,0,0,0,76,12,0,0,242,2,0,0,12,32,0,0,25,17,0,0,161,39,0,0,106,47,0,0,206,157,0,0,11,7,0,0,34,186,0,0,182,59,1,0,73,53,3,0,251,13,3,0,143,69,8,0,59,237,0,0,7,0,0,0,15,0,0,0,11,0,0,0,21,0,0,0,66,0,0,0,67,0,0,0,101,0,0,0,14,0,0,0,243,0,0,0,101,0,0,0,132,0,0,0,226,0,0,0,49,4,0,0,105,0,0,0,240,6,0,0,248,0,0,0,12,32,0,0,25,17,0,0,161,39,0,0,106,47,0,0,206,157,0,0,11,7,0,0,34,186,0,0,182,59,1,0,73,53,3,0,251,13,3,0,143,69,8,0,59,237,0,0,3,0,0,0,15,0,0,0,11,0,0,0,21,0,0,0,66,0,0,0,67,0,0,0,101,0,0,0,14,0,0,0,243,0,0,0,122,0,0,0,132,0,0,0,226,0,0,0,22,0,0,0,105,0,0,0,240,6,0,0,242,2,0,0,12,32,0,0,25,17,0,0,161,39,0,0,106,47,0,0,206,157,0,0,11,7,0,0,34,186,0,0,182,59,1,0,73,53,3,0,251,13,3,0,143,69,8,0,59,237,0,0,3,0,0,0,15,0,0,0,11,0,0,0,21,0,0,0,45,0,0,0,67,0,0,0,101,0,0,0,14,0,0,0,243,0,0,0,122,0,0,0,132,0,0,0,226,0,0,0,22,0,0,0,105,0,0,0,240,6,0,0,73,4,0,0,12,32,0,0,25,17,0,0,161,39,0,0,106,47,0,0,190,13,0,0,164,199,0,0,34,186,0,0,182,59,1,0,73,53,3,0,251,13,3,0,143,69,8,0,59,237,0,0,3,0,0,0,15,0,0,0,11,0,0,0,21,0,0,0,11,0,0,0,67,0,0,0,101,0,0,0,14,0,0,0,243,0,0,0,122,0,0,0,132,0,0,0,226,0,0,0,22,0,0,0,105,0,0,0,26,13,0,0,73,4,0,0,12,32,0,0,25,17,0,0,161,39,0,0,106,47,0,0,190,13,0,0,164,199,0,0,34,186,0,0,182,59,1,0,73,53,3,0,207,218,1,0,143,69,8,0,59,237,0,0,3,0,0,0,15,0,0,0,13,0,0,0,21,0,0,0,7,0,0,0,67,0,0,0,101,0,0,0,14,0,0,0,243,0,0,0,122,0,0,0,132,0,0,0,226,0,0,0,22,0,0,0,105,0,0,0,26,13,0,0,73,4,0,0,12,32,0,0,25,17,0,0,161,39,0,0,106,47,0,0,190,13,0,0,164,199,0,0,34,186,0,0,77,2,2,0,73,53,3,0,207,218,1,0,143,69,8,0,59,237,0,0,3,0,0,0,6,0,0,0,13,0,0,0,21,0,0,0,3,0,0,0,67,0,0,0,101,0,0,0,14,0,0,0,243,0,0,0,122,0,0,0,132,0,0,0,226,0,0,0,22,0,0,0,105,0,0,0,26,13,0,0,73,4,0,0,12,32,0,0,25,17,0,0,161,39,0,0,106,47,0,0,167,147,0,0,164,199,0,0,34,186,0,0,77,2,2,0,73,53,3,0,172,202,3,0,143,69,8,0,59,237,0,0,3,0,0,0,2,0,0,0,11,0,0,0,21,0,0,0,2,0,0,0,67,0,0,0,101,0,0,0,14,0,0,0,243,0,0,0,122,0,0,0,132,0,0,0,226,0,0,0,22,0,0,0,105,0,0,0,157,3,0,0,222,0,0,0,12,32,0,0,25,17,0,0,161,39,0,0,89,36,0,0,167,147,0,0,164,199,0,0,138,158,0,0,77,2,2,0,73,53,3,0,172,202,3,0,143,69,8,0,59,237,0,0,3,0,0,0,3,0,0,0,13,0,0,0,17,0,0,0,2,0,0,0,51,0,0,0,101,0,0,0,14,0,0,0,243,0,0,0,122,0,0,0,132,0,0,0,226,0,0,0,49,4,0,0,105,0,0,0,26,13,0,0,222,0,0,0,12,32,0,0,25,17,0,0,161,39,0,0,99,43,0,0,167,147,0,0,164,199,0,0,138,158,0,0,77,2,2,0,245,112,1,0,172,202,3,0,239,60,4,0,133,184,2,0,3,0,0,0,2,0,0,0,5,0,0,0,17,0,0,0,2,0,0,0,51,0,0,0,101,0,0,0,14,0,0,0,27,1,0,0,122,0,0,0,132,0,0,0,226,0,0,0,196,1,0,0,105,0,0,0,26,13,0,0,222,0,0,0,12,32,0,0,25,17,0,0,161,39,0,0,99,43,0,0,167,147,0,0,164,199,0,0,138,158,0,0,77,2,2,0,245,112,1,0,172,202,3,0,239,60,4,0,133,184,2,0,3,0,0,0,3,0,0,0,5,0,0,0,17,0,0,0,27,0,0,0,51,0,0,0,38,0,0,0,14,0,0,0,27,1,0,0,122,0,0,0,131,1,0,0,226,0,0,0,196,1,0,0,16,3,0,0,157,3,0,0,222,0,0,0,12,32,0,0,25,17,0,0,161,39,0,0,99,43,0,0,167,147,0,0,164,199,0,0,138,158,0,0,77,2,2,0,245,112,1,0,172,202,3,0,239,60,4,0,133,184,2,0,3,0,0,0,2,0,0,0,5,0,0,0,6,0,0,0,5,0,0,0,51,0,0,0,38,0,0,0,10,0,0,0,27,1,0,0,122,0,0,0,131,1,0,0,226,0,0,0,196,1,0,0,16,3,0,0,157,3,0,0,242,2,0,0,12,32,0,0,25,17,0,0,161,39,0,0,99,43,0,0,167,147,0,0,164,199,0,0,138,158,0,0,77,2,2,0,245,112,1,0,172,202,3,0,43,250,6,0,133,184,2,0,3,0,0,0,2,0,0,0,5,0,0,0,17,0,0,0,3,0,0,0,51,0,0,0,38,0,0,0,10,0,0,0,27,1,0,0,122,0,0,0,131,1,0,0,226,0,0,0,196,1,0,0,16,3,0,0,157,3,0,0,190,7,0,0,80,18,0,0,25,17,0,0,161,39,0,0,99,43,0,0,167,147,0,0,164,199,0,0,138,158,0,0,77,2,2,0,245,112,1,0,172,202,3,0,43,250,6,0,133,34,1,0,3,0,0,0,2,0,0,0,14,0,0,0,17,0,0,0,3,0,0,0,12,0,0,0,38,0,0,0,10,0,0,0,27,1,0,0,122,0,0,0,131,1,0,0,226,0,0,0,196,1,0,0,16,3,0,0,157,3,0,0,190,7,0,0,80,18,0,0,25,17,0,0,192,17,0,0,99,43,0,0,167,147,0,0,164,199,0,0,138,158,0,0,77,2,2,0,245,112,1,0,172,202,3,0,43,250,6,0,133,34,1,0,3,0,0,0,2,0,0,0,13,0,0,0,6,0,0,0,5,0,0,0,51,0,0,0,38,0,0,0,10,0,0,0,27,1,0,0,122,0,0,0,131,1,0,0,226,0,0,0,196,1,0,0,16,3,0,0,157,3,0,0,190,7,0,0,80,18,0,0,25,17,0,0,192,17,0,0,99,43,0,0,167,147,0,0,164,199,0,0,69,151,0,0,77,2,2,0,245,112,1,0,172,202,3,0,43,250,6,0,133,34,1,0,3,0,0,0,2,0,0,0,5,0,0,0,3,0,0,0,5,0,0,0,12,0,0,0,38,0,0,0,10,0,0,0,27,1,0,0,122], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
/* memory initializer */ allocate([131,1,0,0,226,0,0,0,62,1,0,0,16,3,0,0,85,8,0,0,190,7,0,0,15,11,0,0,25,17,0,0,192,17,0,0,99,43,0,0,113,18,0,0,19,216,0,0,69,151,0,0,77,2,2,0,245,112,1,0,172,202,3,0,43,250,6,0,133,34,1,0,3,0,0,0,2,0,0,0,5,0,0,0,6,0,0,0,2,0,0,0,51,0,0,0,38,0,0,0,10,0,0,0,27,1,0,0,122,0,0,0,131,1,0,0,226,0,0,0,45,1,0,0,16,3,0,0,85,8,0,0,190,7,0,0,15,11,0,0,25,17,0,0,192,17,0,0,99,43,0,0,113,18,0,0,19,216,0,0,69,151,0,0,77,2,2,0,245,112,1,0,172,202,3,0,43,250,6,0,133,34,1,0,3,0,0,0,2,0,0,0,5,0,0,0,6,0,0,0,2,0,0,0,5,0,0,0,38,0,0,0,103,0,0,0,27,1,0,0,122,0,0,0,131,1,0,0,226,0,0,0,45,1,0,0,16,3,0,0,85,8,0,0,190,7,0,0,15,11,0,0,25,17,0,0,192,17,0,0,99,43,0,0,113,18,0,0,124,211,0,0,69,151,0,0,77,2,2,0,245,112,1,0,172,202,3,0,43,250,6,0,133,34,1,0,3,0,0,0,2,0,0,0,5,0,0,0,3,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,10,0,0,0,16,0,0,0,122,0,0,0,131,1,0,0,226,0,0,0,45,1,0,0,16,3,0,0,85,8,0,0,190,7,0,0,15,11,0,0,184,1,0,0,192,17,0,0,99,43,0,0,113,18,0,0,124,211,0,0,9,89,1,0,77,2,2,0,245,112,1,0,118,54,0,0,43,250,6,0,133,34,1,0,3,0,0,0,2,0,0,0,5,0,0,0,3,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,10,0,0,0,27,1,0,0,101,0,0,0,131,1,0,0,226,0,0,0,45,1,0,0,16,3,0,0,85,8,0,0,190,7,0,0,15,11,0,0,184,1,0,0,202,32,0,0,99,43,0,0,155,27,0,0,124,211,0,0,9,89,1,0,77,2,2,0,245,112,1,0,118,54,0,0,43,250,6,0,133,34,1,0,3,0,0,0,2,0,0,0,5,0,0,0,3,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,10,0,0,0,16,0,0,0,101,0,0,0,131,1,0,0,226,0,0,0,86,0,0,0,16,3,0,0,85,8,0,0,190,7,0,0,15,11,0,0,175,4,0,0,202,32,0,0,99,43,0,0,155,27,0,0,124,211,0,0,9,89,1,0,77,2,2,0,245,112,1,0,118,54,0,0,43,250,6,0,181,71,3,0,3,0,0,0,2,0,0,0,5,0,0,0,3,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,10,0,0,0,27,1,0,0,101,0,0,0,131,1,0,0,226,0,0,0,86,0,0,0,16,3,0,0,85,8,0,0,190,7,0,0,15,11,0,0,175,4,0,0,202,32,0,0,89,36,0,0,155,27,0,0,124,211,0,0,9,89,1,0,202,27,0,0,245,112,1,0,118,54,0,0,43,250,6,0,181,71,3,0,3,0,0,0,2,0,0,0,5,0,0,0,3,0,0,0,2,0,0,0,5,0,0,0,3,0,0,0,5,0,0,0,27,1,0,0,101,0,0,0,131,1,0,0,226,0,0,0,15,0,0,0,16,3,0,0,85,8,0,0,190,7,0,0,15,11,0,0,175,4,0,0,202,32,0,0,89,36,0,0,155,27,0,0,78,51,0,0,9,89,1,0,77,2,2,0,245,112,1,0,118,54,0,0,43,250,6,0,181,71,3,0,0,0,0,0,0,0,0,0,31,0,0,0,47,0,0,0,73,0,0,0,113,0,0,0,173,0,0,0,7,1,0,0,141,1,0,0,81,2,0,0,139,3,0,0,81,5,0,0,5,8,0,0,7,12,0,0,13,18,0,0,35,27,0,0,187,40,0,0,25,61,0,0,177,91,0,0,149,137,0,0,101,206,0,0,155,53,1,0,107,208,1,0,173,184,2,0,3,21,4,0,135,31,6,0,87,47,9,0,21,199,13,0,231,170,20,0,97,0,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,161,75,236,0,0,0,0,0,81,109,8,1,0,0,0,0,133,20,42,2,0,0,0,0,215,34,85,3,0,0,0,0,115,63,134,4,0,0,0,0,193,12,188,5], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+10240);
/* memory initializer */ allocate([253,219,226,1,246,237,197,63,24,76,121,181,183,22,215,63,221,69,149,73,77,242,221,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,135,109,234,157,93,39,168,63,120,97,206,43,96,96,187,63,149,45,242,88,114,125,196,63,113,171,177,230,99,1,202,63,177,106,37,92,21,227,205,63,42,240,212,230,12,228,207,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,232,116,2,104,9,146,63,127,182,83,234,181,201,164,63,116,228,247,125,70,11,176,63,74,226,150,225,159,81,181,63,30,168,23,163,23,24,186,63,71,59,87,49,255,65,190,63,254,109,178,93,44,219,192,63,55,165,52,143,52,48,194,63,145,89,44,181,25,24,195,63,114,51,10,73,108,141,195,63,31,160,128,78,202,214,237,191,96,201,85,150,160,40,229,191,200,117,54,208,18,139,206,191,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,46,228,216,241,104,239,191,181,136,251,79,135,238,236,191,57,143,216,238,10,163,232,191,246,119,192,5,79,203,226,191,157,177,168,32,141,138,215,191,238,48,246,248,165,7,192,191,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,28,199,160,181,199,239,191,159,118,189,167,219,216,238,191,146,253,115,65,6,49,237,191,231,214,239,213,11,218,234,191,78,165,70,115,243,225,231,191,219,16,167,63,141,90,228,191,247,127,63,193,5,89,224,191,197,82,86,241,204,234,215,191,193,139,146,54,22,40,205,191,175,134,139,249,61,151,179,191,151,180,215,200,74,134,227,63,49,25,80,125,112,212,219,191,31,169,167,8,173,146,198,63,192,205,79,67,124,21,175,191,34,242,82,212,28,35,146,63,75,8,23,167,5,179,113,191,53,83,112,88,176,253,75,63,252,181,79,233,157,170,32,191,173,101,158,85,208,150,231,62,217,165,110,135,101,2,149,62,214,67,31,33,138,47,146,190,153,227,73,244,139,128,96,62,195,172,226,96,232,155,37,62,27,131,65,26,72,173,17,190,212,70,254,44,64,118,192,61,32,235,5,73,237,164,188,61,144,23,13,206,33,45,135,189,43,233,141,202,69,163,102,189,195,206,4,233,104,167,63,61,0,191,54,24,16,117,19,61,72,167,199,174,44,52,243,188,198,68,173,44,43,166,195,188,76,125,17,135,232,222,166,60,169,74,136,25,139,24,120,60,117,84,8,210,28,54,91,188,65,61,76,60,247,95,49,188,54,86,58,106,157,185,15,60,99,67,233,108,53,139,235,59,140,152,114,204,33,26,193,187,46,153,56,223,191,141,166,187,211,93,252,153,210,227,108,59,123,211,72,143,241,52,98,59,251,59,27,55,230,2,234,186,214,222,55,246,172,203,27,187,182,187,57,209,150,147,224,186,84,250,229,107,223,241,210,58,81,209,166,32,71,27,171,58,142,36,141,93,79,46,132,186,237,88,223,159,139,151,110,186,208,150,110,110,14,121,29,58,145,124,136,78,71,146,43,58,160,194,235,254,75,72,244,57,160,194,235,254,75,72,228,185,160,194,235,254,75,72,196,185,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+1023280);




var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


  function _fmod(x, y) {
      return x % y;
    }

  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: {
          if (typeof navigator === 'object') return navigator['hardwareConcurrency'] || 1;
          return 1;
        }
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  var _pow=Math_pow;

   
  Module["_memset"] = _memset;

  function _abort() {
      Module['abort']();
    }

   
  Module["_strlen"] = _strlen;

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;

  var _log=Math_log;

  var _asin=Math_asin;

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }

  var _fabs=Math_abs;

  function ___errno_location() {
      return ___errno_state;
    }

  var _sqrt=Math_sqrt;

  
  
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.buffer.byteLength which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null; 
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },getFileDataAsRegularArray:function (node) {
        if (node.contents && node.contents.subarray) {
          var arr = [];
          for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
          return arr; // Returns a copy of the original data.
        }
        return node.contents; // No-op, the file contents are already in a JS array. Return as-is.
      },getFileDataAsTypedArray:function (node) {
        if (!node.contents) return new Uint8Array;
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },expandFileStorage:function (node, newCapacity) {
  
        // If we are asked to expand the size of a file that already exists, revert to using a standard JS array to store the file
        // instead of a typed array. This makes resizing the array more flexible because we can just .push() elements at the back to
        // increase the size.
        if (node.contents && node.contents.subarray && newCapacity > node.contents.length) {
          node.contents = MEMFS.getFileDataAsRegularArray(node);
          node.usedBytes = node.contents.length; // We might be writing to a lazy-loaded file which had overridden this property, so force-reset it.
        }
  
        if (!node.contents || node.contents.subarray) { // Keep using a typed array if creating a new storage, or if old one was a typed array as well.
          var prevCapacity = node.contents ? node.contents.buffer.byteLength : 0;
          if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
          // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
          // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
          // avoid overshooting the allocation cap by a very large margin.
          var CAPACITY_DOUBLING_MAX = 1024 * 1024;
          newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) | 0);
          if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
          var oldContents = node.contents;
          node.contents = new Uint8Array(newCapacity); // Allocate new storage.
          if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
          return;
        }
        // Not using a typed array to back the file storage. Use a standard JS array instead.
        if (!node.contents && newCapacity > 0) node.contents = [];
        while (node.contents.length < newCapacity) node.contents.push(0);
      },resizeFileStorage:function (node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
          return;
        }
  
        if (!node.contents || node.contents.subarray) { // Resize a typed array if that is being used as the backing store.
          var oldContents = node.contents;
          node.contents = new Uint8Array(new ArrayBuffer(newSize)); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
          return;
        }
        // Backing with a JS array.
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize;
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) { // Can we just reuse the buffer we are given?
              assert(position === 0, 'canOwn must imply no weird position inside the file');
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); // Use typed array write if available.
          else
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          node.usedBytes = Math.max(node.usedBytes, position+length);
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < stream.node.usedBytes) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        if (typeof indexedDB !== 'undefined') return indexedDB;
        var ret = null;
        if (typeof window === 'object') ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, 'IDBFS used, but indexedDB not supported');
        return ret;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          fileStore.createIndex('timestamp', 'timestamp', { unique: false });
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          // Performance consideration: storing a normal JavaScript array to a IndexedDB is much slower than storing a typed array.
          // Therefore always convert the file contents to a typed array first before writing the data to IndexedDB.
          node.contents = MEMFS.getFileDataAsTypedArray(node);
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.chmod(path, entry.mode);
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function() { callback(this.error); };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function() { done(this.error); };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        if (!path) return { path: '', node: null };
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        var err = FS.nodePermissions(dir, 'x');
        if (err) return err;
        if (!dir.node_ops.lookup) return ERRNO_CODES.EACCES;
        return 0;
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getStreamFromPtr:function (ptr) {
        return FS.streams[ptr - 1];
      },getPtrForStream:function (stream) {
        return stream ? stream.fd + 1 : 0;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        if (!PATH.resolve(oldpath)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        try {
          if (FS.trackingDelegate['willMovePath']) {
            FS.trackingDelegate['willMovePath'](old_path, new_path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
        try {
          if (FS.trackingDelegate['onMovePath']) FS.trackingDelegate['onMovePath'](old_path, new_path);
        } catch(e) {
          console.log("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        if (path === "") {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var err = FS.mayOpen(node, flags);
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        try {
          if (FS.trackingDelegate['onOpenFile']) {
            var trackingFlags = 0;
            if ((flags & 2097155) !== 1) {
              trackingFlags |= FS.tracking.openFlags.READ;
            }
            if ((flags & 2097155) !== 0) {
              trackingFlags |= FS.tracking.openFlags.WRITE;
            }
            FS.trackingDelegate['onOpenFile'](path, trackingFlags);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: " + e.message);
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
          if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
        } catch(e) {
          console.log("FS.trackingDelegate['onWriteToFile']('"+path+"') threw an exception: " + e.message);
        }
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        var random_device;
        if (typeof crypto !== 'undefined') {
          // for modern web browsers
          var randomBuffer = new Uint8Array(1);
          random_device = function() { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
        } else if (ENVIRONMENT_IS_NODE) {
          // for nodejs
          random_device = function() { return require('crypto').randomBytes(1)[0]; };
        } else {
          // default for ES5 platforms
          random_device = function() { return (Math.random()*256)|0; };
        }
        FS.createDevice('/dev', 'random', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=FS.getPtrForStream(stdin);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=FS.getPtrForStream(stdout);
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=FS.getPtrForStream(stderr);
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
          this.node = node;
          this.setErrno = function(errno) {
            this.errno = errno;
            for (var key in ERRNO_CODES) {
              if (ERRNO_CODES[key] === errno) {
                this.code = key;
                break;
              }
            }
          };
          this.setErrno(errno);
          this.message = ERRNO_MESSAGES[errno];
          if (this.stack) this.stack = demangleAll(this.stack);
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize)|0;
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var chunkSize = 1024*1024; // Chunk size in bytes
  
          if (!hasByteServing) chunkSize = datalength;
  
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
  
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = this;
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * chunkSize;
            var end = (chunkNum+1) * chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
  
          this._length = datalength;
          this._chunkSize = chunkSize;
          this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperty(node, "usedBytes", {
            get: function() { return this.contents.length; }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  
  function _emscripten_set_main_loop_timing(mode, value) {
      Browser.mainLoop.timingMode = mode;
      Browser.mainLoop.timingValue = value;
  
      if (!Browser.mainLoop.func) {
        console.error('emscripten_set_main_loop_timing: Cannot set timing mode for main loop since a main loop does not exist! Call emscripten_set_main_loop first to set one up.');
        return 1; // Return non-zero on failure, can't set timing mode when there is no main loop.
      }
  
      if (mode == 0 /*EM_TIMING_SETTIMEOUT*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler() {
          setTimeout(Browser.mainLoop.runner, value); // doing this each time means that on exception, we stop
        };
        Browser.mainLoop.method = 'timeout';
      } else if (mode == 1 /*EM_TIMING_RAF*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = 'rAF';
      }
      return 0;
    }function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg) {
      Module['noExitRuntime'] = true;
  
      assert(!Browser.mainLoop.func, 'emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.');
  
      Browser.mainLoop.func = func;
      Browser.mainLoop.arg = arg;
  
      var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
  
      Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next = remaining%1 == 0 ? remaining-1 : Math.floor(remaining);
            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              // not counted, but move the progress along a tiny bit
              next = next + 0.5; // do not steal all the next one's progress
              Browser.mainLoop.remainingBlockers = (8*remaining + next)/9;
            }
          }
          console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + ' ms'); //, left: ' + Browser.mainLoop.remainingBlockers);
          Browser.mainLoop.updateStatus();
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }
  
        // catch pauses from non-main loop sources
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Implement very basic swap interval control
        Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
        if (Browser.mainLoop.timingMode == 1/*EM_TIMING_RAF*/ && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
          // Not the scheduled time to render this frame - skip.
          Browser.mainLoop.scheduler();
          return;
        }
  
        // Signal GL rendering layer that processing of a new frame is about to start. This helps it optimize
        // VBO double-buffering and reduce GPU stalls.
  
        if (Browser.mainLoop.method === 'timeout' && Module.ctx) {
          Module.printErr('Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!');
          Browser.mainLoop.method = ''; // just warn once per call to set main loop
        }
  
        Browser.mainLoop.runIter(function() {
          if (typeof arg !== 'undefined') {
            Runtime.dynCall('vi', func, [arg]);
          } else {
            Runtime.dynCall('v', func);
          }
        });
  
        // catch pauses from the main loop itself
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Queue new audio data. This is important to be right after the main loop invocation, so that we will immediately be able
        // to queue the newest produced audio samples.
        // TODO: Consider adding pre- and post- rAF callbacks so that GL.newRenderingFrameStarted() and SDL.audio.queueNewAudioData()
        //       do not need to be hardcoded into this function, but can be more generic.
        if (typeof SDL === 'object' && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
  
        Browser.mainLoop.scheduler();
      }
  
      if (fps && fps > 0) _emscripten_set_main_loop_timing(0/*EM_TIMING_SETTIMEOUT*/, 1000.0 / fps);
      else _emscripten_set_main_loop_timing(1/*EM_TIMING_RAF*/, 1); // Do rAF by rendering each frame (no decimating)
  
      Browser.mainLoop.scheduler();
  
      if (simulateInfiniteLoop) {
        throw 'SimulateInfiniteLoop';
      }
    }var Browser={mainLoop:{scheduler:null,method:"",currentlyRunningMainloop:0,func:null,arg:0,timingMode:0,timingValue:0,currentFrameNumber:0,queue:[],pause:function () {
          Browser.mainLoop.scheduler = null;
          Browser.mainLoop.currentlyRunningMainloop++; // Incrementing this signals the previous main loop that it's now become old, and it must return.
        },resume:function () {
          Browser.mainLoop.currentlyRunningMainloop++;
          var timingMode = Browser.mainLoop.timingMode;
          var timingValue = Browser.mainLoop.timingValue;
          var func = Browser.mainLoop.func;
          Browser.mainLoop.func = null;
          _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg);
          _emscripten_set_main_loop_timing(timingMode, timingValue);
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        },runIter:function (func) {
          if (ABORT) return;
          if (Module['preMainLoop']) {
            var preRet = Module['preMainLoop']();
            if (preRet === false) {
              return; // |return false| skips a frame
            }
          }
          try {
            func();
          } catch (e) {
            if (e instanceof ExitStatus) {
              return;
            } else {
              if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
              throw e;
            }
          }
          if (Module['postMainLoop']) Module['postMainLoop']();
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          assert(typeof url == 'string', 'createObjectURL must return a url as a string');
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            assert(typeof url == 'string', 'createObjectURL must return a url as a string');
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas ||
                                document['msPointerLockElement'] === canvas;
        }
        if (canvas) {
          // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
          // Module['forcedAspectRatio'] = 4 / 3;
          
          canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                      canvas['mozRequestPointerLock'] ||
                                      canvas['webkitRequestPointerLock'] ||
                                      canvas['msRequestPointerLock'] ||
                                      function(){};
          canvas.exitPointerLock = document['exitPointerLock'] ||
                                   document['mozExitPointerLock'] ||
                                   document['webkitExitPointerLock'] ||
                                   document['msExitPointerLock'] ||
                                   function(){}; // no-op if function does not exist
          canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
  
          document.addEventListener('pointerlockchange', pointerLockChange, false);
          document.addEventListener('mozpointerlockchange', pointerLockChange, false);
          document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
          document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
          if (Module['elementPointerLock']) {
            canvas.addEventListener("click", function(ev) {
              if (!Browser.pointerLock && canvas.requestPointerLock) {
                canvas.requestPointerLock();
                ev.preventDefault();
              }
            }, false);
          }
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx; // no need to recreate GL context if it's already been created for this canvas.
  
        var ctx;
        var contextHandle;
        if (useWebGL) {
          // For GLES2/desktop GL compatibility, adjust a few defaults to be different to WebGL defaults, so that they align better with the desktop defaults.
          var contextAttributes = {
            antialias: false,
            alpha: false
          };
  
          if (webGLContextAttributes) {
            for (var attribute in webGLContextAttributes) {
              contextAttributes[attribute] = webGLContextAttributes[attribute];
            }
          }
  
          contextHandle = GL.createContext(canvas, contextAttributes);
          if (contextHandle) {
            ctx = GL.getContext(contextHandle).GLctx;
          }
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
        } else {
          ctx = canvas.getContext('2d');
        }
  
        if (!ctx) return null;
  
        if (setInModule) {
          if (!useWebGL) assert(typeof GLctx === 'undefined', 'cannot set in module if GLctx is used, but we are a non-GL context that would replace it');
  
          Module.ctx = ctx;
          if (useWebGL) GL.makeContextCurrent(contextHandle);
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement'] ||
               document['msFullScreenElement'] || document['msFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'] ||
                                      document['msExitFullscreen'] ||
                                      document['exitFullscreen'] ||
                                      function() {};
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else {
            
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            
            if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
          Browser.updateCanvasDimensions(canvas);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
          document.addEventListener('MSFullscreenChange', fullScreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullScreen = canvasContainer['requestFullScreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvasContainer.requestFullScreen();
      },nextRAF:0,fakeRequestAnimationFrame:function (func) {
        // try to keep 60fps between calls to here
        var now = Date.now();
        if (Browser.nextRAF === 0) {
          Browser.nextRAF = now + 1000/60;
        } else {
          while (now + 2 >= Browser.nextRAF) { // fudge a little, to avoid timer jitter causing us to do lots of delay:0
            Browser.nextRAF += 1000/60;
          }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay);
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          Browser.fakeRequestAnimationFrame(func);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           Browser.fakeRequestAnimationFrame;
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        var delta = 0;
        switch (event.type) {
          case 'DOMMouseScroll': 
            delta = event.detail;
            break;
          case 'mousewheel': 
            delta = event.wheelDelta;
            break;
          case 'wheel': 
            delta = event['deltaY'];
            break;
          default:
            throw 'unrecognized mouse wheel event: ' + event.type;
        }
        return delta;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          // If this assert lands, it's likely because the browser doesn't support scrollX or pageXOffset
          // and we have no viable fallback.
          assert((typeof scrollX !== 'undefined') && (typeof scrollY !== 'undefined'), 'Unable to retrieve scroll position, mouse positions likely broken.');
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
            
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              Browser.lastTouches[touch.identifier] = Browser.touches[touch.identifier];
              Browser.touches[touch.identifier] = { x: adjustedX, y: adjustedY };
            } 
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
             document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
             document['fullScreenElement'] || document['fullscreenElement'] ||
             document['msFullScreenElement'] || document['msFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      },wgetRequests:{},nextWgetRequestHandle:0,getNextWgetRequestHandle:function () {
        var handle = Browser.nextWgetRequestHandle;
        Browser.nextWgetRequestHandle++;
        return handle;
      }};

  var _exp=Math_exp;

  function _time(ptr) {
      var ret = (Date.now()/1000)|0;
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

  var _sin=Math_sin;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + TOTAL_STACK;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");


  
function nullFunc_dii(x) { Module["printErr"]("Invalid function pointer called with signature 'dii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info."); abort(x) }

function invoke_dii(index,a1,a2) {
  try {
    return Module["dynCall_dii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

  Module.asmGlobalArg = { "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array };
  Module.asmLibraryArg = { "abort": abort, "assert": assert, "min": Math_min, "nullFunc_dii": nullFunc_dii, "invoke_dii": invoke_dii, "_fabs": _fabs, "_fmod": _fmod, "_sin": _sin, "_fflush": _fflush, "_sysconf": _sysconf, "_pow": _pow, "_abort": _abort, "___setErrNo": ___setErrNo, "_sbrk": _sbrk, "_time": _time, "_emscripten_set_main_loop_timing": _emscripten_set_main_loop_timing, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_log": _log, "_sqrt": _sqrt, "_exp": _exp, "_emscripten_set_main_loop": _emscripten_set_main_loop, "___errno_location": ___errno_location, "_asin": _asin, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "NaN": NaN, "Infinity": Infinity };
  // EMSCRIPTEN_START_ASM
  var asm = (function(global, env, buffer) {
    'almost asm';
    
    var HEAP8 = new global.Int8Array(buffer);
    var HEAP16 = new global.Int16Array(buffer);
    var HEAP32 = new global.Int32Array(buffer);
    var HEAPU8 = new global.Uint8Array(buffer);
    var HEAPU16 = new global.Uint16Array(buffer);
    var HEAPU32 = new global.Uint32Array(buffer);
    var HEAPF32 = new global.Float32Array(buffer);
    var HEAPF64 = new global.Float64Array(buffer);

  
  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;

    var __THREW__ = 0;
    var threwValue = 0;
    var setjmpId = 0;
    var undef = 0;
    var nan = +env.NaN, inf = +env.Infinity;
    var tempInt = 0, tempBigInt = 0, tempBigIntP = 0, tempBigIntS = 0, tempBigIntR = 0.0, tempBigIntI = 0, tempBigIntD = 0, tempValue = 0, tempDouble = 0.0;
  
    var tempRet0 = 0;
    var tempRet1 = 0;
    var tempRet2 = 0;
    var tempRet3 = 0;
    var tempRet4 = 0;
    var tempRet5 = 0;
    var tempRet6 = 0;
    var tempRet7 = 0;
    var tempRet8 = 0;
    var tempRet9 = 0;
  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var abort=env.abort;
  var assert=env.assert;
  var Math_min=env.min;
  var nullFunc_dii=env.nullFunc_dii;
  var invoke_dii=env.invoke_dii;
  var _fabs=env._fabs;
  var _fmod=env._fmod;
  var _sin=env._sin;
  var _fflush=env._fflush;
  var _sysconf=env._sysconf;
  var _pow=env._pow;
  var _abort=env._abort;
  var ___setErrNo=env.___setErrNo;
  var _sbrk=env._sbrk;
  var _time=env._time;
  var _emscripten_set_main_loop_timing=env._emscripten_set_main_loop_timing;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var _log=env._log;
  var _sqrt=env._sqrt;
  var _exp=env._exp;
  var _emscripten_set_main_loop=env._emscripten_set_main_loop;
  var ___errno_location=env.___errno_location;
  var _asin=env._asin;
  var tempFloat = 0.0;

  // EMSCRIPTEN_START_FUNCS
  function stackAlloc(size) {
    size = size|0;
    var ret = 0;
    ret = STACKTOP;
    STACKTOP = (STACKTOP + size)|0;
  STACKTOP = (STACKTOP + 15)&-16;
if ((STACKTOP|0) >= (STACK_MAX|0)) abort();

    return ret|0;
  }
  function stackSave() {
    return STACKTOP|0;
  }
  function stackRestore(top) {
    top = top|0;
    STACKTOP = top;
  }

  function setThrew(threw, value) {
    threw = threw|0;
    value = value|0;
    if ((__THREW__|0) == 0) {
      __THREW__ = threw;
      threwValue = value;
    }
  }
  function copyTempFloat(ptr) {
    ptr = ptr|0;
    HEAP8[tempDoublePtr>>0] = HEAP8[ptr>>0];
    HEAP8[tempDoublePtr+1>>0] = HEAP8[ptr+1>>0];
    HEAP8[tempDoublePtr+2>>0] = HEAP8[ptr+2>>0];
    HEAP8[tempDoublePtr+3>>0] = HEAP8[ptr+3>>0];
  }
  function copyTempDouble(ptr) {
    ptr = ptr|0;
    HEAP8[tempDoublePtr>>0] = HEAP8[ptr>>0];
    HEAP8[tempDoublePtr+1>>0] = HEAP8[ptr+1>>0];
    HEAP8[tempDoublePtr+2>>0] = HEAP8[ptr+2>>0];
    HEAP8[tempDoublePtr+3>>0] = HEAP8[ptr+3>>0];
    HEAP8[tempDoublePtr+4>>0] = HEAP8[ptr+4>>0];
    HEAP8[tempDoublePtr+5>>0] = HEAP8[ptr+5>>0];
    HEAP8[tempDoublePtr+6>>0] = HEAP8[ptr+6>>0];
    HEAP8[tempDoublePtr+7>>0] = HEAP8[ptr+7>>0];
  }
  function setTempRet0(value) {
    value = value|0;
    tempRet0 = value;
  }
  function getTempRet0() {
    return tempRet0|0;
  }
  
function _dkbvrc_($ndim,$minvls,$maxvls,$functn,$abseps,$releps,$abserr,$finest,$inform) {
 $ndim = $ndim|0;
 $minvls = $minvls|0;
 $maxvls = $maxvls|0;
 $functn = $functn|0;
 $abseps = $abseps|0;
 $releps = $releps|0;
 $abserr = $abserr|0;
 $finest = $finest|0;
 $inform = $inform|0;
 var $$expand_i1_val = 0, $$expand_i1_val1 = 0, $$expand_i1_val2 = 0, $$expand_i1_val3 = 0, $$expand_i1_val4 = 0, $$expand_i1_val5 = 0, $$expand_i1_val6 = 0, $$expand_i1_val7 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $2 = 0;
 var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $D$1516_23 = 0, $D$1523_34 = 0, $D$1523_34$expand_i1_val = 0, $D$1525_42 = 0, $D$1526_50 = 0, $D$1530_53 = 0, $D$1532_99 = 0, $D$1532_99$expand_i1_val = 0, $D$1533_103 = 0, $D$1538_116 = 0.0, $D$1539_123 = 0, $D$1539_123$expand_i1_val = 0, $D$1542_154 = 0.0;
 var $D$1544_160 = 0.0, $D$1546_172 = 0, $D$1548_181 = 0, $D$3609_20 = 0, $D$3618_28 = 0, $D$3620_30 = 0, $D$3621_31 = 0, $D$3622_32 = 0, $D$3623_33 = 0, $D$3626_37 = 0, $D$3628_39 = 0, $D$3629_40 = 0, $D$3630_41 = 0, $D$3636_45 = 0, $D$3637_46 = 0, $D$3638_47 = 0.0, $D$3639_48 = 0.0, $D$3645_52 = 0, $D$3650_57 = 0, $D$3651_58 = 0;
 var $D$3652_59 = 0.0, $D$3653_60 = 0, $D$3655_62 = 0, $D$3656_63 = 0, $D$3657_64 = 0, $D$3658_65 = 0.0, $D$3659_66 = 0.0, $D$3660_67 = 0.0, $D$3661_68 = 0.0, $D$3662_70 = 0, $D$3663_71 = 0.0, $D$3664_72 = 0.0, $D$3665_73 = 0.0, $D$3667_74 = 0, $D$3669_76 = 0, $D$3670_77 = 0, $D$3671_78 = 0.0, $D$3672_79 = 0, $D$3673_80 = 0.0, $D$3674_81 = 0;
 var $D$3675_82 = 0, $D$3676_83 = 0.0, $D$3677_84 = 0.0, $D$3679_86 = 0.0, $D$3680_87 = 0.0, $D$3681_88 = 0, $D$3682_89 = 0.0, $D$3683_90 = 0, $D$3684_91 = 0, $D$3685_92 = 0.0, $D$3687_94 = 0, $D$3688_95 = 0, $D$3689_96 = 0.0, $D$3690_97 = 0.0, $D$3691_98 = 0.0, $D$3697_106 = 0, $D$3700_110 = 0.0, $D$3702_112 = 0.0, $D$3703_117 = 0, $D$3704_118 = 0.0;
 var $D$3705_119 = 0.0, $D$3706_120 = 0.0, $D$3707_121 = 0.0, $D$3710_126 = 0, $D$3712_128 = 0, $D$3713_129 = 0, $D$3714_130 = 0, $D$3716_134 = 0.0, $D$3717_135 = 0.0, $D$3718_136 = 0.0, $D$3720_138 = 0.0, $D$3722_140 = 0.0, $D$3723_141 = 0.0, $D$3724_142 = 0, $D$3724_142$expand_i1_val = 0, $D$3727_143 = 0.0, $D$3731_146 = 0.0, $D$3733_148 = 0.0, $D$3734_149 = 0.0, $D$3735_150 = 0.0;
 var $D$3736_151 = 0.0, $D$3737_156 = 0.0, $D$3738_157 = 0.0, $D$3739_159 = 0.0, $D$3740_161 = 0, $D$3740_161$expand_i1_val = 0, $D$3741_162 = 0, $D$3741_162$expand_i1_val = 0, $D$3742_163 = 0, $D$3742_163$expand_i1_val = 0, $D$3746_165 = 0.0, $D$3747_166 = 0, $D$3747_166$expand_i1_val = 0, $D$3757_171 = 0, $D$3758_175 = 0, $D$3759_176 = 0, $D$3761_178 = 0, $D$3762_179 = 0, $D$3763_180 = 0, $D$3772_187 = 0;
 var $D$3774_189 = 0, $D$3775_190 = 0, $D$3776_191 = 0, $D$3777_192 = 0, $D$3778_193 = 0, $M$0_11 = 0, $M$1_12 = 0, $M$2_13 = 0, $M$3_14 = 0.0, $M$4_15 = 0, $M$5_16 = 0, $M$5_185 = 0, $abseps_153 = 0, $abseps_addr = 0, $abserr_152 = 0, $abserr_addr = 0, $ar = 0, $ar1 = 0, $ar10 = 0, $ar11 = 0;
 var $ar12 = 0, $ar13 = 0, $ar14 = 0, $ar16 = 0, $ar17 = 0, $ar2 = 0, $ar4 = 0, $ar5 = 0, $ar7 = 0, $ar8 = 0, $ar9 = 0, $difint_113 = 0.0, $finest_21 = 0, $finest_addr = 0, $finval_1 = 0.0, $finval_114 = 0.0, $finval_2 = 0.0, $functn_108 = 0, $functn_addr = 0, $i_100 = 0;
 var $i_124 = 0, $i_3 = 0, $i_35 = 0, $i_4 = 0, $i_5 = 0, $inform_17 = 0, $inform_addr = 0, $intvls_131 = 0, $intvls_6 = 0, $k_69 = 0, $k_7 = 0, $k_8 = 0, $klimi = 0, $maxvls_174 = 0, $maxvls_addr = 0, $minvls_19 = 0, $minvls_addr = 0, $ndim_22 = 0, $ndim_addr = 0, $np$219_38 = 0;
 var $np$220_44 = 0, $np$221_56 = 0, $np$222_61 = 0, $np$223_75 = 0, $np$224_93 = 0, $np$225_105 = 0, $np$228_127 = 0, $np$231_167 = 0, $np$232_168 = 0, $np$233_169 = 0, $np$235_177 = 0, $np$238_188 = 0, $releps_158 = 0, $releps_addr = 0, $sampls$218_29 = 0, $sampls$227_125 = 0, $sampls$234_170 = 0, $sampls$236_184 = 0, $sampls$237_186 = 0, $toBool = 0;
 var $toBool15 = 0, $value = 0, $value$226_109 = 0.0, $varest$229_132 = 0.0, $varest$230_145 = 0.0, $varprd_133 = 0.0, $varsqr_10 = 0.0, $varsqr_122 = 0.0, $varsqr_9 = 0.0, $vk = 0, $x = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 24048|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $klimi = sp + 24008|0;
 $value = sp + 24000|0;
 $vk = sp + 16000|0;
 $x = sp;
 $ndim_addr = $ndim;
 $minvls_addr = $minvls;
 $maxvls_addr = $maxvls;
 $functn_addr = $functn;
 $abseps_addr = $abseps;
 $releps_addr = $releps;
 $abserr_addr = $abserr;
 $finest_addr = $finest;
 $inform_addr = $inform;
 $inform_17 = $inform_addr;
 $minvls_19 = $minvls_addr;
 $finest_21 = $finest_addr;
 $ndim_22 = $ndim_addr;
 $functn_108 = $functn_addr;
 $abserr_152 = $abserr_addr;
 $abseps_153 = $abseps_addr;
 $releps_158 = $releps_addr;
 $maxvls_174 = $maxvls_addr;
 HEAP32[$inform_17>>2] = 1;
 HEAP32[$klimi>>2] = 100;
 $D$3609_20 = HEAP32[$minvls_19>>2]|0;
 $0 = ($D$3609_20|0)>=(0);
 L2: do {
  if ($0) {
   HEAPF64[$finest_21>>3] = 0.0;
   HEAPF64[11232>>3] = 0.0;
   HEAP32[11224>>2] = 8;
   $D$1516_23 = HEAP32[$ndim_22>>2]|0;
   $1 = ($D$1516_23|0)>(10);
   if ($1) {
    $M$0_11 = 10;
   } else {
    $M$0_11 = $D$1516_23;
   }
   $2 = ($M$0_11|0)<=(28);
   L7: do {
    if ($2) {
     $i_3 = $M$0_11;
     while(1) {
      HEAP32[11104>>2] = $i_3;
      $D$3618_28 = HEAP32[$minvls_19>>2]|0;
      $sampls$218_29 = HEAP32[11224>>2]|0;
      $D$3620_30 = $sampls$218_29<<1;
      $D$3621_31 = (($i_3) + -1)|0;
      $ar = (11112 + ($D$3621_31<<2)|0);
      $D$3622_32 = HEAP32[$ar>>2]|0;
      $D$3623_33 = Math_imul($D$3620_30, $D$3622_32)|0;
      $3 = ($D$3618_28|0)<($D$3623_33|0);
      if ($3) {
       $intvls_6 = 0;
       break L2;
      }
      $D$1523_34 = ($i_3|0)==(28);
      $i_35 = (($i_3) + 1)|0;
      $D$1523_34$expand_i1_val = $D$1523_34&1;
      $$expand_i1_val = 0;
      $4 = ($D$1523_34$expand_i1_val<<24>>24)!=($$expand_i1_val<<24>>24);
      if ($4) {
       break L7;
      }
      $i_3 = $i_35;
     }
    }
   } while(0);
   $D$3626_37 = HEAP32[$minvls_19>>2]|0;
   $np$219_38 = HEAP32[11104>>2]|0;
   $D$3628_39 = (($np$219_38) + -1)|0;
   $ar1 = (11112 + ($D$3628_39<<2)|0);
   $D$3629_40 = HEAP32[$ar1>>2]|0;
   $D$3630_41 = $D$3629_40<<1;
   $D$1525_42 = (($D$3626_37|0) / ($D$3630_41|0))&-1;
   $5 = ($D$1525_42|0)>(8);
   if ($5) {
    $M$1_12 = $D$1525_42;
   } else {
    $M$1_12 = 8;
   }
   HEAP32[11224>>2] = $M$1_12;
   $intvls_6 = 0;
  } else {
   $intvls_6 = 0;
  }
 } while(0);
 while(1) {
  $np$220_44 = HEAP32[11104>>2]|0;
  $D$3636_45 = (($np$220_44) + -1)|0;
  $ar2 = (11112 + ($D$3636_45<<2)|0);
  $D$3637_46 = HEAP32[$ar2>>2]|0;
  $D$3638_47 = (+($D$3637_46|0));
  $D$3639_48 = 1.0 / $D$3638_47;
  HEAPF64[tempDoublePtr>>3]=$D$3639_48;HEAP32[$vk>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$vk+4>>2]=HEAP32[tempDoublePtr+4>>2];
  $D$1526_50 = HEAP32[$ndim_22>>2]|0;
  $6 = (2)<=($D$1526_50|0);
  L18: do {
   if ($6) {
    $i_4 = 2;$k_7 = 1;
    while(1) {
     $7 = ($i_4|0)<=(100);
     if ($7) {
      $D$3645_52 = HEAP32[$ndim_22>>2]|0;
      $D$1530_53 = (($D$3645_52) + -1)|0;
      $8 = ($D$1530_53|0)>(99);
      if ($8) {
       $M$2_13 = 99;
      } else {
       $M$2_13 = $D$1530_53;
      }
      $np$221_56 = HEAP32[11104>>2]|0;
      $D$3650_57 = (($np$221_56) + -1)|0;
      $ar4 = (11112 + ($D$3650_57<<2)|0);
      $D$3651_58 = HEAP32[$ar4>>2]|0;
      $D$3652_59 = (+($D$3651_58|0));
      $D$3653_60 = ($M$2_13*28)|0;
      $np$222_61 = HEAP32[11104>>2]|0;
      $D$3655_62 = (($D$3653_60) + ($np$222_61))|0;
      $D$3656_63 = (($D$3655_62) + -29)|0;
      $ar5 = (16 + ($D$3656_63<<2)|0);
      $D$3657_64 = HEAP32[$ar5>>2]|0;
      $D$3658_65 = (+($D$3657_64|0));
      $D$3659_66 = (+($k_7|0));
      $D$3660_67 = $D$3658_65 * $D$3659_66;
      $D$3661_68 = (+_fmod((+$D$3660_67),(+$D$3652_59)));
      $k_69 = (~~(($D$3661_68)));
      $D$3662_70 = (($i_4) + -1)|0;
      $D$3663_71 = (+($k_69|0));
      HEAP32[tempDoublePtr>>2]=HEAP32[$vk>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$vk+4>>2];$D$3664_72 = +HEAPF64[tempDoublePtr>>3];
      $D$3665_73 = $D$3663_71 * $D$3664_72;
      $ar7 = (($vk) + ($D$3662_70<<3)|0);
      HEAPF64[tempDoublePtr>>3]=$D$3665_73;HEAP32[$ar7>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar7+4>>2]=HEAP32[tempDoublePtr+4>>2];
      $k_8 = $k_69;
     } else {
      $D$3667_74 = (($i_4) + -1)|0;
      $np$223_75 = HEAP32[11104>>2]|0;
      $D$3669_76 = (($np$223_75) + -1)|0;
      $ar8 = (11112 + ($D$3669_76<<2)|0);
      $D$3670_77 = HEAP32[$ar8>>2]|0;
      $D$3671_78 = (+($D$3670_77|0));
      $D$3672_79 = (($i_4) + -100)|0;
      $D$3673_80 = (+($D$3672_79|0));
      $D$3674_81 = HEAP32[$ndim_22>>2]|0;
      $D$3675_82 = (($D$3674_81) + -99)|0;
      $D$3676_83 = (+($D$3675_82|0));
      $D$3677_84 = $D$3673_80 / $D$3676_83;
      $D$3679_86 = (+Math_pow(2.0,(+$D$3677_84)));
      $D$3680_87 = $D$3671_78 * $D$3679_86;
      $D$3681_88 = (~~(($D$3680_87)));
      $D$3682_89 = (+($D$3681_88|0));
      $ar9 = (($vk) + ($D$3667_74<<3)|0);
      HEAPF64[tempDoublePtr>>3]=$D$3682_89;HEAP32[$ar9>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar9+4>>2]=HEAP32[tempDoublePtr+4>>2];
      $D$3683_90 = (($i_4) + -1)|0;
      $D$3684_91 = (($i_4) + -1)|0;
      $ar10 = (($vk) + ($D$3684_91<<3)|0);
      HEAP32[tempDoublePtr>>2]=HEAP32[$ar10>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar10+4>>2];$D$3685_92 = +HEAPF64[tempDoublePtr>>3];
      $np$224_93 = HEAP32[11104>>2]|0;
      $D$3687_94 = (($np$224_93) + -1)|0;
      $ar11 = (11112 + ($D$3687_94<<2)|0);
      $D$3688_95 = HEAP32[$ar11>>2]|0;
      $D$3689_96 = (+($D$3688_95|0));
      $D$3690_97 = $D$3685_92 / $D$3689_96;
      $D$3691_98 = (+_fmod((+$D$3690_97),1.0));
      $ar12 = (($vk) + ($D$3683_90<<3)|0);
      HEAPF64[tempDoublePtr>>3]=$D$3691_98;HEAP32[$ar12>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar12+4>>2]=HEAP32[tempDoublePtr+4>>2];
      $k_8 = $k_7;
     }
     $D$1532_99 = ($i_4|0)==($D$1526_50|0);
     $i_100 = (($i_4) + 1)|0;
     $D$1532_99$expand_i1_val = $D$1532_99&1;
     $$expand_i1_val1 = 0;
     $9 = ($D$1532_99$expand_i1_val<<24>>24)!=($$expand_i1_val1<<24>>24);
     if ($9) {
      break L18;
     }
     $i_4 = $i_100;$k_7 = $k_8;
    }
   }
  } while(0);
  $D$1533_103 = HEAP32[11224>>2]|0;
  $10 = (1)<=($D$1533_103|0);
  L30: do {
   if ($10) {
    $finval_1 = 0.0;$i_5 = 1;$varsqr_9 = 0.0;
    while(1) {
     $np$225_105 = HEAP32[11104>>2]|0;
     $D$3697_106 = (($np$225_105) + -1)|0;
     $ar13 = (11112 + ($D$3697_106<<2)|0);
     _dksmrc_($ndim_22,$klimi,$value,$ar13,$vk,$functn_108,$x);
     $value$226_109 = +HEAPF64[$value>>3];
     $D$3700_110 = $value$226_109 - $finval_1;
     $D$3702_112 = (+($i_5|0));
     $difint_113 = $D$3700_110 / $D$3702_112;
     $finval_114 = $finval_1 + $difint_113;
     $D$1538_116 = $difint_113 * $difint_113;
     $D$3703_117 = (($i_5) + -2)|0;
     $D$3704_118 = (+($D$3703_117|0));
     $D$3705_119 = $D$3704_118 * $varsqr_9;
     $D$3706_120 = (+($i_5|0));
     $D$3707_121 = $D$3705_119 / $D$3706_120;
     $varsqr_122 = $D$3707_121 + $D$1538_116;
     $D$1539_123 = ($i_5|0)==($D$1533_103|0);
     $i_124 = (($i_5) + 1)|0;
     $D$1539_123$expand_i1_val = $D$1539_123&1;
     $$expand_i1_val2 = 0;
     $11 = ($D$1539_123$expand_i1_val<<24>>24)!=($$expand_i1_val2<<24>>24);
     if ($11) {
      $finval_2 = $finval_114;$varsqr_10 = $varsqr_122;
      break L30;
     }
     $finval_1 = $finval_114;$i_5 = $i_124;$varsqr_9 = $varsqr_122;
    }
   } else {
    $finval_2 = 0.0;$varsqr_10 = 0.0;
   }
  } while(0);
  $sampls$227_125 = HEAP32[11224>>2]|0;
  $D$3710_126 = $sampls$227_125<<1;
  $np$228_127 = HEAP32[11104>>2]|0;
  $D$3712_128 = (($np$228_127) + -1)|0;
  $ar14 = (11112 + ($D$3712_128<<2)|0);
  $D$3713_129 = HEAP32[$ar14>>2]|0;
  $D$3714_130 = Math_imul($D$3710_126, $D$3713_129)|0;
  $intvls_131 = (($D$3714_130) + ($intvls_6))|0;
  $varest$229_132 = +HEAPF64[11232>>3];
  $varprd_133 = $varest$229_132 * $varsqr_10;
  $D$3716_134 = +HEAPF64[$finest_21>>3];
  $D$3717_135 = +HEAPF64[$finest_21>>3];
  $D$3718_136 = $finval_2 - $D$3717_135;
  $D$3720_138 = $varprd_133 + 1.0;
  $D$3722_140 = $D$3718_136 / $D$3720_138;
  $D$3723_141 = $D$3716_134 + $D$3722_140;
  HEAPF64[$finest_21>>3] = $D$3723_141;
  $D$3724_142 = $varsqr_10 > 0.0;
  $D$3724_142$expand_i1_val = $D$3724_142&1;
  $$expand_i1_val3 = 0;
  $12 = ($D$3724_142$expand_i1_val<<24>>24)!=($$expand_i1_val3<<24>>24);
  if ($12) {
   $D$3727_143 = $varprd_133 + 1.0;
   $varest$230_145 = $D$3727_143 / $varsqr_10;
   HEAPF64[11232>>3] = $varest$230_145;
  }
  $D$3731_146 = $varprd_133 + 1.0;
  $D$3733_148 = $varsqr_10 / $D$3731_146;
  $D$3734_149 = (+Math_sqrt((+$D$3733_148)));
  $D$3735_150 = $D$3734_149 * 7.0;
  $D$3736_151 = $D$3735_150 / 2.0;
  HEAPF64[$abserr_152>>3] = $D$3736_151;
  $D$1542_154 = +HEAPF64[$abseps_153>>3];
  $D$3737_156 = +HEAPF64[$finest_21>>3];
  $D$3738_157 = (+Math_abs((+$D$3737_156)));
  $D$3739_159 = +HEAPF64[$releps_158>>3];
  $D$1544_160 = $D$3738_157 * $D$3739_159;
  $D$3740_161 = $D$1544_160 > $D$1542_154;
  $D$3741_162 = ($D$1542_154 != $D$1542_154) | ($D$1542_154 != $D$1542_154);
  $D$3740_161$expand_i1_val = $D$3740_161&1;
  $$expand_i1_val4 = 0;
  $toBool = ($D$3740_161$expand_i1_val<<24>>24)!=($$expand_i1_val4<<24>>24);
  $D$3741_162$expand_i1_val = $D$3741_162&1;
  $$expand_i1_val5 = 0;
  $toBool15 = ($D$3741_162$expand_i1_val<<24>>24)!=($$expand_i1_val5<<24>>24);
  $D$3742_163 = $toBool | $toBool15;
  $D$3742_163$expand_i1_val = $D$3742_163&1;
  $$expand_i1_val6 = 0;
  $13 = ($D$3742_163$expand_i1_val<<24>>24)!=($$expand_i1_val6<<24>>24);
  if ($13) {
   $M$3_14 = $D$1544_160;
  } else {
   $M$3_14 = $D$1542_154;
  }
  $D$3746_165 = +HEAPF64[$abserr_152>>3];
  $D$3747_166 = $D$3746_165 > $M$3_14;
  $D$3747_166$expand_i1_val = $D$3747_166&1;
  $$expand_i1_val7 = 0;
  $14 = ($D$3747_166$expand_i1_val<<24>>24)!=($$expand_i1_val7<<24>>24);
  if (!($14)) {
   label = 36;
   break;
  }
  $np$231_167 = HEAP32[11104>>2]|0;
  $15 = ($np$231_167|0)<=(27);
  if ($15) {
   $np$232_168 = HEAP32[11104>>2]|0;
   $np$233_169 = (($np$232_168) + 1)|0;
   HEAP32[11104>>2] = $np$233_169;
  } else {
   $sampls$234_170 = HEAP32[11224>>2]|0;
   $D$3757_171 = ($sampls$234_170*3)|0;
   $D$1546_172 = (($D$3757_171|0) / 2)&-1;
   $D$3758_175 = HEAP32[$maxvls_174>>2]|0;
   $D$3759_176 = (($D$3758_175) - ($intvls_131))|0;
   $np$235_177 = HEAP32[11104>>2]|0;
   $D$3761_178 = (($np$235_177) + -1)|0;
   $ar16 = (11112 + ($D$3761_178<<2)|0);
   $D$3762_179 = HEAP32[$ar16>>2]|0;
   $D$3763_180 = $D$3762_179<<1;
   $D$1548_181 = (($D$3759_176|0) / ($D$3763_180|0))&-1;
   $16 = ($D$1548_181|0)<($D$1546_172|0);
   if ($16) {
    $M$4_15 = $D$1548_181;
   } else {
    $M$4_15 = $D$1546_172;
   }
   HEAP32[11224>>2] = $M$4_15;
   $sampls$236_184 = HEAP32[11224>>2]|0;
   $17 = ($sampls$236_184|0)>(8);
   if ($17) {
    $M$5_185 = HEAP32[11224>>2]|0;
    $M$5_16 = $M$5_185;
   } else {
    $M$5_16 = 8;
   }
   HEAP32[11224>>2] = $M$5_16;
  }
  $sampls$237_186 = HEAP32[11224>>2]|0;
  $D$3772_187 = $sampls$237_186<<1;
  $np$238_188 = HEAP32[11104>>2]|0;
  $D$3774_189 = (($np$238_188) + -1)|0;
  $ar17 = (11112 + ($D$3774_189<<2)|0);
  $D$3775_190 = HEAP32[$ar17>>2]|0;
  $D$3776_191 = Math_imul($D$3772_187, $D$3775_190)|0;
  $D$3777_192 = (($D$3776_191) + ($intvls_131))|0;
  $D$3778_193 = HEAP32[$maxvls_174>>2]|0;
  $18 = ($D$3777_192|0)<=($D$3778_193|0);
  if ($18) {
   $intvls_6 = $intvls_131;
  } else {
   break;
  }
 }
 if ((label|0) == 36) {
  HEAP32[$inform_17>>2] = 0;
 }
 HEAP32[$minvls_19>>2] = $intvls_131;
 STACKTOP = sp;return;
}
function _dksmrc_($ndim,$klim,$sumkro,$prime,$vk,$functn,$x) {
 $ndim = $ndim|0;
 $klim = $klim|0;
 $sumkro = $sumkro|0;
 $prime = $prime|0;
 $vk = $vk|0;
 $functn = $functn|0;
 $x = $x|0;
 var $$expand_i1_val = 0, $$expand_i1_val1 = 0, $$expand_i1_val2 = 0, $$expand_i1_val3 = 0, $$expand_i1_val4 = 0, $0 = 0, $1 = 0, $10 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $D$1572_9 = 0, $D$1574_12 = 0, $D$1575_15 = 0, $D$1580_32 = 0;
 var $D$1580_32$expand_i1_val = 0, $D$1581_34 = 0, $D$1584_41 = 0, $D$1584_41$expand_i1_val = 0, $D$1585_44 = 0, $D$1588_46 = 0, $D$1591_62 = 0, $D$1591_62$expand_i1_val = 0, $D$1592_75 = 0, $D$1595_81 = 0, $D$1595_81$expand_i1_val = 0, $D$1596_92 = 0, $D$1596_92$expand_i1_val = 0, $D$3539_17 = 0.0, $D$3540_18 = 0.0, $D$3541_19 = 0, $D$3542_20 = 0, $D$3543_21 = 0.0, $D$3544_22 = 0.0, $D$3545_23 = 0.0;
 var $D$3546_25 = 0, $D$3547_28 = 0, $D$3548_29 = 0, $D$3549_30 = 0.0, $D$3550_31 = 0, $D$3555_36 = 0, $D$3556_37 = 0, $D$3557_38 = 0, $D$3558_39 = 0.0, $D$3566_48 = 0, $D$3567_49 = 0.0, $D$3568_50 = 0, $D$3569_51 = 0.0, $D$3570_52 = 0.0, $D$3571_53 = 0, $D$3572_54 = 0, $D$3573_55 = 0, $D$3574_56 = 0.0, $D$3575_57 = 0.0, $D$3576_58 = 0.0;
 var $D$3577_59 = 0.0, $D$3578_60 = 0.0, $D$3579_61 = 0.0, $D$3581_64 = 0.0, $D$3582_66 = 0.0, $D$3583_67 = 0.0, $D$3584_68 = 0.0, $D$3586_70 = 0, $D$3587_71 = 0, $D$3588_72 = 0.0, $D$3589_73 = 0.0, $D$3590_74 = 0.0, $D$3594_77 = 0, $D$3595_78 = 0, $D$3596_79 = 0.0, $D$3597_80 = 0.0, $D$3599_83 = 0.0, $D$3600_84 = 0.0, $D$3601_85 = 0.0, $D$3602_86 = 0.0;
 var $D$3604_88 = 0, $D$3605_89 = 0.0, $D$3606_90 = 0.0, $D$3607_91 = 0.0, $M$6_6 = 0, $ar = 0, $ar1 = 0, $ar2 = 0, $ar3 = 0, $ar4 = 0, $ar5 = 0, $ar6 = 0, $ar7 = 0, $ar8 = 0, $ar9 = 0, $functn_65 = 0, $functn_addr = 0, $j_1 = 0, $j_2 = 0, $j_3 = 0;
 var $j_33 = 0, $j_4 = 0, $j_42 = 0, $j_63 = 0, $j_82 = 0, $jp_24 = 0, $k_5 = 0, $k_93 = 0, $klim_11 = 0, $klim_addr = 0, $ndim_8 = 0, $ndim_addr = 0, $prime_43 = 0, $prime_addr = 0, $sumkro_7 = 0, $sumkro_addr = 0, $vk_26 = 0, $vk_addr = 0, $x_40 = 0, $x_addr = 0;
 var $xt_27 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $ndim_addr = $ndim;
 $klim_addr = $klim;
 $sumkro_addr = $sumkro;
 $prime_addr = $prime;
 $vk_addr = $vk;
 $functn_addr = $functn;
 $x_addr = $x;
 $sumkro_7 = $sumkro_addr;
 $ndim_8 = $ndim_addr;
 $klim_11 = $klim_addr;
 $vk_26 = $vk_addr;
 $x_40 = $x_addr;
 $prime_43 = $prime_addr;
 $functn_65 = $functn_addr;
 HEAPF64[$sumkro_7>>3] = 0.0;
 $D$1572_9 = HEAP32[$ndim_8>>2]|0;
 $D$1574_12 = HEAP32[$klim_11>>2]|0;
 $0 = ($D$1574_12|0)<($D$1572_9|0);
 if ($0) {
  $M$6_6 = $D$1574_12;
 } else {
  $M$6_6 = $D$1572_9;
 }
 $D$1575_15 = (($M$6_6) + -1)|0;
 $1 = (1)<=($D$1575_15|0);
 L5: do {
  if ($1) {
   $j_1 = 1;
   while(1) {
    $D$3539_17 = (+($j_1|0));
    $D$3540_18 = (+_mvnuni_());
    $D$3541_19 = (($M$6_6) + 1)|0;
    $D$3542_20 = (($D$3541_19) - ($j_1))|0;
    $D$3543_21 = (+($D$3542_20|0));
    $D$3544_22 = $D$3540_18 * $D$3543_21;
    $D$3545_23 = $D$3539_17 + $D$3544_22;
    $jp_24 = (~~(($D$3545_23)));
    $D$3546_25 = (($j_1) + -1)|0;
    $ar = (($vk_26) + ($D$3546_25<<3)|0);
    HEAP32[tempDoublePtr>>2]=HEAP32[$ar>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar+4>>2];$xt_27 = +HEAPF64[tempDoublePtr>>3];
    $D$3547_28 = (($j_1) + -1)|0;
    $D$3548_29 = (($jp_24) + -1)|0;
    $ar1 = (($vk_26) + ($D$3548_29<<3)|0);
    HEAP32[tempDoublePtr>>2]=HEAP32[$ar1>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar1+4>>2];$D$3549_30 = +HEAPF64[tempDoublePtr>>3];
    $ar2 = (($vk_26) + ($D$3547_28<<3)|0);
    HEAPF64[tempDoublePtr>>3]=$D$3549_30;HEAP32[$ar2>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar2+4>>2]=HEAP32[tempDoublePtr+4>>2];
    $D$3550_31 = (($jp_24) + -1)|0;
    $ar3 = (($vk_26) + ($D$3550_31<<3)|0);
    HEAPF64[tempDoublePtr>>3]=$xt_27;HEAP32[$ar3>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar3+4>>2]=HEAP32[tempDoublePtr+4>>2];
    $D$1580_32 = ($j_1|0)==($D$1575_15|0);
    $j_33 = (($j_1) + 1)|0;
    $D$1580_32$expand_i1_val = $D$1580_32&1;
    $$expand_i1_val = 0;
    $2 = ($D$1580_32$expand_i1_val<<24>>24)!=($$expand_i1_val<<24>>24);
    if ($2) {
     break L5;
    }
    $j_1 = $j_33;
   }
  }
 } while(0);
 $D$1581_34 = HEAP32[$ndim_8>>2]|0;
 $3 = (1)<=($D$1581_34|0);
 L10: do {
  if ($3) {
   $j_2 = 1;
   while(1) {
    $D$3555_36 = HEAP32[$ndim_8>>2]|0;
    $D$3556_37 = (($D$3555_36) + ($j_2))|0;
    $D$3557_38 = (($D$3556_37) + -1)|0;
    $D$3558_39 = (+_mvnuni_());
    $ar4 = (($x_40) + ($D$3557_38<<3)|0);
    HEAPF64[tempDoublePtr>>3]=$D$3558_39;HEAP32[$ar4>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar4+4>>2]=HEAP32[tempDoublePtr+4>>2];
    $D$1584_41 = ($j_2|0)==($D$1581_34|0);
    $j_42 = (($j_2) + 1)|0;
    $D$1584_41$expand_i1_val = $D$1584_41&1;
    $$expand_i1_val1 = 0;
    $4 = ($D$1584_41$expand_i1_val<<24>>24)!=($$expand_i1_val1<<24>>24);
    if ($4) {
     break L10;
    }
    $j_2 = $j_42;
   }
  }
 } while(0);
 $D$1585_44 = HEAP32[$prime_43>>2]|0;
 $5 = (1)<=($D$1585_44|0);
 L15: do {
  if ($5) {
   $k_5 = 1;
   while(1) {
    $D$1588_46 = HEAP32[$ndim_8>>2]|0;
    $6 = (1)<=($D$1588_46|0);
    L18: do {
     if ($6) {
      $j_3 = 1;
      while(1) {
       $D$3566_48 = (($j_3) + -1)|0;
       $D$3567_49 = (+($k_5|0));
       $D$3568_50 = (($j_3) + -1)|0;
       $ar5 = (($vk_26) + ($D$3568_50<<3)|0);
       HEAP32[tempDoublePtr>>2]=HEAP32[$ar5>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar5+4>>2];$D$3569_51 = +HEAPF64[tempDoublePtr>>3];
       $D$3570_52 = $D$3567_49 * $D$3569_51;
       $D$3571_53 = HEAP32[$ndim_8>>2]|0;
       $D$3572_54 = (($D$3571_53) + ($j_3))|0;
       $D$3573_55 = (($D$3572_54) + -1)|0;
       $ar6 = (($x_40) + ($D$3573_55<<3)|0);
       HEAP32[tempDoublePtr>>2]=HEAP32[$ar6>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar6+4>>2];$D$3574_56 = +HEAPF64[tempDoublePtr>>3];
       $D$3575_57 = $D$3570_52 + $D$3574_56;
       $D$3576_58 = (+_fmod((+$D$3575_57),1.0));
       $D$3577_59 = $D$3576_58 * 2.0;
       $D$3578_60 = $D$3577_59 - 1.0;
       $D$3579_61 = (+Math_abs((+$D$3578_60)));
       $ar7 = (($x_40) + ($D$3566_48<<3)|0);
       HEAPF64[tempDoublePtr>>3]=$D$3579_61;HEAP32[$ar7>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar7+4>>2]=HEAP32[tempDoublePtr+4>>2];
       $D$1591_62 = ($j_3|0)==($D$1588_46|0);
       $j_63 = (($j_3) + 1)|0;
       $D$1591_62$expand_i1_val = $D$1591_62&1;
       $$expand_i1_val2 = 0;
       $7 = ($D$1591_62$expand_i1_val<<24>>24)!=($$expand_i1_val2<<24>>24);
       if ($7) {
        break L18;
       }
       $j_3 = $j_63;
      }
     }
    } while(0);
    $D$3581_64 = +HEAPF64[$sumkro_7>>3];
    $D$3582_66 = (+FUNCTION_TABLE_dii[$functn_65 & 1]($ndim_8,$x_40));
    $D$3583_67 = +HEAPF64[$sumkro_7>>3];
    $D$3584_68 = $D$3582_66 - $D$3583_67;
    $D$3586_70 = $k_5<<1;
    $D$3587_71 = (($D$3586_70) + -1)|0;
    $D$3588_72 = (+($D$3587_71|0));
    $D$3589_73 = $D$3584_68 / $D$3588_72;
    $D$3590_74 = $D$3581_64 + $D$3589_73;
    HEAPF64[$sumkro_7>>3] = $D$3590_74;
    $D$1592_75 = HEAP32[$ndim_8>>2]|0;
    $8 = (1)<=($D$1592_75|0);
    L23: do {
     if ($8) {
      $j_4 = 1;
      while(1) {
       $D$3594_77 = (($j_4) + -1)|0;
       $D$3595_78 = (($j_4) + -1)|0;
       $ar8 = (($x_40) + ($D$3595_78<<3)|0);
       HEAP32[tempDoublePtr>>2]=HEAP32[$ar8>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar8+4>>2];$D$3596_79 = +HEAPF64[tempDoublePtr>>3];
       $D$3597_80 = 1.0 - $D$3596_79;
       $ar9 = (($x_40) + ($D$3594_77<<3)|0);
       HEAPF64[tempDoublePtr>>3]=$D$3597_80;HEAP32[$ar9>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar9+4>>2]=HEAP32[tempDoublePtr+4>>2];
       $D$1595_81 = ($j_4|0)==($D$1592_75|0);
       $j_82 = (($j_4) + 1)|0;
       $D$1595_81$expand_i1_val = $D$1595_81&1;
       $$expand_i1_val3 = 0;
       $9 = ($D$1595_81$expand_i1_val<<24>>24)!=($$expand_i1_val3<<24>>24);
       if ($9) {
        break L23;
       }
       $j_4 = $j_82;
      }
     }
    } while(0);
    $D$3599_83 = +HEAPF64[$sumkro_7>>3];
    $D$3600_84 = (+FUNCTION_TABLE_dii[$functn_65 & 1]($ndim_8,$x_40));
    $D$3601_85 = +HEAPF64[$sumkro_7>>3];
    $D$3602_86 = $D$3600_84 - $D$3601_85;
    $D$3604_88 = $k_5<<1;
    $D$3605_89 = (+($D$3604_88|0));
    $D$3606_90 = $D$3602_86 / $D$3605_89;
    $D$3607_91 = $D$3599_83 + $D$3606_90;
    HEAPF64[$sumkro_7>>3] = $D$3607_91;
    $D$1596_92 = ($k_5|0)==($D$1585_44|0);
    $k_93 = (($k_5) + 1)|0;
    $D$1596_92$expand_i1_val = $D$1596_92&1;
    $$expand_i1_val4 = 0;
    $10 = ($D$1596_92$expand_i1_val<<24>>24)!=($$expand_i1_val4<<24>>24);
    if ($10) {
     break L15;
    }
    $k_5 = $k_93;
   }
  }
 } while(0);
 STACKTOP = sp;return;
}
function _mvnuni_() {
 var $$retval$3C3E = 0.0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0.0, $D$3471_8 = 0, $D$3473_10 = 0, $D$3474_11 = 0, $D$3475_12 = 0, $D$3477_16 = 0, $D$3479_18 = 0, $D$3480_19 = 0, $D$3481_20 = 0, $D$3498_32 = 0, $D$3500_34 = 0, $D$3501_35 = 0;
 var $D$3502_36 = 0, $D$3504_40 = 0, $D$3506_42 = 0, $D$3507_43 = 0, $D$3508_44 = 0, $D$3529_58 = 0.0, $D$3531_60 = 0.0, $__result_mvnuni = 0.0, $__result_mvnuni$216_59 = 0.0, $h_15 = 0, $h_31 = 0, $h_39 = 0, $h_7 = 0, $p12_1 = 0, $p12_21 = 0, $p12_23 = 0, $p13_13 = 0, $p13_2 = 0, $p13_22 = 0, $p21_3 = 0;
 var $p21_45 = 0, $p21_47 = 0, $p23_37 = 0, $p23_4 = 0, $p23_46 = 0, $x10$194_6 = 0, $x10$195_9 = 0, $x11$196_14 = 0, $x11$197_17 = 0, $x11$198_24 = 0, $x12$199_25 = 0, $x12$200_26 = 0, $x12$201_27 = 0, $x12$202_28 = 0, $x12$203_29 = 0, $x12$214_54 = 0, $x20$204_30 = 0, $x20$205_33 = 0, $x21$208_48 = 0, $x22$206_38 = 0;
 var $x22$207_41 = 0, $x22$209_49 = 0, $x22$210_50 = 0, $x22$211_51 = 0, $x22$212_52 = 0, $x22$213_53 = 0, $x22$215_55 = 0, $z_5 = 0, $z_56 = 0, $z_57 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $x10$194_6 = HEAP32[11240>>2]|0;
 $h_7 = (($x10$194_6|0) / 11714)&-1;
 $D$3471_8 = Math_imul($h_7, -11714)|0;
 $x10$195_9 = HEAP32[11240>>2]|0;
 $D$3473_10 = (($D$3471_8) + ($x10$195_9))|0;
 $D$3474_11 = ($D$3473_10*183326)|0;
 $D$3475_12 = Math_imul($h_7, -2883)|0;
 $p13_13 = (($D$3474_11) + ($D$3475_12))|0;
 $x11$196_14 = HEAP32[11248>>2]|0;
 $h_15 = (($x11$196_14|0) / 33921)&-1;
 $D$3477_16 = Math_imul($h_15, -33921)|0;
 $x11$197_17 = HEAP32[11248>>2]|0;
 $D$3479_18 = (($D$3477_16) + ($x11$197_17))|0;
 $D$3480_19 = ($D$3479_18*63308)|0;
 $D$3481_20 = Math_imul($h_15, -12979)|0;
 $p12_21 = (($D$3480_19) + ($D$3481_20))|0;
 $0 = ($p13_13|0)<(0);
 if ($0) {
  $p13_22 = (($p13_13) + 2147483647)|0;
  $p13_2 = $p13_22;
 } else {
  $p13_2 = $p13_13;
 }
 $1 = ($p12_21|0)<(0);
 if ($1) {
  $p12_23 = (($p12_21) + 2147483647)|0;
  $p12_1 = $p12_23;
 } else {
  $p12_1 = $p12_21;
 }
 $x11$198_24 = HEAP32[11248>>2]|0;
 HEAP32[11240>>2] = $x11$198_24;
 $x12$199_25 = HEAP32[11256>>2]|0;
 HEAP32[11248>>2] = $x12$199_25;
 $x12$200_26 = (($p12_1) - ($p13_2))|0;
 HEAP32[11256>>2] = $x12$200_26;
 $x12$201_27 = HEAP32[11256>>2]|0;
 $2 = ($x12$201_27|0)<(0);
 if ($2) {
  $x12$202_28 = HEAP32[11256>>2]|0;
  $x12$203_29 = (($x12$202_28) + 2147483647)|0;
  HEAP32[11256>>2] = $x12$203_29;
 }
 $x20$204_30 = HEAP32[11264>>2]|0;
 $h_31 = (($x20$204_30|0) / 3976)&-1;
 $D$3498_32 = Math_imul($h_31, -3976)|0;
 $x20$205_33 = HEAP32[11264>>2]|0;
 $D$3500_34 = (($D$3498_32) + ($x20$205_33))|0;
 $D$3501_35 = ($D$3500_34*539608)|0;
 $D$3502_36 = Math_imul($h_31, -2071)|0;
 $p23_37 = (($D$3501_35) + ($D$3502_36))|0;
 $x22$206_38 = HEAP32[11280>>2]|0;
 $h_39 = (($x22$206_38|0) / 24919)&-1;
 $D$3504_40 = Math_imul($h_39, -24919)|0;
 $x22$207_41 = HEAP32[11280>>2]|0;
 $D$3506_42 = (($D$3504_40) + ($x22$207_41))|0;
 $D$3507_43 = ($D$3506_42*86098)|0;
 $D$3508_44 = Math_imul($h_39, -7417)|0;
 $p21_45 = (($D$3507_43) + ($D$3508_44))|0;
 $3 = ($p23_37|0)<(0);
 if ($3) {
  $p23_46 = (($p23_37) + 2145483479)|0;
  $p23_4 = $p23_46;
 } else {
  $p23_4 = $p23_37;
 }
 $4 = ($p21_45|0)<(0);
 if ($4) {
  $p21_47 = (($p21_45) + 2145483479)|0;
  $p21_3 = $p21_47;
 } else {
  $p21_3 = $p21_45;
 }
 $x21$208_48 = HEAP32[11272>>2]|0;
 HEAP32[11264>>2] = $x21$208_48;
 $x22$209_49 = HEAP32[11280>>2]|0;
 HEAP32[11272>>2] = $x22$209_49;
 $x22$210_50 = (($p21_3) - ($p23_4))|0;
 HEAP32[11280>>2] = $x22$210_50;
 $x22$211_51 = HEAP32[11280>>2]|0;
 $5 = ($x22$211_51|0)<(0);
 if ($5) {
  $x22$212_52 = HEAP32[11280>>2]|0;
  $x22$213_53 = (($x22$212_52) + 2145483479)|0;
  HEAP32[11280>>2] = $x22$213_53;
 }
 $x12$214_54 = HEAP32[11256>>2]|0;
 $x22$215_55 = HEAP32[11280>>2]|0;
 $z_56 = (($x12$214_54) - ($x22$215_55))|0;
 $6 = ($z_56|0)<=(0);
 if ($6) {
  $z_57 = (($z_56) + 2147483647)|0;
  $z_5 = $z_57;
 } else {
  $z_5 = $z_56;
 }
 $D$3529_58 = (+($z_5|0));
 $__result_mvnuni$216_59 = $D$3529_58 * 4.6566128730773926E-10;
 $__result_mvnuni = $__result_mvnuni$216_59;
 $D$3531_60 = $__result_mvnuni;
 $$retval$3C3E = $D$3531_60;
 $7 = $$retval$3C3E;
 STACKTOP = sp;return (+$7);
}
function _mvndfn_($n,$w) {
 $n = $n|0;
 $w = $w|0;
 var $$retval$3C3E = 0.0, $0 = 0.0, $D$3468_3 = 0.0, $n_2 = 0, $n_addr = 0, $w_1 = 0, $w_addr = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $n_addr = $n;
 $w_addr = $w;
 $w_1 = $w_addr;
 $n_2 = $n_addr;
 $D$3468_3 = (+_master_0_mvndfn_(0,0,0,0,0,0,0,0,$w_1,$n_2));
 $$retval$3C3E = $D$3468_3;
 $0 = $$retval$3C3E;
 STACKTOP = sp;return (+$0);
}
function _master_0_mvndfn_($__entry,$e,$d,$infis,$infin,$upper,$lower,$correl,$w,$n) {
 $__entry = $__entry|0;
 $e = $e|0;
 $d = $d|0;
 $infis = $infis|0;
 $infin = $infin|0;
 $upper = $upper|0;
 $lower = $lower|0;
 $correl = $correl|0;
 $w = $w|0;
 $n = $n|0;
 var $$expand_i1_val = 0, $$expand_i1_val1 = 0, $$expand_i1_val10 = 0, $$expand_i1_val11 = 0, $$expand_i1_val12 = 0, $$expand_i1_val13 = 0, $$expand_i1_val14 = 0, $$expand_i1_val15 = 0, $$expand_i1_val16 = 0, $$expand_i1_val2 = 0, $$expand_i1_val3 = 0, $$expand_i1_val4 = 0, $$expand_i1_val5 = 0, $$expand_i1_val6 = 0, $$expand_i1_val7 = 0, $$expand_i1_val8 = 0, $$expand_i1_val9 = 0, $$retval$3C3E = 0.0, $0 = 0, $1 = 0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0.0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $D$1696_88 = 0, $D$1699_91 = 0, $D$1703_100 = 0, $D$1703_100$expand_i1_val = 0, $D$1707_107 = 0.0, $D$1711_121 = 0.0, $D$1713 = 0, $D$1723 = 0, $D$1727_165 = 0, $D$1727_165$expand_i1_val = 0, $D$1753_40 = 0.0, $D$1754_41 = 0.0;
 var $D$1757 = 0, $D$1769_58 = 0.0, $D$1771_60 = 0.0, $D$1775_69 = 0.0, $D$1777_71 = 0.0, $D$3292_87 = 0, $D$3301_94 = 0, $D$3302_95 = 0.0, $D$3303_96 = 0, $D$3304_97 = 0.0, $D$3305_98 = 0.0, $D$3308_102 = 0, $D$3309_103 = 0, $D$3314_105 = 0, $D$3315_106 = 0.0, $D$3316_108 = 0, $D$3316_108$expand_i1_val = 0, $D$3317_109 = 0, $D$3317_109$expand_i1_val = 0, $D$3318_110 = 0;
 var $D$3318_110$expand_i1_val = 0, $D$3323_112 = 0, $D$3324_113 = 0.0, $D$3327_116 = 0, $D$3328_117 = 0, $D$3333_119 = 0, $D$3334_120 = 0.0, $D$3335_122 = 0, $D$3335_122$expand_i1_val = 0, $D$3336_123 = 0, $D$3336_123$expand_i1_val = 0, $D$3337_124 = 0, $D$3337_124$expand_i1_val = 0, $D$3342_126 = 0, $D$3343_127 = 0.0, $D$3347_131 = 0, $D$3348_132 = 0, $D$3350_133 = 0, $D$3351_134 = 0.0, $D$3352_135 = 0;
 var $D$3352_135$expand_i1_val = 0, $D$3353_136 = 0, $D$3354_137 = 0, $D$3355_138 = 0, $D$3358_141 = 0, $D$3358_141$expand_i1_val = 0, $D$3361_142 = 0.0, $D$3361_167 = 0.0, $D$3361_21 = 0.0, $D$3361_82 = 0.0, $D$3364_145 = 0.0, $D$3368_149 = 0, $D$3371_150 = 0, $D$3372_152 = 0.0, $D$3375_155 = 0.0, $D$3377_157 = 0.0, $D$3379_159 = 0.0, $D$3380_160 = 0, $D$3381_161 = 0.0, $D$3384_29 = 0;
 var $D$3385_30 = 0, $D$3386_31 = 0, $D$3390_34 = 0, $D$3391_35 = 0, $D$3392_36 = 0, $D$3395_37 = 0.0, $D$3396_38 = 0.0, $D$3397_39 = 0, $D$3397_39$expand_i1_val = 0, $D$3400_42 = 0.0, $D$3401_43 = 0.0, $D$3402_44 = 0, $D$3405_45 = 0.0, $D$3406_46 = 0.0, $D$3407_47 = 0.0, $D$3409_48 = 0, $D$3412_49 = 0.0, $D$3413_50 = 0.0, $D$3414_51 = 0.0, $D$3416_52 = 0.0;
 var $D$3417_53 = 0.0, $D$3418_54 = 0.0, $D$3419_55 = 0.0, $D$3421_56 = 0, $D$3424_57 = 0, $D$3427_61 = 0, $D$3427_61$expand_i1_val = 0, $D$3428_62 = 0, $D$3428_62$expand_i1_val = 0, $D$3429_63 = 0, $D$3429_63$expand_i1_val = 0, $D$3435_65 = 0, $D$3438_66 = 0.0, $D$3440_67 = 0, $D$3443_68 = 0, $D$3446_72 = 0, $D$3446_72$expand_i1_val = 0, $D$3447_73 = 0, $D$3447_73$expand_i1_val = 0, $D$3448_74 = 0;
 var $D$3448_74$expand_i1_val = 0, $D$3454_76 = 0, $D$3457_77 = 0.0, $D$3459_78 = 0, $D$3460_79 = 0, $D$3464_80 = 0, $D$3465_81 = 0, $M$11_19 = 0.0, $M$12_20 = 0.0, $M$8_104 = 0.0, $M$8_17 = 0.0, $M$9_118 = 0.0, $M$9_18 = 0.0, $__entry_22 = 0, $__entry_addr = 0, $__result_master$0$189_147 = 0.0, $__result_master$0$190_148 = 0.0, $__result_master$0$mvndfn = 0.0, $ai = 0, $ai$183_114 = 0.0;
 var $ar = 0, $ar1 = 0, $ar10 = 0, $ar11 = 0, $ar12 = 0, $ar13 = 0, $ar2 = 0, $ar3 = 0, $ar5 = 0, $ar6 = 0, $ar7 = 0, $bi = 0, $bi$184_128 = 0.0, $correl_26 = 0, $correl_addr = 0, $d_32 = 0, $d_addr = 0, $di = 0, $di$185_139 = 0.0, $di$188_144 = 0.0;
 var $di$192_154 = 0.0, $di$193_158 = 0.0, $e_33 = 0, $e_addr = 0, $ei = 0, $ei$186_140 = 0.0, $ei$187_143 = 0.0, $ei$191_153 = 0.0, $i_1 = 0, $i_166 = 0, $ij_130 = 0, $ij_2 = 0, $ij_3 = 0, $ij_4 = 0, $ij_93 = 0, $ik_162 = 0, $ik_5 = 0, $ik_6 = 0, $infa_7 = 0, $infa_8 = 0;
 var $infa_9 = 0, $infb_10 = 0, $infb_11 = 0, $infb_12 = 0, $infin_27 = 0, $infin_addr = 0, $infis_28 = 0, $infis_addr = 0, $j_101 = 0, $j_13 = 0, $lower_24 = 0, $lower_addr = 0, $n_23 = 0, $n_addr = 0, $sum_14 = 0.0, $sum_15 = 0.0, $sum_16 = 0.0, $sum_99 = 0.0, $toBool = 0, $toBool14 = 0;
 var $toBool15 = 0, $toBool16 = 0, $toBool17 = 0, $toBool4 = 0, $toBool8 = 0, $toBool9 = 0, $upper_25 = 0, $upper_addr = 0, $w_151 = 0, $w_addr = 0, $y = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 4112|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $ai = sp + 4056|0;
 $bi = sp + 4048|0;
 $di = sp + 4040|0;
 $ei = sp + 4032|0;
 $y = sp + 32|0;
 $D$1713 = sp + 4064|0;
 $D$1723 = sp + 16|0;
 $D$1757 = sp + 8|0;
 $__entry_addr = $__entry;
 $e_addr = $e;
 $d_addr = $d;
 $infis_addr = $infis;
 $infin_addr = $infin;
 $upper_addr = $upper;
 $lower_addr = $lower;
 $correl_addr = $correl;
 $w_addr = $w;
 $n_addr = $n;
 $__entry_22 = $__entry_addr;
 $n_23 = $n_addr;
 $w_151 = $w_addr;
 $lower_24 = $lower_addr;
 $upper_25 = $upper_addr;
 $correl_26 = $correl_addr;
 $infin_27 = $infin_addr;
 $infis_28 = $infis_addr;
 $d_32 = $d_addr;
 $e_33 = $e_addr;
 if ((($__entry_22|0) == 0)) {
  label = 5;
 } else if ((($__entry_22|0) == 1)) {
  $__result_master$0$mvndfn = 0.0;
  _covsrt_($n_23,$lower_24,$upper_25,$correl_26,$infin_27,$y,$infis_28,11288,15288,19288,1021288);
  $D$3384_29 = HEAP32[$n_23>>2]|0;
  $D$3385_30 = HEAP32[$infis_28>>2]|0;
  $D$3386_31 = (($D$3384_29) - ($D$3385_30))|0;
  $15 = ($D$3386_31|0)==(1);
  if ($15) {
   _mvnlms_(11288,15288,1021288,$d_32,$e_33);
  } else {
   $D$3390_34 = HEAP32[$n_23>>2]|0;
   $D$3391_35 = HEAP32[$infis_28>>2]|0;
   $D$3392_36 = (($D$3390_34) - ($D$3391_35))|0;
   $16 = ($D$3392_36|0)==(2);
   if ($16) {
    HEAP32[tempDoublePtr>>2]=HEAP32[((19288 + 16|0))>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[((19288 + 16|0))+4>>2];$D$3395_37 = +HEAPF64[tempDoublePtr>>3];
    $D$3396_38 = (+Math_abs((+$D$3395_37)));
    $D$3397_39 = $D$3396_38 > 0.0;
    $D$3397_39$expand_i1_val = $D$3397_39&1;
    $$expand_i1_val10 = 0;
    $17 = ($D$3397_39$expand_i1_val<<24>>24)!=($$expand_i1_val10<<24>>24);
    if ($17) {
     HEAP32[tempDoublePtr>>2]=HEAP32[((19288 + 8|0))>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[((19288 + 8|0))+4>>2];$D$1753_40 = +HEAPF64[tempDoublePtr>>3];
     $D$1754_41 = $D$1753_40 * $D$1753_40;
     $D$3400_42 = $D$1754_41 + 1.0;
     $D$3401_43 = (+Math_sqrt((+$D$3400_42)));
     HEAPF64[$d_32>>3] = $D$3401_43;
     $D$3402_44 = HEAP32[((1021288 + 4|0))>>2]|0;
     $18 = ($D$3402_44|0)!=(0);
     if ($18) {
      HEAP32[tempDoublePtr>>2]=HEAP32[((11288 + 8|0))>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[((11288 + 8|0))+4>>2];$D$3405_45 = +HEAPF64[tempDoublePtr>>3];
      $D$3406_46 = +HEAPF64[$d_32>>3];
      $D$3407_47 = $D$3405_45 / $D$3406_46;
      HEAPF64[tempDoublePtr>>3]=$D$3407_47;HEAP32[((11288 + 8|0))>>2]=HEAP32[tempDoublePtr>>2];HEAP32[((11288 + 8|0))+4>>2]=HEAP32[tempDoublePtr+4>>2];
     }
     $D$3409_48 = HEAP32[((1021288 + 4|0))>>2]|0;
     $19 = ($D$3409_48|0)!=(1);
     if ($19) {
      HEAP32[tempDoublePtr>>2]=HEAP32[((15288 + 8|0))>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[((15288 + 8|0))+4>>2];$D$3412_49 = +HEAPF64[tempDoublePtr>>3];
      $D$3413_50 = +HEAPF64[$d_32>>3];
      $D$3414_51 = $D$3412_49 / $D$3413_50;
      HEAPF64[tempDoublePtr>>3]=$D$3414_51;HEAP32[((15288 + 8|0))>>2]=HEAP32[tempDoublePtr>>2];HEAP32[((15288 + 8|0))+4>>2]=HEAP32[tempDoublePtr+4>>2];
     }
     HEAP32[tempDoublePtr>>2]=HEAP32[((19288 + 8|0))>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[((19288 + 8|0))+4>>2];$D$3416_52 = +HEAPF64[tempDoublePtr>>3];
     $D$3417_53 = +HEAPF64[$d_32>>3];
     $D$3418_54 = $D$3416_52 / $D$3417_53;
     HEAPF64[$D$1757>>3] = $D$3418_54;
     $D$3419_55 = (+_bvnmvn_(11288,15288,1021288,$D$1757));
     HEAPF64[$e_33>>3] = $D$3419_55;
     HEAPF64[$d_32>>3] = 0.0;
    } else {
     $D$3421_56 = HEAP32[1021288>>2]|0;
     $20 = ($D$3421_56|0)!=(0);
     if ($20) {
      $D$3424_57 = HEAP32[((1021288 + 4|0))>>2]|0;
      $21 = ($D$3424_57|0)!=(0);
      if ($21) {
       HEAP32[tempDoublePtr>>2]=HEAP32[11288>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[11288+4>>2];$D$1769_58 = +HEAPF64[tempDoublePtr>>3];
       HEAP32[tempDoublePtr>>2]=HEAP32[((11288 + 8|0))>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[((11288 + 8|0))+4>>2];$D$1771_60 = +HEAPF64[tempDoublePtr>>3];
       $D$3427_61 = $D$1771_60 > $D$1769_58;
       $D$3428_62 = ($D$1769_58 != $D$1769_58) | ($D$1769_58 != $D$1769_58);
       $D$3427_61$expand_i1_val = $D$3427_61&1;
       $$expand_i1_val11 = 0;
       $toBool14 = ($D$3427_61$expand_i1_val<<24>>24)!=($$expand_i1_val11<<24>>24);
       $D$3428_62$expand_i1_val = $D$3428_62&1;
       $$expand_i1_val12 = 0;
       $toBool15 = ($D$3428_62$expand_i1_val<<24>>24)!=($$expand_i1_val12<<24>>24);
       $D$3429_63 = $toBool14 | $toBool15;
       $D$3429_63$expand_i1_val = $D$3429_63&1;
       $$expand_i1_val13 = 0;
       $22 = ($D$3429_63$expand_i1_val<<24>>24)!=($$expand_i1_val13<<24>>24);
       if ($22) {
        $M$11_19 = $D$1771_60;
       } else {
        $M$11_19 = $D$1769_58;
       }
       HEAPF64[tempDoublePtr>>3]=$M$11_19;HEAP32[11288>>2]=HEAP32[tempDoublePtr>>2];HEAP32[11288+4>>2]=HEAP32[tempDoublePtr+4>>2];
      }
     } else {
      $D$3435_65 = HEAP32[((1021288 + 4|0))>>2]|0;
      $23 = ($D$3435_65|0)!=(0);
      if ($23) {
       HEAP32[tempDoublePtr>>2]=HEAP32[((11288 + 8|0))>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[((11288 + 8|0))+4>>2];$D$3438_66 = +HEAPF64[tempDoublePtr>>3];
       HEAPF64[tempDoublePtr>>3]=$D$3438_66;HEAP32[11288>>2]=HEAP32[tempDoublePtr>>2];HEAP32[11288+4>>2]=HEAP32[tempDoublePtr+4>>2];
      }
     }
     $D$3440_67 = HEAP32[1021288>>2]|0;
     $24 = ($D$3440_67|0)!=(1);
     if ($24) {
      $D$3443_68 = HEAP32[((1021288 + 4|0))>>2]|0;
      $25 = ($D$3443_68|0)!=(1);
      if ($25) {
       HEAP32[tempDoublePtr>>2]=HEAP32[15288>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[15288+4>>2];$D$1775_69 = +HEAPF64[tempDoublePtr>>3];
       HEAP32[tempDoublePtr>>2]=HEAP32[((15288 + 8|0))>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[((15288 + 8|0))+4>>2];$D$1777_71 = +HEAPF64[tempDoublePtr>>3];
       $D$3446_72 = $D$1777_71 < $D$1775_69;
       $D$3447_73 = ($D$1775_69 != $D$1775_69) | ($D$1775_69 != $D$1775_69);
       $D$3446_72$expand_i1_val = $D$3446_72&1;
       $$expand_i1_val14 = 0;
       $toBool16 = ($D$3446_72$expand_i1_val<<24>>24)!=($$expand_i1_val14<<24>>24);
       $D$3447_73$expand_i1_val = $D$3447_73&1;
       $$expand_i1_val15 = 0;
       $toBool17 = ($D$3447_73$expand_i1_val<<24>>24)!=($$expand_i1_val15<<24>>24);
       $D$3448_74 = $toBool16 | $toBool17;
       $D$3448_74$expand_i1_val = $D$3448_74&1;
       $$expand_i1_val16 = 0;
       $26 = ($D$3448_74$expand_i1_val<<24>>24)!=($$expand_i1_val16<<24>>24);
       if ($26) {
        $M$12_20 = $D$1777_71;
       } else {
        $M$12_20 = $D$1775_69;
       }
       HEAPF64[tempDoublePtr>>3]=$M$12_20;HEAP32[15288>>2]=HEAP32[tempDoublePtr>>2];HEAP32[15288+4>>2]=HEAP32[tempDoublePtr+4>>2];
      }
     } else {
      $D$3454_76 = HEAP32[((1021288 + 4|0))>>2]|0;
      $27 = ($D$3454_76|0)!=(1);
      if ($27) {
       HEAP32[tempDoublePtr>>2]=HEAP32[((15288 + 8|0))>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[((15288 + 8|0))+4>>2];$D$3457_77 = +HEAPF64[tempDoublePtr>>3];
       HEAPF64[tempDoublePtr>>3]=$D$3457_77;HEAP32[15288>>2]=HEAP32[tempDoublePtr>>2];HEAP32[15288+4>>2]=HEAP32[tempDoublePtr+4>>2];
      }
     }
     $D$3459_78 = HEAP32[1021288>>2]|0;
     $D$3460_79 = HEAP32[((1021288 + 4|0))>>2]|0;
     $28 = ($D$3459_78|0)!=($D$3460_79|0);
     if ($28) {
      HEAP32[1021288>>2] = 2;
     }
     _mvnlms_(11288,15288,1021288,$d_32,$e_33);
    }
    $D$3464_80 = HEAP32[$infis_28>>2]|0;
    $D$3465_81 = (($D$3464_80) + 1)|0;
    HEAP32[$infis_28>>2] = $D$3465_81;
   }
  }
  $D$3361_82 = $__result_master$0$mvndfn;
  $D$3361_21 = $D$3361_82;
 } else {
  label = 5;
 }
 L42: do {
  if ((label|0) == 5) {
   $__result_master$0$mvndfn = 1.0;
   $D$3292_87 = HEAP32[$n_23>>2]|0;
   $D$1696_88 = (($D$3292_87) + 1)|0;
   $0 = (1)<=($D$1696_88|0);
   L44: do {
    if ($0) {
     $i_1 = 1;$ij_2 = 0;$ik_5 = 1;$infa_7 = 0;$infb_10 = 0;
     while(1) {
      $D$1699_91 = (($i_1) + -1)|0;
      $1 = (1)<=($D$1699_91|0);
      L47: do {
       if ($1) {
        $ij_3 = $ij_2;$j_13 = 1;$sum_14 = 0.0;
        while(1) {
         $ij_93 = (($ij_3) + 1)|0;
         $2 = ($j_13|0)<($ik_5|0);
         if ($2) {
          $D$3301_94 = (($ij_93) + -1)|0;
          $ar = (19288 + ($D$3301_94<<3)|0);
          HEAP32[tempDoublePtr>>2]=HEAP32[$ar>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar+4>>2];$D$3302_95 = +HEAPF64[tempDoublePtr>>3];
          $D$3303_96 = (($j_13) + -1)|0;
          $ar1 = (($y) + ($D$3303_96<<3)|0);
          HEAP32[tempDoublePtr>>2]=HEAP32[$ar1>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar1+4>>2];$D$3304_97 = +HEAPF64[tempDoublePtr>>3];
          $D$3305_98 = $D$3302_95 * $D$3304_97;
          $sum_99 = $D$3305_98 + $sum_14;
          $sum_15 = $sum_99;
         } else {
          $sum_15 = $sum_14;
         }
         $D$1703_100 = ($j_13|0)==($D$1699_91|0);
         $j_101 = (($j_13) + 1)|0;
         $D$1703_100$expand_i1_val = $D$1703_100&1;
         $$expand_i1_val = 0;
         $3 = ($D$1703_100$expand_i1_val<<24>>24)!=($$expand_i1_val<<24>>24);
         if ($3) {
          $ij_4 = $ij_93;$sum_16 = $sum_15;
          break L47;
         }
         $ij_3 = $ij_93;$j_13 = $j_101;$sum_14 = $sum_15;
        }
       } else {
        $ij_4 = $ij_2;$sum_16 = 0.0;
       }
      } while(0);
      $D$3308_102 = (($i_1) + -1)|0;
      $ar2 = (1021288 + ($D$3308_102<<2)|0);
      $D$3309_103 = HEAP32[$ar2>>2]|0;
      $4 = ($D$3309_103|0)!=(0);
      do {
       if ($4) {
        $5 = ($infa_7|0)==(1);
        if (!($5)) {
         $D$3323_112 = (($i_1) + -1)|0;
         $ar5 = (11288 + ($D$3323_112<<3)|0);
         HEAP32[tempDoublePtr>>2]=HEAP32[$ar5>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar5+4>>2];$D$3324_113 = +HEAPF64[tempDoublePtr>>3];
         $ai$183_114 = $D$3324_113 - $sum_16;
         HEAPF64[$ai>>3] = $ai$183_114;
         $infa_8 = 1;
         break;
        }
        $M$8_104 = +HEAPF64[$ai>>3];
        $D$3314_105 = (($i_1) + -1)|0;
        $ar3 = (11288 + ($D$3314_105<<3)|0);
        HEAP32[tempDoublePtr>>2]=HEAP32[$ar3>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar3+4>>2];$D$3315_106 = +HEAPF64[tempDoublePtr>>3];
        $D$1707_107 = $D$3315_106 - $sum_16;
        $D$3316_108 = $D$1707_107 > $M$8_104;
        $D$3317_109 = ($M$8_104 != $M$8_104) | ($M$8_104 != $M$8_104);
        $D$3316_108$expand_i1_val = $D$3316_108&1;
        $$expand_i1_val1 = 0;
        $toBool = ($D$3316_108$expand_i1_val<<24>>24)!=($$expand_i1_val1<<24>>24);
        $D$3317_109$expand_i1_val = $D$3317_109&1;
        $$expand_i1_val2 = 0;
        $toBool4 = ($D$3317_109$expand_i1_val<<24>>24)!=($$expand_i1_val2<<24>>24);
        $D$3318_110 = $toBool | $toBool4;
        $D$3318_110$expand_i1_val = $D$3318_110&1;
        $$expand_i1_val3 = 0;
        $6 = ($D$3318_110$expand_i1_val<<24>>24)!=($$expand_i1_val3<<24>>24);
        if ($6) {
         $M$8_17 = $D$1707_107;
        } else {
         $M$8_17 = $M$8_104;
        }
        HEAPF64[$ai>>3] = $M$8_17;
        $infa_8 = $infa_7;
       } else {
        $infa_8 = $infa_7;
       }
      } while(0);
      $D$3327_116 = (($i_1) + -1)|0;
      $ar6 = (1021288 + ($D$3327_116<<2)|0);
      $D$3328_117 = HEAP32[$ar6>>2]|0;
      $7 = ($D$3328_117|0)!=(1);
      do {
       if ($7) {
        $8 = ($infb_10|0)==(1);
        if (!($8)) {
         $D$3342_126 = (($i_1) + -1)|0;
         $ar10 = (15288 + ($D$3342_126<<3)|0);
         HEAP32[tempDoublePtr>>2]=HEAP32[$ar10>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar10+4>>2];$D$3343_127 = +HEAPF64[tempDoublePtr>>3];
         $bi$184_128 = $D$3343_127 - $sum_16;
         HEAPF64[$bi>>3] = $bi$184_128;
         $infb_11 = 1;
         break;
        }
        $M$9_118 = +HEAPF64[$bi>>3];
        $D$3333_119 = (($i_1) + -1)|0;
        $ar7 = (15288 + ($D$3333_119<<3)|0);
        HEAP32[tempDoublePtr>>2]=HEAP32[$ar7>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar7+4>>2];$D$3334_120 = +HEAPF64[tempDoublePtr>>3];
        $D$1711_121 = $D$3334_120 - $sum_16;
        $D$3335_122 = $D$1711_121 < $M$9_118;
        $D$3336_123 = ($M$9_118 != $M$9_118) | ($M$9_118 != $M$9_118);
        $D$3335_122$expand_i1_val = $D$3335_122&1;
        $$expand_i1_val4 = 0;
        $toBool8 = ($D$3335_122$expand_i1_val<<24>>24)!=($$expand_i1_val4<<24>>24);
        $D$3336_123$expand_i1_val = $D$3336_123&1;
        $$expand_i1_val5 = 0;
        $toBool9 = ($D$3336_123$expand_i1_val<<24>>24)!=($$expand_i1_val5<<24>>24);
        $D$3337_124 = $toBool8 | $toBool9;
        $D$3337_124$expand_i1_val = $D$3337_124&1;
        $$expand_i1_val6 = 0;
        $9 = ($D$3337_124$expand_i1_val<<24>>24)!=($$expand_i1_val6<<24>>24);
        if ($9) {
         $M$9_18 = $D$1711_121;
        } else {
         $M$9_18 = $M$9_118;
        }
        HEAPF64[$bi>>3] = $M$9_18;
        $infb_11 = $infb_10;
       } else {
        $infb_11 = $infb_10;
       }
      } while(0);
      $ij_130 = (($ij_4) + 1)|0;
      $D$3347_131 = HEAP32[$n_23>>2]|0;
      $D$3348_132 = (($D$3347_131) + 1)|0;
      $10 = ($D$3348_132|0)==($i_1|0);
      if ($10) {
       label = 25;
      } else {
       $D$3350_133 = (($ij_130) + ($ik_5))|0;
       $ar11 = (19288 + ($D$3350_133<<3)|0);
       HEAP32[tempDoublePtr>>2]=HEAP32[$ar11>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar11+4>>2];$D$3351_134 = +HEAPF64[tempDoublePtr>>3];
       $D$3352_135 = $D$3351_134 > 0.0;
       $D$3352_135$expand_i1_val = $D$3352_135&1;
       $$expand_i1_val7 = 0;
       $11 = ($D$3352_135$expand_i1_val<<24>>24)!=($$expand_i1_val7<<24>>24);
       if ($11) {
        label = 25;
       } else {
        $ik_6 = $ik_5;$infa_9 = $infa_8;$infb_12 = $infb_11;
       }
      }
      if ((label|0) == 25) {
       label = 0;
       $D$3353_136 = $infa_8<<1;
       $D$3354_137 = (($D$3353_136) + ($infb_11))|0;
       $D$3355_138 = (($D$3354_137) + -1)|0;
       HEAP32[$D$1713>>2] = $D$3355_138;
       _mvnlms_($ai,$bi,$D$1713,$di,$ei);
       $di$185_139 = +HEAPF64[$di>>3];
       $ei$186_140 = +HEAPF64[$ei>>3];
       $D$3358_141 = $di$185_139 >= $ei$186_140;
       $D$3358_141$expand_i1_val = $D$3358_141&1;
       $$expand_i1_val8 = 0;
       $12 = ($D$3358_141$expand_i1_val<<24>>24)!=($$expand_i1_val8<<24>>24);
       if ($12) {
        break;
       }
       $ei$187_143 = +HEAPF64[$ei>>3];
       $di$188_144 = +HEAPF64[$di>>3];
       $D$3364_145 = $ei$187_143 - $di$188_144;
       $__result_master$0$189_147 = $__result_master$0$mvndfn;
       $__result_master$0$190_148 = $D$3364_145 * $__result_master$0$189_147;
       $__result_master$0$mvndfn = $__result_master$0$190_148;
       $D$3368_149 = HEAP32[$n_23>>2]|0;
       $13 = ($D$3368_149|0)>=($i_1|0);
       if ($13) {
        $D$3371_150 = (($ik_5) + -1)|0;
        $ar12 = (($w_151) + ($D$3371_150<<3)|0);
        HEAP32[tempDoublePtr>>2]=HEAP32[$ar12>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar12+4>>2];$D$3372_152 = +HEAPF64[tempDoublePtr>>3];
        $ei$191_153 = +HEAPF64[$ei>>3];
        $di$192_154 = +HEAPF64[$di>>3];
        $D$3375_155 = $ei$191_153 - $di$192_154;
        $D$3377_157 = $D$3372_152 * $D$3375_155;
        $di$193_158 = +HEAPF64[$di>>3];
        $D$3379_159 = $D$3377_157 + $di$193_158;
        HEAPF64[$D$1723>>3] = $D$3379_159;
        $D$3380_160 = (($ik_5) + -1)|0;
        $D$3381_161 = (+_phinvs_($D$1723));
        $ar13 = (($y) + ($D$3380_160<<3)|0);
        HEAPF64[tempDoublePtr>>3]=$D$3381_161;HEAP32[$ar13>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar13+4>>2]=HEAP32[tempDoublePtr+4>>2];
       }
       $ik_162 = (($ik_5) + 1)|0;
       $ik_6 = $ik_162;$infa_9 = 0;$infb_12 = 0;
      }
      $D$1727_165 = ($i_1|0)==($D$1696_88|0);
      $i_166 = (($i_1) + 1)|0;
      $D$1727_165$expand_i1_val = $D$1727_165&1;
      $$expand_i1_val9 = 0;
      $14 = ($D$1727_165$expand_i1_val<<24>>24)!=($$expand_i1_val9<<24>>24);
      if ($14) {
       break L44;
      }
      $i_1 = $i_166;$ij_2 = $ij_130;$ik_5 = $ik_6;$infa_7 = $infa_9;$infb_10 = $infb_12;
     }
     $__result_master$0$mvndfn = 0.0;
     $D$3361_142 = $__result_master$0$mvndfn;
     $D$3361_21 = $D$3361_142;
     break L42;
    }
   } while(0);
   $D$3361_167 = $__result_master$0$mvndfn;
   $D$3361_21 = $D$3361_167;
  }
 } while(0);
 $$retval$3C3E = $D$3361_21;
 $29 = $$retval$3C3E;
 STACKTOP = sp;return (+$29);
}
function _mvndnt_($n,$correl,$lower,$upper,$infin,$infis,$d,$e) {
 $n = $n|0;
 $correl = $correl|0;
 $lower = $lower|0;
 $upper = $upper|0;
 $infin = $infin|0;
 $infis = $infis|0;
 $d = $d|0;
 $e = $e|0;
 var $$retval$3C3E = 0.0, $0 = 0.0, $D$3289_9 = 0.0, $correl_7 = 0, $correl_addr = 0, $d_2 = 0, $d_addr = 0, $e_1 = 0, $e_addr = 0, $infin_4 = 0, $infin_addr = 0, $infis_3 = 0, $infis_addr = 0, $lower_6 = 0, $lower_addr = 0, $n_8 = 0, $n_addr = 0, $upper_5 = 0, $upper_addr = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $n_addr = $n;
 $correl_addr = $correl;
 $lower_addr = $lower;
 $upper_addr = $upper;
 $infin_addr = $infin;
 $infis_addr = $infis;
 $d_addr = $d;
 $e_addr = $e;
 $e_1 = $e_addr;
 $d_2 = $d_addr;
 $infis_3 = $infis_addr;
 $infin_4 = $infin_addr;
 $upper_5 = $upper_addr;
 $lower_6 = $lower_addr;
 $correl_7 = $correl_addr;
 $n_8 = $n_addr;
 $D$3289_9 = (+_master_0_mvndfn_(1,$e_1,$d_2,$infis_3,$infin_4,$upper_5,$lower_6,$correl_7,0,$n_8));
 $$retval$3C3E = $D$3289_9;
 $0 = $$retval$3C3E;
 STACKTOP = sp;return (+$0);
}
function _mvnlms_($a,$b,$infin,$lower,$upper) {
 $a = $a|0;
 $b = $b|0;
 $infin = $infin|0;
 $lower = $lower|0;
 $upper = $upper|0;
 var $$expand_i1_val = 0, $$expand_i1_val1 = 0, $$expand_i1_val2 = 0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, $D$1787_12 = 0.0, $D$1789_14 = 0.0, $D$3269_5 = 0, $D$3272_6 = 0, $D$3275_8 = 0.0, $D$3277_9 = 0, $D$3280_11 = 0.0, $D$3283_15 = 0, $D$3283_15$expand_i1_val = 0, $D$3284_16 = 0, $D$3284_16$expand_i1_val = 0, $D$3285_17 = 0, $D$3285_17$expand_i1_val = 0;
 var $M$13_1 = 0.0, $a_7 = 0, $a_addr = 0, $b_10 = 0, $b_addr = 0, $infin_4 = 0, $infin_addr = 0, $lower_2 = 0, $lower_addr = 0, $toBool = 0, $toBool1 = 0, $upper_3 = 0, $upper_addr = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $a_addr = $a;
 $b_addr = $b;
 $infin_addr = $infin;
 $lower_addr = $lower;
 $upper_addr = $upper;
 $lower_2 = $lower_addr;
 $upper_3 = $upper_addr;
 $infin_4 = $infin_addr;
 $a_7 = $a_addr;
 $b_10 = $b_addr;
 HEAPF64[$lower_2>>3] = 0.0;
 HEAPF64[$upper_3>>3] = 1.0;
 $D$3269_5 = HEAP32[$infin_4>>2]|0;
 $0 = ($D$3269_5|0)>=(0);
 if ($0) {
  $D$3272_6 = HEAP32[$infin_4>>2]|0;
  $1 = ($D$3272_6|0)!=(0);
  if ($1) {
   $D$3275_8 = (+_mvnphi_($a_7));
   HEAPF64[$lower_2>>3] = $D$3275_8;
  }
  $D$3277_9 = HEAP32[$infin_4>>2]|0;
  $2 = ($D$3277_9|0)!=(1);
  if ($2) {
   $D$3280_11 = (+_mvnphi_($b_10));
   HEAPF64[$upper_3>>3] = $D$3280_11;
  }
 }
 $D$1787_12 = +HEAPF64[$upper_3>>3];
 $D$1789_14 = +HEAPF64[$lower_2>>3];
 $D$3283_15 = $D$1789_14 > $D$1787_12;
 $D$3284_16 = ($D$1787_12 != $D$1787_12) | ($D$1787_12 != $D$1787_12);
 $D$3283_15$expand_i1_val = $D$3283_15&1;
 $$expand_i1_val = 0;
 $toBool = ($D$3283_15$expand_i1_val<<24>>24)!=($$expand_i1_val<<24>>24);
 $D$3284_16$expand_i1_val = $D$3284_16&1;
 $$expand_i1_val1 = 0;
 $toBool1 = ($D$3284_16$expand_i1_val<<24>>24)!=($$expand_i1_val1<<24>>24);
 $D$3285_17 = $toBool | $toBool1;
 $D$3285_17$expand_i1_val = $D$3285_17&1;
 $$expand_i1_val2 = 0;
 $3 = ($D$3285_17$expand_i1_val<<24>>24)!=($$expand_i1_val2<<24>>24);
 if ($3) {
  $M$13_1 = $D$1789_14;
 } else {
  $M$13_1 = $D$1787_12;
 }
 HEAPF64[$upper_3>>3] = $M$13_1;
 STACKTOP = sp;return;
}
function _phinvs_($p) {
 $p = $p|0;
 var $$expand_i1_val = 0, $$expand_i1_val1 = 0, $$expand_i1_val2 = 0, $$expand_i1_val3 = 0, $$expand_i1_val4 = 0, $$expand_i1_val5 = 0, $$expand_i1_val6 = 0, $$retval$3C3E = 0.0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0.0, $D$2045_56 = 0.0, $D$2047_59 = 0.0, $D$2152_3 = 0.0, $D$2153_4 = 0.0, $D$2154_5 = 0.0, $D$2156_8 = 0.0;
 var $D$2157_9 = 0, $D$2157_9$expand_i1_val = 0, $D$2160_10 = 0.0, $D$2161_12 = 0.0, $D$2162_13 = 0.0, $D$2164_15 = 0.0, $D$2165_16 = 0.0, $D$2167_18 = 0.0, $D$2168_19 = 0.0, $D$2170_21 = 0.0, $D$2171_22 = 0.0, $D$2173_24 = 0.0, $D$2174_25 = 0.0, $D$2176_27 = 0.0, $D$2177_28 = 0.0, $D$2179_30 = 0.0, $D$2180_31 = 0.0, $D$2182_33 = 0.0, $D$2183_34 = 0.0, $D$2184_35 = 0.0;
 var $D$2186_37 = 0.0, $D$2187_38 = 0.0, $D$2189_40 = 0.0, $D$2190_41 = 0.0, $D$2192_43 = 0.0, $D$2193_44 = 0.0, $D$2195_46 = 0.0, $D$2196_47 = 0.0, $D$2198_49 = 0.0, $D$2199_50 = 0.0, $D$2201_52 = 0.0, $D$2202_53 = 0.0, $D$2206_58 = 0.0, $D$2207_60 = 0, $D$2207_60$expand_i1_val = 0, $D$2208_61 = 0, $D$2208_61$expand_i1_val = 0, $D$2209_62 = 0, $D$2209_62$expand_i1_val = 0, $D$2213_65 = 0;
 var $D$2213_65$expand_i1_val = 0, $D$2216_66 = 0.0, $D$2217_67 = 0.0, $D$2218_69 = 0, $D$2218_69$expand_i1_val = 0, $D$2221_71 = 0.0, $D$2222_72 = 0.0, $D$2224_74 = 0.0, $D$2225_75 = 0.0, $D$2227_77 = 0.0, $D$2228_78 = 0.0, $D$2230_80 = 0.0, $D$2231_81 = 0.0, $D$2233_83 = 0.0, $D$2234_84 = 0.0, $D$2236_86 = 0.0, $D$2237_87 = 0.0, $D$2239_89 = 0.0, $D$2240_90 = 0.0, $D$2242_92 = 0.0;
 var $D$2243_93 = 0.0, $D$2245_95 = 0.0, $D$2246_96 = 0.0, $D$2248_98 = 0.0, $D$2249_99 = 0.0, $D$2251_101 = 0.0, $D$2252_102 = 0.0, $D$2254_104 = 0.0, $D$2255_105 = 0.0, $D$2257_107 = 0.0, $D$2258_108 = 0.0, $D$2260_110 = 0.0, $D$2261_111 = 0.0, $D$2265_115 = 0.0, $D$2266_116 = 0.0, $D$2268_118 = 0.0, $D$2269_119 = 0.0, $D$2271_121 = 0.0, $D$2272_122 = 0.0, $D$2274_124 = 0.0;
 var $D$2275_125 = 0.0, $D$2277_127 = 0.0, $D$2278_128 = 0.0, $D$2280_130 = 0.0, $D$2281_131 = 0.0, $D$2283_133 = 0.0, $D$2284_134 = 0.0, $D$2286_136 = 0.0, $D$2287_137 = 0.0, $D$2289_139 = 0.0, $D$2290_140 = 0.0, $D$2292_142 = 0.0, $D$2293_143 = 0.0, $D$2295_145 = 0.0, $D$2296_146 = 0.0, $D$2298_148 = 0.0, $D$2299_149 = 0.0, $D$2301_151 = 0.0, $D$2302_152 = 0.0, $D$2304_154 = 0.0;
 var $D$2305_155 = 0.0, $D$2309_158 = 0, $D$2309_158$expand_i1_val = 0, $D$2315_161 = 0.0, $M$15_1 = 0.0, $__result_phinvs = 0.0, $__result_phinvs$21_55 = 0.0, $__result_phinvs$22_113 = 0.0, $__result_phinvs$23_157 = 0.0, $__result_phinvs$24_159 = 0.0, $__result_phinvs$25_160 = 0.0, $p_2 = 0, $p_addr = 0, $q_7 = 0.0, $r_11 = 0.0, $r_114 = 0.0, $r_68 = 0.0, $r_70 = 0.0, $toBool = 0, $toBool1 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $p_addr = $p;
 $p_2 = $p_addr;
 $D$2152_3 = +HEAPF64[$p_2>>3];
 $D$2153_4 = $D$2152_3 * 2.0;
 $D$2154_5 = $D$2153_4 - 1.0;
 $q_7 = $D$2154_5 / 2.0;
 $D$2156_8 = (+Math_abs((+$q_7)));
 $D$2157_9 = $D$2156_8 <= 0.42500001192092896;
 $D$2157_9$expand_i1_val = $D$2157_9&1;
 $$expand_i1_val = 0;
 $0 = ($D$2157_9$expand_i1_val<<24>>24)!=($$expand_i1_val<<24>>24);
 if ($0) {
  $D$2160_10 = $q_7 * $q_7;
  $r_11 = 0.18062500000000001 - $D$2160_10;
  $D$2161_12 = $r_11 * 2509.0809287301227;
  $D$2162_13 = $D$2161_12 + 33430.575583588128;
  $D$2164_15 = $D$2162_13 * $r_11;
  $D$2165_16 = $D$2164_15 + 67265.770927008707;
  $D$2167_18 = $D$2165_16 * $r_11;
  $D$2168_19 = $D$2167_18 + 45921.95393154987;
  $D$2170_21 = $D$2168_19 * $r_11;
  $D$2171_22 = $D$2170_21 + 13731.693765509461;
  $D$2173_24 = $D$2171_22 * $r_11;
  $D$2174_25 = $D$2173_24 + 1971.5909503065513;
  $D$2176_27 = $D$2174_25 * $r_11;
  $D$2177_28 = $D$2176_27 + 133.14166789178438;
  $D$2179_30 = $D$2177_28 * $r_11;
  $D$2180_31 = $D$2179_30 + 3.3871328727963665;
  $D$2182_33 = $D$2180_31 * $q_7;
  $D$2183_34 = $r_11 * 5226.4952788528544;
  $D$2184_35 = $D$2183_34 + 28729.085735721943;
  $D$2186_37 = $D$2184_35 * $r_11;
  $D$2187_38 = $D$2186_37 + 39307.895800092709;
  $D$2189_40 = $D$2187_38 * $r_11;
  $D$2190_41 = $D$2189_40 + 21213.794301586597;
  $D$2192_43 = $D$2190_41 * $r_11;
  $D$2193_44 = $D$2192_43 + 5394.1960214247511;
  $D$2195_46 = $D$2193_44 * $r_11;
  $D$2196_47 = $D$2195_46 + 687.18700749205789;
  $D$2198_49 = $D$2196_47 * $r_11;
  $D$2199_50 = $D$2198_49 + 42.313330701600911;
  $D$2201_52 = $D$2199_50 * $r_11;
  $D$2202_53 = $D$2201_52 + 1.0;
  $__result_phinvs$21_55 = $D$2182_33 / $D$2202_53;
  $__result_phinvs = $__result_phinvs$21_55;
 } else {
  $D$2045_56 = +HEAPF64[$p_2>>3];
  $D$2206_58 = +HEAPF64[$p_2>>3];
  $D$2047_59 = 1.0 - $D$2206_58;
  $D$2207_60 = $D$2047_59 < $D$2045_56;
  $D$2208_61 = ($D$2045_56 != $D$2045_56) | ($D$2045_56 != $D$2045_56);
  $D$2207_60$expand_i1_val = $D$2207_60&1;
  $$expand_i1_val1 = 0;
  $toBool = ($D$2207_60$expand_i1_val<<24>>24)!=($$expand_i1_val1<<24>>24);
  $D$2208_61$expand_i1_val = $D$2208_61&1;
  $$expand_i1_val2 = 0;
  $toBool1 = ($D$2208_61$expand_i1_val<<24>>24)!=($$expand_i1_val2<<24>>24);
  $D$2209_62 = $toBool | $toBool1;
  $D$2209_62$expand_i1_val = $D$2209_62&1;
  $$expand_i1_val3 = 0;
  $1 = ($D$2209_62$expand_i1_val<<24>>24)!=($$expand_i1_val3<<24>>24);
  if ($1) {
   $M$15_1 = $D$2047_59;
  } else {
   $M$15_1 = $D$2045_56;
  }
  $D$2213_65 = $M$15_1 > 0.0;
  $D$2213_65$expand_i1_val = $D$2213_65&1;
  $$expand_i1_val4 = 0;
  $2 = ($D$2213_65$expand_i1_val<<24>>24)!=($$expand_i1_val4<<24>>24);
  do {
   if ($2) {
    $D$2216_66 = (+Math_log((+$M$15_1)));
    $D$2217_67 = -$D$2216_66;
    $r_68 = (+Math_sqrt((+$D$2217_67)));
    $D$2218_69 = $r_68 <= 5.0;
    $D$2218_69$expand_i1_val = $D$2218_69&1;
    $$expand_i1_val5 = 0;
    $3 = ($D$2218_69$expand_i1_val<<24>>24)!=($$expand_i1_val5<<24>>24);
    if ($3) {
     $r_70 = $r_68 - 1.6000000000000001;
     $D$2221_71 = $r_70 * 7.7454501427834139E-4;
     $D$2222_72 = $D$2221_71 + 0.022723844989269184;
     $D$2224_74 = $D$2222_72 * $r_70;
     $D$2225_75 = $D$2224_74 + 0.24178072517745061;
     $D$2227_77 = $D$2225_75 * $r_70;
     $D$2228_78 = $D$2227_77 + 1.2704582524523684;
     $D$2230_80 = $D$2228_78 * $r_70;
     $D$2231_81 = $D$2230_80 + 3.6478483247632045;
     $D$2233_83 = $D$2231_81 * $r_70;
     $D$2234_84 = $D$2233_83 + 5.769497221460691;
     $D$2236_86 = $D$2234_84 * $r_70;
     $D$2237_87 = $D$2236_86 + 4.6303378461565456;
     $D$2239_89 = $D$2237_87 * $r_70;
     $D$2240_90 = $D$2239_89 + 1.4234371107496835;
     $D$2242_92 = $r_70 * 1.0507500716444169E-9;
     $D$2243_93 = $D$2242_92 + 5.4759380849953455E-4;
     $D$2245_95 = $D$2243_93 * $r_70;
     $D$2246_96 = $D$2245_95 + 0.015198666563616457;
     $D$2248_98 = $D$2246_96 * $r_70;
     $D$2249_99 = $D$2248_98 + 0.14810397642748008;
     $D$2251_101 = $D$2249_99 * $r_70;
     $D$2252_102 = $D$2251_101 + 0.68976733498510001;
     $D$2254_104 = $D$2252_102 * $r_70;
     $D$2255_105 = $D$2254_104 + 1.6763848301838038;
     $D$2257_107 = $D$2255_105 * $r_70;
     $D$2258_108 = $D$2257_107 + 2.053191626637759;
     $D$2260_110 = $D$2258_108 * $r_70;
     $D$2261_111 = $D$2260_110 + 1.0;
     $__result_phinvs$22_113 = $D$2240_90 / $D$2261_111;
     $__result_phinvs = $__result_phinvs$22_113;
     break;
    } else {
     $r_114 = $r_68 - 5.0;
     $D$2265_115 = $r_114 * 2.0103343992922881E-7;
     $D$2266_116 = $D$2265_115 + 2.7115555687434876E-5;
     $D$2268_118 = $D$2266_116 * $r_114;
     $D$2269_119 = $D$2268_118 + 0.0012426609473880784;
     $D$2271_121 = $D$2269_119 * $r_114;
     $D$2272_122 = $D$2271_121 + 0.026532189526576124;
     $D$2274_124 = $D$2272_122 * $r_114;
     $D$2275_125 = $D$2274_124 + 0.29656057182850487;
     $D$2277_127 = $D$2275_125 * $r_114;
     $D$2278_128 = $D$2277_127 + 1.7848265399172913;
     $D$2280_130 = $D$2278_128 * $r_114;
     $D$2281_131 = $D$2280_130 + 5.4637849111641144;
     $D$2283_133 = $D$2281_131 * $r_114;
     $D$2284_134 = $D$2283_133 + 6.6579046435011033;
     $D$2286_136 = $r_114 * 2.0442631033899397E-15;
     $D$2287_137 = $D$2286_136 + 1.4215117583164459E-7;
     $D$2289_139 = $D$2287_137 * $r_114;
     $D$2290_140 = $D$2289_139 + 1.8463183175100548E-5;
     $D$2292_142 = $D$2290_140 * $r_114;
     $D$2293_143 = $D$2292_142 + 7.8686913114561329E-4;
     $D$2295_145 = $D$2293_143 * $r_114;
     $D$2296_146 = $D$2295_145 + 0.014875361290850615;
     $D$2298_148 = $D$2296_146 * $r_114;
     $D$2299_149 = $D$2298_148 + 0.13692988092273581;
     $D$2301_151 = $D$2299_149 * $r_114;
     $D$2302_152 = $D$2301_151 + 0.59983220655588798;
     $D$2304_154 = $D$2302_152 * $r_114;
     $D$2305_155 = $D$2304_154 + 1.0;
     $__result_phinvs$23_157 = $D$2284_134 / $D$2305_155;
     $__result_phinvs = $__result_phinvs$23_157;
     break;
    }
   } else {
    $__result_phinvs = 9.0;
   }
  } while(0);
  $D$2309_158 = $q_7 < 0.0;
  $D$2309_158$expand_i1_val = $D$2309_158&1;
  $$expand_i1_val6 = 0;
  $4 = ($D$2309_158$expand_i1_val<<24>>24)!=($$expand_i1_val6<<24>>24);
  if ($4) {
   $__result_phinvs$24_159 = $__result_phinvs;
   $__result_phinvs$25_160 = -$__result_phinvs$24_159;
   $__result_phinvs = $__result_phinvs$25_160;
  }
 }
 $D$2315_161 = $__result_phinvs;
 $$retval$3C3E = $D$2315_161;
 $5 = $$retval$3C3E;
 STACKTOP = sp;return (+$5);
}
function _covsrt_($n,$lower,$upper,$correl,$infin,$y,$infis,$a,$b,$cov,$infi) {
 $n = $n|0;
 $lower = $lower|0;
 $upper = $upper|0;
 $correl = $correl|0;
 $infin = $infin|0;
 $y = $y|0;
 $infis = $infis|0;
 $a = $a|0;
 $b = $b|0;
 $cov = $cov|0;
 $infi = $infi|0;
 var $$expand_i1_val = 0, $$expand_i1_val1 = 0, $$expand_i1_val10 = 0, $$expand_i1_val11 = 0, $$expand_i1_val12 = 0, $$expand_i1_val13 = 0, $$expand_i1_val14 = 0, $$expand_i1_val15 = 0, $$expand_i1_val16 = 0, $$expand_i1_val17 = 0, $$expand_i1_val18 = 0, $$expand_i1_val19 = 0, $$expand_i1_val2 = 0, $$expand_i1_val20 = 0, $$expand_i1_val21 = 0, $$expand_i1_val22 = 0, $$expand_i1_val3 = 0, $$expand_i1_val4 = 0, $$expand_i1_val5 = 0, $$expand_i1_val6 = 0;
 var $$expand_i1_val7 = 0, $$expand_i1_val8 = 0, $$expand_i1_val9 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0;
 var $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0;
 var $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $D$1906_48 = 0, $D$1912_87 = 0, $D$1915_97 = 0, $D$1915_97$expand_i1_val = 0, $D$1916_103 = 0;
 var $D$1916_103$expand_i1_val = 0, $D$1919_112 = 0, $D$1923_118 = 0, $D$1941_124 = 0, $D$1941_124$expand_i1_val = 0, $D$1942_128 = 0, $D$1942_128$expand_i1_val = 0, $D$1943_134 = 0, $D$1947_146 = 0, $D$1951_160 = 0, $D$1954_170 = 0, $D$1954_170$expand_i1_val = 0, $D$1956_201 = 0, $D$1956_201$expand_i1_val = 0, $D$1960_216 = 0, $D$1967_252 = 0, $D$1967_252$expand_i1_val = 0, $D$1968_256 = 0, $D$1968_256$expand_i1_val = 0, $D$1972_266 = 0.0;
 var $D$1975_276 = 0.0, $D$1979_307 = 0, $D$1982_315 = 0, $D$1982_315$expand_i1_val = 0, $D$1984_336 = 0, $D$1987_342 = 0, $D$1987_342$expand_i1_val = 0, $D$1998_393 = 0, $D$2001_405 = 0, $D$2001_405$expand_i1_val = 0, $D$2003_410 = 0, $D$2014_433 = 0, $D$2014_433$expand_i1_val = 0, $D$2015_446 = 0, $D$2015_446$expand_i1_val = 0, $D$2017_448 = 0, $D$2017_448$expand_i1_val = 0, $D$2018_454 = 0, $D$2018_454$expand_i1_val = 0, $D$2019_462 = 0;
 var $D$2019_462$expand_i1_val = 0, $D$2399_51 = 0, $D$2401_54 = 0, $D$2403_57 = 0, $D$2405_59 = 0, $D$2406_61 = 0, $D$2408_64 = 0, $D$2409_65 = 0, $D$2412_66 = 0, $D$2413_67 = 0, $D$2416_69 = 0, $D$2417_70 = 0, $D$2421_72 = 0, $D$2423_74 = 0, $D$2424_76 = 0.0, $D$2427_78 = 0, $D$2428_79 = 0, $D$2432_81 = 0, $D$2434_83 = 0, $D$2435_85 = 0.0;
 var $D$2442_91 = 0, $D$2443_92 = 0, $D$2444_94 = 0.0, $D$2449_101 = 0, $D$2454_106 = 0, $D$2455_107 = 0, $D$2458_109 = 0, $D$2459_110 = 0, $D$2460_111 = 0, $D$2466_115 = 0, $D$2467_116 = 0, $D$2476_121 = 0, $D$2477_122 = 0, $D$2489_132 = 0, $D$2490_133 = 0, $D$2496_144 = 0, $D$2497_145 = 0, $D$2503_149 = 0, $D$2504_150 = 0, $D$2505_151 = 0.0;
 var $D$2506_152 = 0, $D$2506_152$expand_i1_val = 0, $D$2510_154 = 0, $D$2511_155 = 0, $D$2512_156 = 0.0, $D$2517_162 = 0, $D$2518_163 = 0, $D$2519_164 = 0.0, $D$2520_165 = 0, $D$2521_167 = 0.0, $D$2522_168 = 0.0, $D$2525_173 = 0, $D$2526_174 = 0.0, $D$2527_175 = 0.0, $D$2531_179 = 0, $D$2532_180 = 0.0, $D$2533_181 = 0.0, $D$2537_185 = 0, $D$2540_188 = 0.0, $D$2542_190 = 0.0;
 var $D$2543_191 = 0, $D$2543_191$expand_i1_val = 0, $D$2560_207 = 0, $D$2561_208 = 0, $D$2562_209 = 0, $D$2562_209$expand_i1_val = 0, $D$2567_214 = 0, $D$2568_215 = 0, $D$2573_219 = 0, $D$2574_220 = 0, $D$2576_222 = 0, $D$2577_223 = 0, $D$2578_224 = 0.0, $D$2579_225 = 0.0, $D$2587_233 = 0, $D$2588_234 = 0, $D$2590_236 = 0, $D$2591_237 = 0, $D$2592_238 = 0.0, $D$2594_240 = 0;
 var $D$2595_241 = 0, $D$2596_242 = 0.0, $D$2598_244 = 0, $D$2599_245 = 0, $D$2600_246 = 0.0, $D$2601_247 = 0.0, $D$2602_248 = 0.0, $D$2609_258 = 0.0, $D$2610_259 = 0, $D$2610_259$expand_i1_val = 0, $D$2614_263 = 0, $D$2615_264 = 0, $D$2618_267 = 0.0, $D$2619_268 = 0.0, $D$2620_269 = 0.0, $D$2621_270 = 0.0, $D$2624_273 = 0, $D$2625_274 = 0, $D$2628_277 = 0.0, $D$2629_278 = 0.0;
 var $D$2630_279 = 0.0, $D$2631_280 = 0.0, $D$2634_283 = 0, $D$2635_284 = 0.0, $D$2637_286 = 0.0, $D$2639_288 = 0.0, $D$2642_290 = 0, $D$2643_291 = 0, $D$2647_293 = 0, $D$2650_295 = 0, $D$2651_296 = 0, $D$2655_298 = 0, $D$2658_300 = 0, $D$2659_301 = 0, $D$2663_303 = 0, $D$2664_304 = 0.0, $D$2666_306 = 0.0, $D$2672_310 = 0, $D$2673_311 = 0, $D$2674_312 = 0.0;
 var $D$2675_313 = 0.0, $D$2681_319 = 0, $D$2683_321 = 0, $D$2684_322 = 0.0, $D$2685_323 = 0.0, $D$2687_325 = 0, $D$2689_327 = 0, $D$2690_328 = 0.0, $D$2691_329 = 0.0, $D$2695_334 = 0, $D$2696_335 = 0, $D$2701_339 = 0, $D$2702_340 = 0, $D$2710_348 = 0, $D$2711_349 = 0, $D$2712_350 = 0.0, $D$2713_351 = 0.0, $D$2714_352 = 0, $D$2714_352$expand_i1_val = 0, $D$2718_354 = 0;
 var $D$2720_356 = 0, $D$2721_357 = 0.0, $D$2723_359 = 0, $D$2724_360 = 0, $D$2725_361 = 0.0, $D$2726_362 = 0.0, $D$2728_364 = 0, $D$2730_366 = 0, $D$2731_367 = 0.0, $D$2733_369 = 0, $D$2734_370 = 0, $D$2735_371 = 0.0, $D$2736_372 = 0.0, $D$2738_374 = 0, $D$2739_375 = 0, $D$2740_376 = 0.0, $D$2741_377 = 0, $D$2741_377$expand_i1_val = 0, $D$2745_379 = 0, $D$2748_382 = 0;
 var $D$2751_385 = 0, $D$2752_386 = 0, $D$2756_388 = 0, $D$2758_390 = 0, $D$2759_391 = 0, $D$2760_392 = 0, $D$2766_395 = 0, $D$2767_396 = 0, $D$2768_397 = 0, $D$2769_398 = 0, $D$2770_399 = 0.0, $D$2772_401 = 0, $D$2773_402 = 0, $D$2774_403 = 0.0, $D$2775_404 = 0.0, $D$2782_412 = 0, $D$2783_413 = 0, $D$2784_414 = 0, $D$2786_416 = 0, $D$2787_417 = 0.0;
 var $D$2788_418 = 0, $D$2788_418$expand_i1_val = 0, $D$2798_426 = 0, $D$2799_427 = 0, $D$2801_429 = 0, $D$2802_430 = 0, $D$2803_431 = 0, $D$2807_436 = 0, $D$2810_439 = 0, $D$2812_441 = 0, $D$2813_443 = 0, $D$2814_444 = 0, $D$2818_451 = 0, $D$2819_452 = 0, $D$2826_460 = 0, $a_52 = 0, $a_addr = 0, $aj = 0, $aj$68_177 = 0.0, $amin_1 = 0.0;
 var $amin_193 = 0.0, $amin_2 = 0.0, $amin_3 = 0.0, $amin_4 = 0.0, $ar = 0, $ar1 = 0, $ar10 = 0, $ar11 = 0, $ar12 = 0, $ar13 = 0, $ar14 = 0, $ar15 = 0, $ar16 = 0, $ar17 = 0, $ar18 = 0, $ar19 = 0, $ar2 = 0, $ar20 = 0, $ar21 = 0, $ar22 = 0;
 var $ar23 = 0, $ar24 = 0, $ar25 = 0, $ar26 = 0, $ar27 = 0, $ar28 = 0, $ar29 = 0, $ar3 = 0, $ar30 = 0, $ar31 = 0, $ar32 = 0, $ar33 = 0, $ar34 = 0, $ar35 = 0, $ar36 = 0, $ar37 = 0, $ar38 = 0, $ar39 = 0, $ar4 = 0, $ar40 = 0;
 var $ar41 = 0, $ar42 = 0, $ar43 = 0, $ar44 = 0, $ar45 = 0, $ar46 = 0, $ar47 = 0, $ar48 = 0, $ar49 = 0, $ar5 = 0, $ar50 = 0, $ar51 = 0, $ar52 = 0, $ar53 = 0, $ar54 = 0, $ar55 = 0, $ar56 = 0, $ar57 = 0, $ar58 = 0, $ar59 = 0;
 var $ar6 = 0, $ar60 = 0, $ar61 = 0, $ar62 = 0, $ar63 = 0, $ar64 = 0, $ar65 = 0, $ar66 = 0, $ar67 = 0, $ar68 = 0, $ar69 = 0, $ar7 = 0, $ar70 = 0, $ar71 = 0, $ar72 = 0, $ar73 = 0, $ar74 = 0, $ar8 = 0, $ar9 = 0, $b_55 = 0;
 var $b_addr = 0, $bj = 0, $bj$70_183 = 0.0, $bmin_194 = 0.0, $bmin_5 = 0.0, $bmin_6 = 0.0, $bmin_7 = 0.0, $bmin_8 = 0.0, $correl_93 = 0, $correl_addr = 0, $cov_95 = 0, $cov_addr = 0, $cvdiag_10 = 0.0, $cvdiag_11 = 0.0, $cvdiag_9 = 0.0, $d = 0, $d$72_187 = 0.0, $dmin_12 = 0.0, $dmin_13 = 0.0, $dmin_14 = 0.0;
 var $dmin_195 = 0.0, $e = 0, $e$73_189 = 0.0, $emin_15 = 0.0, $emin_16 = 0.0, $emin_17 = 0.0, $emin_196 = 0.0, $i = 0, $i$100_272 = 0, $i$101_282 = 0, $i$102_289 = 0, $i$103_292 = 0, $i$104_294 = 0, $i$105_297 = 0, $i$106_299 = 0, $i$107_302 = 0, $i$112_318 = 0, $i$113_320 = 0, $i$114_324 = 0, $i$115_326 = 0;
 var $i$116_330 = 0, $i$117_332 = 0, $i$119_338 = 0, $i$120_344 = 0, $i$124_353 = 0, $i$125_355 = 0, $i$127_363 = 0, $i$128_365 = 0, $i$131_378 = 0, $i$132_381 = 0, $i$133_384 = 0, $i$134_387 = 0, $i$135_389 = 0, $i$138_409 = 0, $i$141_420 = 0, $i$147_457 = 0, $i$148_459 = 0, $i$149_461 = 0, $i$150_463 = 0, $i$151_464 = 0;
 var $i$28_49 = 0, $i$29_50 = 0, $i$30_53 = 0, $i$31_56 = 0, $i$32_58 = 0, $i$33_63 = 0, $i$34_68 = 0, $i$35_71 = 0, $i$36_73 = 0, $i$37_77 = 0, $i$38_80 = 0, $i$39_82 = 0, $i$40_86 = 0, $i$45_102 = 0, $i$46_104 = 0, $i$47_105 = 0, $i$48_108 = 0, $i$49_113 = 0, $i$50_114 = 0, $i$51_117 = 0;
 var $i$57_127 = 0, $i$58_129 = 0, $i$59_130 = 0, $i$60_135 = 0, $i$61_140 = 0, $i$66_159 = 0, $i$80_205 = 0, $i$81_206 = 0, $i$82_210 = 0, $i$83_212 = 0, $i$85_218 = 0, $i$86_221 = 0, $i$87_226 = 0, $i$88_228 = 0, $i$93_239 = 0, $i$94_243 = 0, $i$99_262 = 0, $ii_18 = 0, $ii_19 = 0, $ii_20 = 0;
 var $ii_21 = 0, $ii_22 = 0, $ii_23 = 0, $ii_24 = 0, $ii_309 = 0, $ii_458 = 0, $ii_90 = 0, $ij_100 = 0, $ij_199 = 0, $ij_227 = 0, $ij_25 = 0, $ij_250 = 0, $ij_26 = 0, $ij_27 = 0, $ij_28 = 0, $ij_29 = 0, $ij_30 = 0, $ij_445 = 0, $ij_89 = 0, $il_211 = 0;
 var $il_255 = 0, $il_31 = 0, $il_32 = 0, $il_331 = 0, $il_341 = 0, $infi_62 = 0, $infi_addr = 0, $infin_60 = 0, $infin_addr = 0, $infis_46 = 0, $infis_addr = 0, $j = 0, $j$108_308 = 0, $j$109_314 = 0, $j$110_316 = 0, $j$111_317 = 0, $j$121_345 = 0, $j$122_346 = 0, $j$123_347 = 0, $j$126_358 = 0;
 var $j$129_368 = 0, $j$130_373 = 0, $j$136_400 = 0, $j$137_407 = 0, $j$140_415 = 0, $j$143_450 = 0, $j$144_453 = 0, $j$145_455 = 0, $j$146_456 = 0, $j$41_88 = 0, $j$42_96 = 0, $j$43_98 = 0, $j$44_99 = 0, $j$52_119 = 0, $j$53_120 = 0, $j$54_123 = 0, $j$55_125 = 0, $j$56_126 = 0, $j$62_143 = 0, $j$63_147 = 0;
 var $j$64_148 = 0, $j$65_153 = 0, $j$67_172 = 0, $j$69_178 = 0, $j$71_184 = 0, $j$74_192 = 0, $j$75_198 = 0, $j$76_200 = 0, $j$77_202 = 0, $j$78_203 = 0, $j$89_229 = 0, $j$90_231 = 0, $j$91_232 = 0, $j$92_235 = 0, $j$95_249 = 0, $j$96_251 = 0, $j$97_253 = 0, $j$98_254 = 0, $jmin = 0, $jmin$79_204 = 0;
 var $k$142_421 = 0, $k_171 = 0, $k_33 = 0, $k_34 = 0, $k_447 = 0, $l$118_333 = 0, $l$139_408 = 0, $l$84_213 = 0, $l_257 = 0, $l_343 = 0, $l_35 = 0, $l_36 = 0, $l_37 = 0, $l_38 = 0, $l_406 = 0, $l_449 = 0, $lower_75 = 0, $lower_addr = 0, $m_39 = 0, $m_434 = 0;
 var $m_442 = 0, $n_47 = 0, $n_addr = 0, $sum_169 = 0.0, $sum_40 = 0.0, $sum_41 = 0.0, $sumsq_157 = 0.0, $upper_84 = 0, $upper_addr = 0, $y_166 = 0, $y_addr = 0, $yl_271 = 0.0, $yl_42 = 0.0, $yu_281 = 0.0, $yu_43 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 96|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $aj = sp + 24|0;
 $bj = sp + 16|0;
 $d = sp + 8|0;
 $e = sp;
 $i = sp + 40|0;
 $j = sp + 36|0;
 $jmin = sp + 32|0;
 $n_addr = $n;
 $lower_addr = $lower;
 $upper_addr = $upper;
 $correl_addr = $correl;
 $infin_addr = $infin;
 $y_addr = $y;
 $infis_addr = $infis;
 $a_addr = $a;
 $b_addr = $b;
 $cov_addr = $cov;
 $infi_addr = $infi;
 $infis_46 = $infis_addr;
 $n_47 = $n_addr;
 $a_52 = $a_addr;
 $b_55 = $b_addr;
 $infin_60 = $infin_addr;
 $infi_62 = $infi_addr;
 $lower_75 = $lower_addr;
 $upper_84 = $upper_addr;
 $correl_93 = $correl_addr;
 $cov_95 = $cov_addr;
 $y_166 = $y_addr;
 HEAP32[$infis_46>>2] = 0;
 $D$1906_48 = HEAP32[$n_47>>2]|0;
 HEAP32[$i>>2] = 1;
 $i$28_49 = HEAP32[$i>>2]|0;
 $0 = ($i$28_49|0)<=($D$1906_48|0);
 L2: do {
  if ($0) {
   $ii_18 = 0;$ij_25 = 0;
   while(1) {
    $i$29_50 = HEAP32[$i>>2]|0;
    $D$2399_51 = (($i$29_50) + -1)|0;
    $ar = (($a_52) + ($D$2399_51<<3)|0);
    HEAPF64[tempDoublePtr>>3]=0.0;HEAP32[$ar>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar+4>>2]=HEAP32[tempDoublePtr+4>>2];
    $i$30_53 = HEAP32[$i>>2]|0;
    $D$2401_54 = (($i$30_53) + -1)|0;
    $ar1 = (($b_55) + ($D$2401_54<<3)|0);
    HEAPF64[tempDoublePtr>>3]=0.0;HEAP32[$ar1>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar1+4>>2]=HEAP32[tempDoublePtr+4>>2];
    $i$31_56 = HEAP32[$i>>2]|0;
    $D$2403_57 = (($i$31_56) + -1)|0;
    $i$32_58 = HEAP32[$i>>2]|0;
    $D$2405_59 = (($i$32_58) + -1)|0;
    $ar2 = (($infin_60) + ($D$2405_59<<2)|0);
    $D$2406_61 = HEAP32[$ar2>>2]|0;
    $ar3 = (($infi_62) + ($D$2403_57<<2)|0);
    HEAP32[$ar3>>2] = $D$2406_61;
    $i$33_63 = HEAP32[$i>>2]|0;
    $D$2408_64 = (($i$33_63) + -1)|0;
    $ar4 = (($infi_62) + ($D$2408_64<<2)|0);
    $D$2409_65 = HEAP32[$ar4>>2]|0;
    $1 = ($D$2409_65|0)<(0);
    if ($1) {
     $D$2412_66 = HEAP32[$infis_46>>2]|0;
     $D$2413_67 = (($D$2412_66) + 1)|0;
     HEAP32[$infis_46>>2] = $D$2413_67;
    } else {
     $i$34_68 = HEAP32[$i>>2]|0;
     $D$2416_69 = (($i$34_68) + -1)|0;
     $ar5 = (($infi_62) + ($D$2416_69<<2)|0);
     $D$2417_70 = HEAP32[$ar5>>2]|0;
     $2 = ($D$2417_70|0)!=(0);
     if ($2) {
      $i$35_71 = HEAP32[$i>>2]|0;
      $D$2421_72 = (($i$35_71) + -1)|0;
      $i$36_73 = HEAP32[$i>>2]|0;
      $D$2423_74 = (($i$36_73) + -1)|0;
      $ar6 = (($lower_75) + ($D$2423_74<<3)|0);
      HEAP32[tempDoublePtr>>2]=HEAP32[$ar6>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar6+4>>2];$D$2424_76 = +HEAPF64[tempDoublePtr>>3];
      $ar7 = (($a_52) + ($D$2421_72<<3)|0);
      HEAPF64[tempDoublePtr>>3]=$D$2424_76;HEAP32[$ar7>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar7+4>>2]=HEAP32[tempDoublePtr+4>>2];
     }
     $i$37_77 = HEAP32[$i>>2]|0;
     $D$2427_78 = (($i$37_77) + -1)|0;
     $ar8 = (($infi_62) + ($D$2427_78<<2)|0);
     $D$2428_79 = HEAP32[$ar8>>2]|0;
     $3 = ($D$2428_79|0)!=(1);
     if ($3) {
      $i$38_80 = HEAP32[$i>>2]|0;
      $D$2432_81 = (($i$38_80) + -1)|0;
      $i$39_82 = HEAP32[$i>>2]|0;
      $D$2434_83 = (($i$39_82) + -1)|0;
      $ar9 = (($upper_84) + ($D$2434_83<<3)|0);
      HEAP32[tempDoublePtr>>2]=HEAP32[$ar9>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar9+4>>2];$D$2435_85 = +HEAPF64[tempDoublePtr>>3];
      $ar10 = (($b_55) + ($D$2432_81<<3)|0);
      HEAPF64[tempDoublePtr>>3]=$D$2435_85;HEAP32[$ar10>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar10+4>>2]=HEAP32[tempDoublePtr+4>>2];
     }
    }
    $i$40_86 = HEAP32[$i>>2]|0;
    $D$1912_87 = (($i$40_86) + -1)|0;
    HEAP32[$j>>2] = 1;
    $j$41_88 = HEAP32[$j>>2]|0;
    $4 = ($j$41_88|0)<=($D$1912_87|0);
    L13: do {
     if ($4) {
      $ii_19 = $ii_18;$ij_26 = $ij_25;
      while(1) {
       $ij_89 = (($ij_26) + 1)|0;
       $ii_90 = (($ii_19) + 1)|0;
       $D$2442_91 = (($ij_89) + -1)|0;
       $D$2443_92 = (($ii_90) + -1)|0;
       $ar11 = (($correl_93) + ($D$2443_92<<3)|0);
       HEAP32[tempDoublePtr>>2]=HEAP32[$ar11>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar11+4>>2];$D$2444_94 = +HEAPF64[tempDoublePtr>>3];
       $ar12 = (($cov_95) + ($D$2442_91<<3)|0);
       HEAPF64[tempDoublePtr>>3]=$D$2444_94;HEAP32[$ar12>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar12+4>>2]=HEAP32[tempDoublePtr+4>>2];
       $j$42_96 = HEAP32[$j>>2]|0;
       $D$1915_97 = ($j$42_96|0)==($D$1912_87|0);
       $j$43_98 = HEAP32[$j>>2]|0;
       $j$44_99 = (($j$43_98) + 1)|0;
       HEAP32[$j>>2] = $j$44_99;
       $D$1915_97$expand_i1_val = $D$1915_97&1;
       $$expand_i1_val = 0;
       $5 = ($D$1915_97$expand_i1_val<<24>>24)!=($$expand_i1_val<<24>>24);
       if ($5) {
        $ii_20 = $ii_90;$ij_27 = $ij_89;
        break L13;
       }
       $ii_19 = $ii_90;$ij_26 = $ij_89;
      }
     } else {
      $ii_20 = $ii_18;$ij_27 = $ij_25;
     }
    } while(0);
    $ij_100 = (($ij_27) + 1)|0;
    $D$2449_101 = (($ij_100) + -1)|0;
    $ar13 = (($cov_95) + ($D$2449_101<<3)|0);
    HEAPF64[tempDoublePtr>>3]=1.0;HEAP32[$ar13>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar13+4>>2]=HEAP32[tempDoublePtr+4>>2];
    $i$45_102 = HEAP32[$i>>2]|0;
    $D$1916_103 = ($i$45_102|0)==($D$1906_48|0);
    $i$46_104 = HEAP32[$i>>2]|0;
    $i$47_105 = (($i$46_104) + 1)|0;
    HEAP32[$i>>2] = $i$47_105;
    $D$1916_103$expand_i1_val = $D$1916_103&1;
    $$expand_i1_val1 = 0;
    $6 = ($D$1916_103$expand_i1_val<<24>>24)!=($$expand_i1_val1<<24>>24);
    if ($6) {
     break L2;
    }
    $ii_18 = $ii_20;$ij_25 = $ij_100;
   }
  }
 } while(0);
 $D$2454_106 = HEAP32[$infis_46>>2]|0;
 $D$2455_107 = HEAP32[$n_47>>2]|0;
 $7 = ($D$2454_106|0)<($D$2455_107|0);
 L20: do {
  if ($7) {
   $i$48_108 = HEAP32[$n_47>>2]|0;
   $D$2458_109 = HEAP32[$n_47>>2]|0;
   $D$2459_110 = HEAP32[$infis_46>>2]|0;
   $D$2460_111 = (($D$2458_109) - ($D$2459_110))|0;
   $D$1919_112 = (($D$2460_111) + 1)|0;
   HEAP32[$i>>2] = $i$48_108;
   $i$49_113 = HEAP32[$i>>2]|0;
   $8 = ($i$49_113|0)>=($D$1919_112|0);
   L22: do {
    if ($8) {
     while(1) {
      $i$50_114 = HEAP32[$i>>2]|0;
      $D$2466_115 = (($i$50_114) + -1)|0;
      $ar14 = (($infi_62) + ($D$2466_115<<2)|0);
      $D$2467_116 = HEAP32[$ar14>>2]|0;
      $9 = ($D$2467_116|0)>=(0);
      L25: do {
       if ($9) {
        $i$51_117 = HEAP32[$i>>2]|0;
        $D$1923_118 = (($i$51_117) + -1)|0;
        HEAP32[$j>>2] = 1;
        $j$52_119 = HEAP32[$j>>2]|0;
        $10 = ($j$52_119|0)<=($D$1923_118|0);
        if ($10) {
         while(1) {
          $j$53_120 = HEAP32[$j>>2]|0;
          $D$2476_121 = (($j$53_120) + -1)|0;
          $ar15 = (($infi_62) + ($D$2476_121<<2)|0);
          $D$2477_122 = HEAP32[$ar15>>2]|0;
          $11 = ($D$2477_122|0)<(0);
          if ($11) {
           break;
          }
          $j$54_123 = HEAP32[$j>>2]|0;
          $D$1941_124 = ($j$54_123|0)==($D$1923_118|0);
          $j$55_125 = HEAP32[$j>>2]|0;
          $j$56_126 = (($j$55_125) + 1)|0;
          HEAP32[$j>>2] = $j$56_126;
          $D$1941_124$expand_i1_val = $D$1941_124&1;
          $$expand_i1_val2 = 0;
          $12 = ($D$1941_124$expand_i1_val<<24>>24)!=($$expand_i1_val2<<24>>24);
          if ($12) {
           break L25;
          }
         }
         _rcswp_($j,$i,$a_52,$b_55,$infi_62,$n_47,$cov_95);
        }
       }
      } while(0);
      $i$57_127 = HEAP32[$i>>2]|0;
      $D$1942_128 = ($i$57_127|0)==($D$1919_112|0);
      $i$58_129 = HEAP32[$i>>2]|0;
      $i$59_130 = (($i$58_129) + -1)|0;
      HEAP32[$i>>2] = $i$59_130;
      $D$1942_128$expand_i1_val = $D$1942_128&1;
      $$expand_i1_val3 = 0;
      $13 = ($D$1942_128$expand_i1_val<<24>>24)!=($$expand_i1_val3<<24>>24);
      if ($13) {
       break L22;
      }
     }
    }
   } while(0);
   $D$2489_132 = HEAP32[$n_47>>2]|0;
   $D$2490_133 = HEAP32[$infis_46>>2]|0;
   $D$1943_134 = (($D$2489_132) - ($D$2490_133))|0;
   HEAP32[$i>>2] = 1;
   $i$60_135 = HEAP32[$i>>2]|0;
   $14 = ($i$60_135|0)<=($D$1943_134|0);
   if ($14) {
    $amin_1 = 0.0;$bmin_5 = 0.0;$ii_21 = 0;
    while(1) {
     $i$61_140 = HEAP32[$i>>2]|0;
     HEAP32[$jmin>>2] = $i$61_140;
     $j$62_143 = HEAP32[$i>>2]|0;
     $D$2496_144 = HEAP32[$n_47>>2]|0;
     $D$2497_145 = HEAP32[$infis_46>>2]|0;
     $D$1947_146 = (($D$2496_144) - ($D$2497_145))|0;
     HEAP32[$j>>2] = $j$62_143;
     $j$63_147 = HEAP32[$j>>2]|0;
     $15 = ($j$63_147|0)<=($D$1947_146|0);
     L37: do {
      if ($15) {
       $amin_2 = $amin_1;$bmin_6 = $bmin_5;$cvdiag_9 = 0.0;$dmin_12 = 0.0;$emin_15 = 1.0;$ij_28 = $ii_21;
       while(1) {
        $j$64_148 = HEAP32[$j>>2]|0;
        $D$2503_149 = (($ij_28) + ($j$64_148))|0;
        $D$2504_150 = (($D$2503_149) + -1)|0;
        $ar16 = (($cov_95) + ($D$2504_150<<3)|0);
        HEAP32[tempDoublePtr>>2]=HEAP32[$ar16>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar16+4>>2];$D$2505_151 = +HEAPF64[tempDoublePtr>>3];
        $D$2506_152 = $D$2505_151 > 1.0E-10;
        $D$2506_152$expand_i1_val = $D$2506_152&1;
        $$expand_i1_val4 = 0;
        $16 = ($D$2506_152$expand_i1_val<<24>>24)!=($$expand_i1_val4<<24>>24);
        if ($16) {
         $j$65_153 = HEAP32[$j>>2]|0;
         $D$2510_154 = (($ij_28) + ($j$65_153))|0;
         $D$2511_155 = (($D$2510_154) + -1)|0;
         $ar17 = (($cov_95) + ($D$2511_155<<3)|0);
         HEAP32[tempDoublePtr>>2]=HEAP32[$ar17>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar17+4>>2];$D$2512_156 = +HEAPF64[tempDoublePtr>>3];
         $sumsq_157 = (+Math_sqrt((+$D$2512_156)));
         $i$66_159 = HEAP32[$i>>2]|0;
         $D$1951_160 = (($i$66_159) + -1)|0;
         $17 = (1)<=($D$1951_160|0);
         L42: do {
          if ($17) {
           $k_33 = 1;$sum_40 = 0.0;
           while(1) {
            $D$2517_162 = (($ij_28) + ($k_33))|0;
            $D$2518_163 = (($D$2517_162) + -1)|0;
            $ar18 = (($cov_95) + ($D$2518_163<<3)|0);
            HEAP32[tempDoublePtr>>2]=HEAP32[$ar18>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar18+4>>2];$D$2519_164 = +HEAPF64[tempDoublePtr>>3];
            $D$2520_165 = (($k_33) + -1)|0;
            $ar19 = (($y_166) + ($D$2520_165<<3)|0);
            HEAP32[tempDoublePtr>>2]=HEAP32[$ar19>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar19+4>>2];$D$2521_167 = +HEAPF64[tempDoublePtr>>3];
            $D$2522_168 = $D$2519_164 * $D$2521_167;
            $sum_169 = $D$2522_168 + $sum_40;
            $D$1954_170 = ($k_33|0)==($D$1951_160|0);
            $k_171 = (($k_33) + 1)|0;
            $D$1954_170$expand_i1_val = $D$1954_170&1;
            $$expand_i1_val5 = 0;
            $18 = ($D$1954_170$expand_i1_val<<24>>24)!=($$expand_i1_val5<<24>>24);
            if ($18) {
             $sum_41 = $sum_169;
             break L42;
            }
            $k_33 = $k_171;$sum_40 = $sum_169;
           }
          } else {
           $sum_41 = 0.0;
          }
         } while(0);
         $j$67_172 = HEAP32[$j>>2]|0;
         $D$2525_173 = (($j$67_172) + -1)|0;
         $ar20 = (($a_52) + ($D$2525_173<<3)|0);
         HEAP32[tempDoublePtr>>2]=HEAP32[$ar20>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar20+4>>2];$D$2526_174 = +HEAPF64[tempDoublePtr>>3];
         $D$2527_175 = $D$2526_174 - $sum_41;
         $aj$68_177 = $D$2527_175 / $sumsq_157;
         HEAPF64[$aj>>3] = $aj$68_177;
         $j$69_178 = HEAP32[$j>>2]|0;
         $D$2531_179 = (($j$69_178) + -1)|0;
         $ar21 = (($b_55) + ($D$2531_179<<3)|0);
         HEAP32[tempDoublePtr>>2]=HEAP32[$ar21>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar21+4>>2];$D$2532_180 = +HEAPF64[tempDoublePtr>>3];
         $D$2533_181 = $D$2532_180 - $sum_41;
         $bj$70_183 = $D$2533_181 / $sumsq_157;
         HEAPF64[$bj>>3] = $bj$70_183;
         $j$71_184 = HEAP32[$j>>2]|0;
         $D$2537_185 = (($j$71_184) + -1)|0;
         $ar22 = (($infi_62) + ($D$2537_185<<2)|0);
         _mvnlms_($aj,$bj,$ar22,$d,$e);
         $d$72_187 = +HEAPF64[$d>>3];
         $D$2540_188 = $emin_15 + $d$72_187;
         $e$73_189 = +HEAPF64[$e>>3];
         $D$2542_190 = $e$73_189 + $dmin_12;
         $D$2543_191 = $D$2540_188 >= $D$2542_190;
         $D$2543_191$expand_i1_val = $D$2543_191&1;
         $$expand_i1_val6 = 0;
         $19 = ($D$2543_191$expand_i1_val<<24>>24)!=($$expand_i1_val6<<24>>24);
         if ($19) {
          $j$74_192 = HEAP32[$j>>2]|0;
          HEAP32[$jmin>>2] = $j$74_192;
          $amin_193 = +HEAPF64[$aj>>3];
          $bmin_194 = +HEAPF64[$bj>>3];
          $dmin_195 = +HEAPF64[$d>>3];
          $emin_196 = +HEAPF64[$e>>3];
          $amin_3 = $amin_193;$bmin_7 = $bmin_194;$cvdiag_10 = $sumsq_157;$dmin_13 = $dmin_195;$emin_16 = $emin_196;
         } else {
          $amin_3 = $amin_2;$bmin_7 = $bmin_6;$cvdiag_10 = $cvdiag_9;$dmin_13 = $dmin_12;$emin_16 = $emin_15;
         }
        } else {
         $amin_3 = $amin_2;$bmin_7 = $bmin_6;$cvdiag_10 = $cvdiag_9;$dmin_13 = $dmin_12;$emin_16 = $emin_15;
        }
        $j$75_198 = HEAP32[$j>>2]|0;
        $ij_199 = (($ij_28) + ($j$75_198))|0;
        $j$76_200 = HEAP32[$j>>2]|0;
        $D$1956_201 = ($j$76_200|0)==($D$1947_146|0);
        $j$77_202 = HEAP32[$j>>2]|0;
        $j$78_203 = (($j$77_202) + 1)|0;
        HEAP32[$j>>2] = $j$78_203;
        $D$1956_201$expand_i1_val = $D$1956_201&1;
        $$expand_i1_val7 = 0;
        $20 = ($D$1956_201$expand_i1_val<<24>>24)!=($$expand_i1_val7<<24>>24);
        if ($20) {
         $amin_4 = $amin_3;$bmin_8 = $bmin_7;$cvdiag_11 = $cvdiag_10;$dmin_14 = $dmin_13;$emin_17 = $emin_16;
         break L37;
        }
        $amin_2 = $amin_3;$bmin_6 = $bmin_7;$cvdiag_9 = $cvdiag_10;$dmin_12 = $dmin_13;$emin_15 = $emin_16;$ij_28 = $ij_199;
       }
      } else {
       $amin_4 = $amin_1;$bmin_8 = $bmin_5;$cvdiag_11 = 0.0;$dmin_14 = 0.0;$emin_17 = 1.0;
      }
     } while(0);
     $jmin$79_204 = HEAP32[$jmin>>2]|0;
     $i$80_205 = HEAP32[$i>>2]|0;
     $21 = ($jmin$79_204|0)>($i$80_205|0);
     if ($21) {
      _rcswp_($i,$jmin,$a_52,$b_55,$infi_62,$n_47,$cov_95);
     }
     $i$81_206 = HEAP32[$i>>2]|0;
     $D$2560_207 = (($ii_21) + ($i$81_206))|0;
     $D$2561_208 = (($D$2560_207) + -1)|0;
     $ar23 = (($cov_95) + ($D$2561_208<<3)|0);
     HEAPF64[tempDoublePtr>>3]=$cvdiag_11;HEAP32[$ar23>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar23+4>>2]=HEAP32[tempDoublePtr+4>>2];
     $D$2562_209 = $cvdiag_11 > 0.0;
     $D$2562_209$expand_i1_val = $D$2562_209&1;
     $$expand_i1_val8 = 0;
     $22 = ($D$2562_209$expand_i1_val<<24>>24)!=($$expand_i1_val8<<24>>24);
     if ($22) {
      $i$82_210 = HEAP32[$i>>2]|0;
      $il_211 = (($ii_21) + ($i$82_210))|0;
      $i$83_212 = HEAP32[$i>>2]|0;
      $l$84_213 = (($i$83_212) + 1)|0;
      $D$2567_214 = HEAP32[$n_47>>2]|0;
      $D$2568_215 = HEAP32[$infis_46>>2]|0;
      $D$1960_216 = (($D$2567_214) - ($D$2568_215))|0;
      $23 = ($l$84_213|0)<=($D$1960_216|0);
      L56: do {
       if ($23) {
        $il_31 = $il_211;$l_35 = $l$84_213;
        while(1) {
         $i$85_218 = HEAP32[$i>>2]|0;
         $D$2573_219 = (($il_31) + ($i$85_218))|0;
         $D$2574_220 = (($D$2573_219) + -1)|0;
         $i$86_221 = HEAP32[$i>>2]|0;
         $D$2576_222 = (($il_31) + ($i$86_221))|0;
         $D$2577_223 = (($D$2576_222) + -1)|0;
         $ar24 = (($cov_95) + ($D$2577_223<<3)|0);
         HEAP32[tempDoublePtr>>2]=HEAP32[$ar24>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar24+4>>2];$D$2578_224 = +HEAPF64[tempDoublePtr>>3];
         $D$2579_225 = $D$2578_224 / $cvdiag_11;
         $ar25 = (($cov_95) + ($D$2574_220<<3)|0);
         HEAPF64[tempDoublePtr>>3]=$D$2579_225;HEAP32[$ar25>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar25+4>>2]=HEAP32[tempDoublePtr+4>>2];
         $i$87_226 = HEAP32[$i>>2]|0;
         $ij_227 = (($ii_21) + ($i$87_226))|0;
         $i$88_228 = HEAP32[$i>>2]|0;
         $j$89_229 = (($i$88_228) + 1)|0;
         HEAP32[$j>>2] = $j$89_229;
         $j$90_231 = HEAP32[$j>>2]|0;
         $24 = ($j$90_231|0)<=($l_35|0);
         L59: do {
          if ($24) {
           $ij_29 = $ij_227;
           while(1) {
            $j$91_232 = HEAP32[$j>>2]|0;
            $D$2587_233 = (($il_31) + ($j$91_232))|0;
            $D$2588_234 = (($D$2587_233) + -1)|0;
            $j$92_235 = HEAP32[$j>>2]|0;
            $D$2590_236 = (($il_31) + ($j$92_235))|0;
            $D$2591_237 = (($D$2590_236) + -1)|0;
            $ar26 = (($cov_95) + ($D$2591_237<<3)|0);
            HEAP32[tempDoublePtr>>2]=HEAP32[$ar26>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar26+4>>2];$D$2592_238 = +HEAPF64[tempDoublePtr>>3];
            $i$93_239 = HEAP32[$i>>2]|0;
            $D$2594_240 = (($il_31) + ($i$93_239))|0;
            $D$2595_241 = (($D$2594_240) + -1)|0;
            $ar27 = (($cov_95) + ($D$2595_241<<3)|0);
            HEAP32[tempDoublePtr>>2]=HEAP32[$ar27>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar27+4>>2];$D$2596_242 = +HEAPF64[tempDoublePtr>>3];
            $i$94_243 = HEAP32[$i>>2]|0;
            $D$2598_244 = (($ij_29) + ($i$94_243))|0;
            $D$2599_245 = (($D$2598_244) + -1)|0;
            $ar28 = (($cov_95) + ($D$2599_245<<3)|0);
            HEAP32[tempDoublePtr>>2]=HEAP32[$ar28>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar28+4>>2];$D$2600_246 = +HEAPF64[tempDoublePtr>>3];
            $D$2601_247 = $D$2596_242 * $D$2600_246;
            $D$2602_248 = $D$2592_238 - $D$2601_247;
            $ar29 = (($cov_95) + ($D$2588_234<<3)|0);
            HEAPF64[tempDoublePtr>>3]=$D$2602_248;HEAP32[$ar29>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar29+4>>2]=HEAP32[tempDoublePtr+4>>2];
            $j$95_249 = HEAP32[$j>>2]|0;
            $ij_250 = (($ij_29) + ($j$95_249))|0;
            $j$96_251 = HEAP32[$j>>2]|0;
            $D$1967_252 = ($j$96_251|0)==($l_35|0);
            $j$97_253 = HEAP32[$j>>2]|0;
            $j$98_254 = (($j$97_253) + 1)|0;
            HEAP32[$j>>2] = $j$98_254;
            $D$1967_252$expand_i1_val = $D$1967_252&1;
            $$expand_i1_val9 = 0;
            $25 = ($D$1967_252$expand_i1_val<<24>>24)!=($$expand_i1_val9<<24>>24);
            if ($25) {
             break L59;
            }
            $ij_29 = $ij_250;
           }
          }
         } while(0);
         $il_255 = (($il_31) + ($l_35))|0;
         $D$1968_256 = ($l_35|0)==($D$1960_216|0);
         $l_257 = (($l_35) + 1)|0;
         $D$1968_256$expand_i1_val = $D$1968_256&1;
         $$expand_i1_val10 = 0;
         $26 = ($D$1968_256$expand_i1_val<<24>>24)!=($$expand_i1_val10<<24>>24);
         if ($26) {
          break L56;
         }
         $il_31 = $il_255;$l_35 = $l_257;
        }
       }
      } while(0);
      $D$2609_258 = $dmin_14 + 1.0E-10;
      $D$2610_259 = $D$2609_258 < $emin_17;
      $D$2610_259$expand_i1_val = $D$2610_259&1;
      $$expand_i1_val11 = 0;
      $27 = ($D$2610_259$expand_i1_val<<24>>24)!=($$expand_i1_val11<<24>>24);
      if ($27) {
       $i$99_262 = HEAP32[$i>>2]|0;
       $D$2614_263 = (($i$99_262) + -1)|0;
       $ar30 = (($infi_62) + ($D$2614_263<<2)|0);
       $D$2615_264 = HEAP32[$ar30>>2]|0;
       $28 = ($D$2615_264|0)!=(0);
       if ($28) {
        $D$1972_266 = $amin_4 * $amin_4;
        $D$2618_267 = $D$1972_266 / 2.0;
        $D$2619_268 = -$D$2618_267;
        $D$2620_269 = (+Math_exp((+$D$2619_268)));
        $D$2621_270 = $D$2620_269 / 2.5066282746310011;
        $yl_271 = -$D$2621_270;
        $yl_42 = $yl_271;
       } else {
        $yl_42 = 0.0;
       }
       $i$100_272 = HEAP32[$i>>2]|0;
       $D$2624_273 = (($i$100_272) + -1)|0;
       $ar31 = (($infi_62) + ($D$2624_273<<2)|0);
       $D$2625_274 = HEAP32[$ar31>>2]|0;
       $29 = ($D$2625_274|0)!=(1);
       if ($29) {
        $D$1975_276 = $bmin_8 * $bmin_8;
        $D$2628_277 = $D$1975_276 / 2.0;
        $D$2629_278 = -$D$2628_277;
        $D$2630_279 = (+Math_exp((+$D$2629_278)));
        $D$2631_280 = $D$2630_279 / 2.5066282746310011;
        $yu_281 = -$D$2631_280;
        $yu_43 = $yu_281;
       } else {
        $yu_43 = 0.0;
       }
       $i$101_282 = HEAP32[$i>>2]|0;
       $D$2634_283 = (($i$101_282) + -1)|0;
       $D$2635_284 = $yu_43 - $yl_42;
       $D$2637_286 = $emin_17 - $dmin_14;
       $D$2639_288 = $D$2635_284 / $D$2637_286;
       $ar32 = (($y_166) + ($D$2634_283<<3)|0);
       HEAPF64[tempDoublePtr>>3]=$D$2639_288;HEAP32[$ar32>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar32+4>>2]=HEAP32[tempDoublePtr+4>>2];
      } else {
       $i$102_289 = HEAP32[$i>>2]|0;
       $D$2642_290 = (($i$102_289) + -1)|0;
       $ar33 = (($infi_62) + ($D$2642_290<<2)|0);
       $D$2643_291 = HEAP32[$ar33>>2]|0;
       $30 = ($D$2643_291|0)==(0);
       if ($30) {
        $i$103_292 = HEAP32[$i>>2]|0;
        $D$2647_293 = (($i$103_292) + -1)|0;
        $ar34 = (($y_166) + ($D$2647_293<<3)|0);
        HEAPF64[tempDoublePtr>>3]=$bmin_8;HEAP32[$ar34>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar34+4>>2]=HEAP32[tempDoublePtr+4>>2];
       }
       $i$104_294 = HEAP32[$i>>2]|0;
       $D$2650_295 = (($i$104_294) + -1)|0;
       $ar35 = (($infi_62) + ($D$2650_295<<2)|0);
       $D$2651_296 = HEAP32[$ar35>>2]|0;
       $31 = ($D$2651_296|0)==(1);
       if ($31) {
        $i$105_297 = HEAP32[$i>>2]|0;
        $D$2655_298 = (($i$105_297) + -1)|0;
        $ar36 = (($y_166) + ($D$2655_298<<3)|0);
        HEAPF64[tempDoublePtr>>3]=$amin_4;HEAP32[$ar36>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar36+4>>2]=HEAP32[tempDoublePtr+4>>2];
       }
       $i$106_299 = HEAP32[$i>>2]|0;
       $D$2658_300 = (($i$106_299) + -1)|0;
       $ar37 = (($infi_62) + ($D$2658_300<<2)|0);
       $D$2659_301 = HEAP32[$ar37>>2]|0;
       $32 = ($D$2659_301|0)==(2);
       if ($32) {
        $i$107_302 = HEAP32[$i>>2]|0;
        $D$2663_303 = (($i$107_302) + -1)|0;
        $D$2664_304 = $amin_4 + $bmin_8;
        $D$2666_306 = $D$2664_304 / 2.0;
        $ar38 = (($y_166) + ($D$2663_303<<3)|0);
        HEAPF64[tempDoublePtr>>3]=$D$2666_306;HEAP32[$ar38>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar38+4>>2]=HEAP32[tempDoublePtr+4>>2];
       }
      }
      $D$1979_307 = HEAP32[$i>>2]|0;
      HEAP32[$j>>2] = 1;
      $j$108_308 = HEAP32[$j>>2]|0;
      $33 = ($j$108_308|0)<=($D$1979_307|0);
      L83: do {
       if ($33) {
        $ii_22 = $ii_21;
        while(1) {
         $ii_309 = (($ii_22) + 1)|0;
         $D$2672_310 = (($ii_309) + -1)|0;
         $D$2673_311 = (($ii_309) + -1)|0;
         $ar39 = (($cov_95) + ($D$2673_311<<3)|0);
         HEAP32[tempDoublePtr>>2]=HEAP32[$ar39>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar39+4>>2];$D$2674_312 = +HEAPF64[tempDoublePtr>>3];
         $D$2675_313 = $D$2674_312 / $cvdiag_11;
         $ar40 = (($cov_95) + ($D$2672_310<<3)|0);
         HEAPF64[tempDoublePtr>>3]=$D$2675_313;HEAP32[$ar40>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar40+4>>2]=HEAP32[tempDoublePtr+4>>2];
         $j$109_314 = HEAP32[$j>>2]|0;
         $D$1982_315 = ($j$109_314|0)==($D$1979_307|0);
         $j$110_316 = HEAP32[$j>>2]|0;
         $j$111_317 = (($j$110_316) + 1)|0;
         HEAP32[$j>>2] = $j$111_317;
         $D$1982_315$expand_i1_val = $D$1982_315&1;
         $$expand_i1_val12 = 0;
         $34 = ($D$1982_315$expand_i1_val<<24>>24)!=($$expand_i1_val12<<24>>24);
         if ($34) {
          $ii_23 = $ii_309;
          break L83;
         }
         $ii_22 = $ii_309;
        }
       } else {
        $ii_23 = $ii_21;
       }
      } while(0);
      $i$112_318 = HEAP32[$i>>2]|0;
      $D$2681_319 = (($i$112_318) + -1)|0;
      $i$113_320 = HEAP32[$i>>2]|0;
      $D$2683_321 = (($i$113_320) + -1)|0;
      $ar41 = (($a_52) + ($D$2683_321<<3)|0);
      HEAP32[tempDoublePtr>>2]=HEAP32[$ar41>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar41+4>>2];$D$2684_322 = +HEAPF64[tempDoublePtr>>3];
      $D$2685_323 = $D$2684_322 / $cvdiag_11;
      $ar42 = (($a_52) + ($D$2681_319<<3)|0);
      HEAPF64[tempDoublePtr>>3]=$D$2685_323;HEAP32[$ar42>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar42+4>>2]=HEAP32[tempDoublePtr+4>>2];
      $i$114_324 = HEAP32[$i>>2]|0;
      $D$2687_325 = (($i$114_324) + -1)|0;
      $i$115_326 = HEAP32[$i>>2]|0;
      $D$2689_327 = (($i$115_326) + -1)|0;
      $ar43 = (($b_55) + ($D$2689_327<<3)|0);
      HEAP32[tempDoublePtr>>2]=HEAP32[$ar43>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar43+4>>2];$D$2690_328 = +HEAPF64[tempDoublePtr>>3];
      $D$2691_329 = $D$2690_328 / $cvdiag_11;
      $ar44 = (($b_55) + ($D$2687_325<<3)|0);
      HEAPF64[tempDoublePtr>>3]=$D$2691_329;HEAP32[$ar44>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar44+4>>2]=HEAP32[tempDoublePtr+4>>2];
      $ii_24 = $ii_23;
     } else {
      $i$116_330 = HEAP32[$i>>2]|0;
      $il_331 = (($ii_21) + ($i$116_330))|0;
      $i$117_332 = HEAP32[$i>>2]|0;
      $l$118_333 = (($i$117_332) + 1)|0;
      $D$2695_334 = HEAP32[$n_47>>2]|0;
      $D$2696_335 = HEAP32[$infis_46>>2]|0;
      $D$1984_336 = (($D$2695_334) - ($D$2696_335))|0;
      $35 = ($l$118_333|0)<=($D$1984_336|0);
      L89: do {
       if ($35) {
        $il_32 = $il_331;$l_36 = $l$118_333;
        while(1) {
         $i$119_338 = HEAP32[$i>>2]|0;
         $D$2701_339 = (($il_32) + ($i$119_338))|0;
         $D$2702_340 = (($D$2701_339) + -1)|0;
         $ar45 = (($cov_95) + ($D$2702_340<<3)|0);
         HEAPF64[tempDoublePtr>>3]=0.0;HEAP32[$ar45>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar45+4>>2]=HEAP32[tempDoublePtr+4>>2];
         $il_341 = (($il_32) + ($l_36))|0;
         $D$1987_342 = ($l_36|0)==($D$1984_336|0);
         $l_343 = (($l_36) + 1)|0;
         $D$1987_342$expand_i1_val = $D$1987_342&1;
         $$expand_i1_val13 = 0;
         $36 = ($D$1987_342$expand_i1_val<<24>>24)!=($$expand_i1_val13<<24>>24);
         if ($36) {
          break L89;
         }
         $il_32 = $il_341;$l_36 = $l_343;
        }
       }
      } while(0);
      $i$120_344 = HEAP32[$i>>2]|0;
      $j$121_345 = (($i$120_344) + -1)|0;
      HEAP32[$j>>2] = $j$121_345;
      $j$122_346 = HEAP32[$j>>2]|0;
      $37 = ($j$122_346|0)>(0);
      L94: do {
       if ($37) {
        while(1) {
         $j$123_347 = HEAP32[$j>>2]|0;
         $D$2710_348 = (($ii_21) + ($j$123_347))|0;
         $D$2711_349 = (($D$2710_348) + -1)|0;
         $ar46 = (($cov_95) + ($D$2711_349<<3)|0);
         HEAP32[tempDoublePtr>>2]=HEAP32[$ar46>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar46+4>>2];$D$2712_350 = +HEAPF64[tempDoublePtr>>3];
         $D$2713_351 = (+Math_abs((+$D$2712_350)));
         $D$2714_352 = $D$2713_351 > 1.0E-10;
         $D$2714_352$expand_i1_val = $D$2714_352&1;
         $$expand_i1_val14 = 0;
         $38 = ($D$2714_352$expand_i1_val<<24>>24)!=($$expand_i1_val14<<24>>24);
         if ($38) {
          break;
         }
         $j$143_450 = HEAP32[$j>>2]|0;
         $D$2818_451 = (($ii_21) + ($j$143_450))|0;
         $D$2819_452 = (($D$2818_451) + -1)|0;
         $ar73 = (($cov_95) + ($D$2819_452<<3)|0);
         HEAPF64[tempDoublePtr>>3]=0.0;HEAP32[$ar73>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar73+4>>2]=HEAP32[tempDoublePtr+4>>2];
         $j$144_453 = HEAP32[$j>>2]|0;
         $D$2018_454 = ($j$144_453|0)==(1);
         $j$145_455 = HEAP32[$j>>2]|0;
         $j$146_456 = (($j$145_455) + -1)|0;
         HEAP32[$j>>2] = $j$146_456;
         $D$2018_454$expand_i1_val = $D$2018_454&1;
         $$expand_i1_val21 = 0;
         $50 = ($D$2018_454$expand_i1_val<<24>>24)!=($$expand_i1_val21<<24>>24);
         if ($50) {
          break L94;
         }
        }
        $i$124_353 = HEAP32[$i>>2]|0;
        $D$2718_354 = (($i$124_353) + -1)|0;
        $i$125_355 = HEAP32[$i>>2]|0;
        $D$2720_356 = (($i$125_355) + -1)|0;
        $ar47 = (($a_52) + ($D$2720_356<<3)|0);
        HEAP32[tempDoublePtr>>2]=HEAP32[$ar47>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar47+4>>2];$D$2721_357 = +HEAPF64[tempDoublePtr>>3];
        $j$126_358 = HEAP32[$j>>2]|0;
        $D$2723_359 = (($ii_21) + ($j$126_358))|0;
        $D$2724_360 = (($D$2723_359) + -1)|0;
        $ar48 = (($cov_95) + ($D$2724_360<<3)|0);
        HEAP32[tempDoublePtr>>2]=HEAP32[$ar48>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar48+4>>2];$D$2725_361 = +HEAPF64[tempDoublePtr>>3];
        $D$2726_362 = $D$2721_357 / $D$2725_361;
        $ar49 = (($a_52) + ($D$2718_354<<3)|0);
        HEAPF64[tempDoublePtr>>3]=$D$2726_362;HEAP32[$ar49>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar49+4>>2]=HEAP32[tempDoublePtr+4>>2];
        $i$127_363 = HEAP32[$i>>2]|0;
        $D$2728_364 = (($i$127_363) + -1)|0;
        $i$128_365 = HEAP32[$i>>2]|0;
        $D$2730_366 = (($i$128_365) + -1)|0;
        $ar50 = (($b_55) + ($D$2730_366<<3)|0);
        HEAP32[tempDoublePtr>>2]=HEAP32[$ar50>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar50+4>>2];$D$2731_367 = +HEAPF64[tempDoublePtr>>3];
        $j$129_368 = HEAP32[$j>>2]|0;
        $D$2733_369 = (($ii_21) + ($j$129_368))|0;
        $D$2734_370 = (($D$2733_369) + -1)|0;
        $ar51 = (($cov_95) + ($D$2734_370<<3)|0);
        HEAP32[tempDoublePtr>>2]=HEAP32[$ar51>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar51+4>>2];$D$2735_371 = +HEAPF64[tempDoublePtr>>3];
        $D$2736_372 = $D$2731_367 / $D$2735_371;
        $ar52 = (($b_55) + ($D$2728_364<<3)|0);
        HEAPF64[tempDoublePtr>>3]=$D$2736_372;HEAP32[$ar52>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar52+4>>2]=HEAP32[tempDoublePtr+4>>2];
        $j$130_373 = HEAP32[$j>>2]|0;
        $D$2738_374 = (($ii_21) + ($j$130_373))|0;
        $D$2739_375 = (($D$2738_374) + -1)|0;
        $ar53 = (($cov_95) + ($D$2739_375<<3)|0);
        HEAP32[tempDoublePtr>>2]=HEAP32[$ar53>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar53+4>>2];$D$2740_376 = +HEAPF64[tempDoublePtr>>3];
        $D$2741_377 = $D$2740_376 < 0.0;
        $D$2741_377$expand_i1_val = $D$2741_377&1;
        $$expand_i1_val15 = 0;
        $39 = ($D$2741_377$expand_i1_val<<24>>24)!=($$expand_i1_val15<<24>>24);
        if ($39) {
         $i$131_378 = HEAP32[$i>>2]|0;
         $D$2745_379 = (($i$131_378) + -1)|0;
         $ar54 = (($b_55) + ($D$2745_379<<3)|0);
         $i$132_381 = HEAP32[$i>>2]|0;
         $D$2748_382 = (($i$132_381) + -1)|0;
         $ar55 = (($a_52) + ($D$2748_382<<3)|0);
         _dkswap_($ar55,$ar54);
         $i$133_384 = HEAP32[$i>>2]|0;
         $D$2751_385 = (($i$133_384) + -1)|0;
         $ar56 = (($infi_62) + ($D$2751_385<<2)|0);
         $D$2752_386 = HEAP32[$ar56>>2]|0;
         $40 = ($D$2752_386|0)!=(2);
         if ($40) {
          $i$134_387 = HEAP32[$i>>2]|0;
          $D$2756_388 = (($i$134_387) + -1)|0;
          $i$135_389 = HEAP32[$i>>2]|0;
          $D$2758_390 = (($i$135_389) + -1)|0;
          $ar57 = (($infi_62) + ($D$2758_390<<2)|0);
          $D$2759_391 = HEAP32[$ar57>>2]|0;
          $D$2760_392 = (1 - ($D$2759_391))|0;
          $ar58 = (($infi_62) + ($D$2756_388<<2)|0);
          HEAP32[$ar58>>2] = $D$2760_392;
         }
        }
        $D$1998_393 = HEAP32[$j>>2]|0;
        $41 = (1)<=($D$1998_393|0);
        L104: do {
         if ($41) {
          $l_37 = 1;
          while(1) {
           $D$2766_395 = (($ii_21) + ($l_37))|0;
           $D$2767_396 = (($D$2766_395) + -1)|0;
           $D$2768_397 = (($ii_21) + ($l_37))|0;
           $D$2769_398 = (($D$2768_397) + -1)|0;
           $ar59 = (($cov_95) + ($D$2769_398<<3)|0);
           HEAP32[tempDoublePtr>>2]=HEAP32[$ar59>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar59+4>>2];$D$2770_399 = +HEAPF64[tempDoublePtr>>3];
           $j$136_400 = HEAP32[$j>>2]|0;
           $D$2772_401 = (($ii_21) + ($j$136_400))|0;
           $D$2773_402 = (($D$2772_401) + -1)|0;
           $ar60 = (($cov_95) + ($D$2773_402<<3)|0);
           HEAP32[tempDoublePtr>>2]=HEAP32[$ar60>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar60+4>>2];$D$2774_403 = +HEAPF64[tempDoublePtr>>3];
           $D$2775_404 = $D$2770_399 / $D$2774_403;
           $ar61 = (($cov_95) + ($D$2767_396<<3)|0);
           HEAPF64[tempDoublePtr>>3]=$D$2775_404;HEAP32[$ar61>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar61+4>>2]=HEAP32[tempDoublePtr+4>>2];
           $D$2001_405 = ($l_37|0)==($D$1998_393|0);
           $l_406 = (($l_37) + 1)|0;
           $D$2001_405$expand_i1_val = $D$2001_405&1;
           $$expand_i1_val16 = 0;
           $42 = ($D$2001_405$expand_i1_val<<24>>24)!=($$expand_i1_val16<<24>>24);
           if ($42) {
            break L104;
           }
           $l_37 = $l_406;
          }
         }
        } while(0);
        $j$137_407 = HEAP32[$j>>2]|0;
        $l$139_408 = (($j$137_407) + 1)|0;
        $i$138_409 = HEAP32[$i>>2]|0;
        $D$2003_410 = (($i$138_409) + -1)|0;
        $43 = ($l$139_408|0)<=($D$2003_410|0);
        L109: do {
         if ($43) {
          $l_38 = $l$139_408;
          while(1) {
           $D$2782_412 = (($l_38) + -1)|0;
           $D$2783_413 = Math_imul($D$2782_412, $l_38)|0;
           $D$2784_414 = (($D$2783_413|0) / 2)&-1;
           $j$140_415 = HEAP32[$j>>2]|0;
           $D$2786_416 = (($D$2784_414) + ($j$140_415))|0;
           $ar62 = (($cov_95) + ($D$2786_416<<3)|0);
           HEAP32[tempDoublePtr>>2]=HEAP32[$ar62>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar62+4>>2];$D$2787_417 = +HEAPF64[tempDoublePtr>>3];
           $D$2788_418 = $D$2787_417 > 0.0;
           $D$2788_418$expand_i1_val = $D$2788_418&1;
           $$expand_i1_val17 = 0;
           $44 = ($D$2788_418$expand_i1_val<<24>>24)!=($$expand_i1_val17<<24>>24);
           if ($44) {
            break;
           }
           $D$2017_448 = ($l_38|0)==($D$2003_410|0);
           $l_449 = (($l_38) + 1)|0;
           $D$2017_448$expand_i1_val = $D$2017_448&1;
           $$expand_i1_val20 = 0;
           $49 = ($D$2017_448$expand_i1_val<<24>>24)!=($$expand_i1_val20<<24>>24);
           if ($49) {
            break L109;
           }
           $l_38 = $l_449;
          }
          $i$141_420 = HEAP32[$i>>2]|0;
          $k$142_421 = (($i$141_420) + -1)|0;
          $45 = ($k$142_421|0)>=($l_38|0);
          L115: do {
           if ($45) {
            $ij_30 = $ii_21;$k_34 = $k$142_421;
            while(1) {
             $46 = (1)<=($k_34|0);
             L118: do {
              if ($46) {
               $m_39 = 1;
               while(1) {
                $D$2798_426 = (($ij_30) + ($m_39))|0;
                $D$2799_427 = (($D$2798_426) + -1)|0;
                $ar63 = (($cov_95) + ($D$2799_427<<3)|0);
                $D$2801_429 = (($ij_30) - ($k_34))|0;
                $D$2802_430 = (($D$2801_429) + ($m_39))|0;
                $D$2803_431 = (($D$2802_430) + -1)|0;
                $ar64 = (($cov_95) + ($D$2803_431<<3)|0);
                _dkswap_($ar64,$ar63);
                $D$2014_433 = ($m_39|0)==($k_34|0);
                $m_434 = (($m_39) + 1)|0;
                $D$2014_433$expand_i1_val = $D$2014_433&1;
                $$expand_i1_val18 = 0;
                $47 = ($D$2014_433$expand_i1_val<<24>>24)!=($$expand_i1_val18<<24>>24);
                if ($47) {
                 break L118;
                }
                $m_39 = $m_434;
               }
              }
             } while(0);
             $ar65 = (($a_52) + ($k_34<<3)|0);
             $D$2807_436 = (($k_34) + -1)|0;
             $ar66 = (($a_52) + ($D$2807_436<<3)|0);
             _dkswap_($ar66,$ar65);
             $ar67 = (($b_55) + ($k_34<<3)|0);
             $D$2810_439 = (($k_34) + -1)|0;
             $ar68 = (($b_55) + ($D$2810_439<<3)|0);
             _dkswap_($ar68,$ar67);
             $D$2812_441 = (($k_34) + -1)|0;
             $ar69 = (($infi_62) + ($D$2812_441<<2)|0);
             $m_442 = HEAP32[$ar69>>2]|0;
             $D$2813_443 = (($k_34) + -1)|0;
             $ar70 = (($infi_62) + ($k_34<<2)|0);
             $D$2814_444 = HEAP32[$ar70>>2]|0;
             $ar71 = (($infi_62) + ($D$2813_443<<2)|0);
             HEAP32[$ar71>>2] = $D$2814_444;
             $ar72 = (($infi_62) + ($k_34<<2)|0);
             HEAP32[$ar72>>2] = $m_442;
             $ij_445 = (($ij_30) - ($k_34))|0;
             $D$2015_446 = ($k_34|0)==($l_38|0);
             $k_447 = (($k_34) + -1)|0;
             $D$2015_446$expand_i1_val = $D$2015_446&1;
             $$expand_i1_val19 = 0;
             $48 = ($D$2015_446$expand_i1_val<<24>>24)!=($$expand_i1_val19<<24>>24);
             if ($48) {
              break L115;
             }
             $ij_30 = $ij_445;$k_34 = $k_447;
            }
           }
          } while(0);
          break L94;
         }
        } while(0);
       }
      } while(0);
      $i$147_457 = HEAP32[$i>>2]|0;
      $ii_458 = (($ii_21) + ($i$147_457))|0;
      $i$148_459 = HEAP32[$i>>2]|0;
      $D$2826_460 = (($i$148_459) + -1)|0;
      $ar74 = (($y_166) + ($D$2826_460<<3)|0);
      HEAPF64[tempDoublePtr>>3]=0.0;HEAP32[$ar74>>2]=HEAP32[tempDoublePtr>>2];HEAP32[$ar74+4>>2]=HEAP32[tempDoublePtr+4>>2];
      $ii_24 = $ii_458;
     }
     $i$149_461 = HEAP32[$i>>2]|0;
     $D$2019_462 = ($i$149_461|0)==($D$1943_134|0);
     $i$150_463 = HEAP32[$i>>2]|0;
     $i$151_464 = (($i$150_463) + 1)|0;
     HEAP32[$i>>2] = $i$151_464;
     $D$2019_462$expand_i1_val = $D$2019_462&1;
     $$expand_i1_val22 = 0;
     $51 = ($D$2019_462$expand_i1_val<<24>>24)!=($$expand_i1_val22<<24>>24);
     if ($51) {
      break L20;
     }
     $amin_1 = $amin_4;$bmin_5 = $bmin_8;$ii_21 = $ii_24;
    }
   }
  }
 } while(0);
 STACKTOP = sp;return;
}
function _bvnmvn_($lower,$upper,$infin,$correl) {
 $lower = $lower|0;
 $upper = $upper|0;
 $infin = $infin|0;
 $correl = $correl|0;
 var $$retval$3C3E = 0.0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0.0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var $D$1797 = 0, $D$1798 = 0, $D$1799 = 0, $D$1800 = 0, $D$1801 = 0, $D$1802 = 0, $D$1803 = 0, $D$1804 = 0, $D$1805 = 0, $D$1806 = 0, $D$1807 = 0, $D$1808 = 0, $D$1809 = 0, $D$1810 = 0, $D$3143_2 = 0, $D$3145_3 = 0, $D$3149_8 = 0.0, $D$3152_12 = 0.0, $D$3153_13 = 0.0, $D$3156_16 = 0.0;
 var $D$3157_17 = 0.0, $D$3160_20 = 0.0, $D$3164_22 = 0, $D$3166_23 = 0, $D$3170_26 = 0.0, $D$3173_29 = 0.0, $D$3177_31 = 0, $D$3179_32 = 0, $D$3183_35 = 0.0, $D$3186_38 = 0.0, $D$3190_40 = 0, $D$3192_41 = 0, $D$3194_42 = 0.0, $D$3195_43 = 0.0, $D$3196_44 = 0.0, $D$3197_45 = 0.0, $D$3198_46 = 0.0, $D$3199_47 = 0.0, $D$3200_48 = 0.0, $D$3201_49 = 0.0;
 var $D$3202_50 = 0.0, $D$3203_51 = 0.0, $D$3207_53 = 0, $D$3209_54 = 0, $D$3211_55 = 0.0, $D$3212_56 = 0.0, $D$3213_57 = 0.0, $D$3214_58 = 0.0, $D$3215_59 = 0.0, $D$3216_60 = 0.0, $D$3217_61 = 0.0, $D$3218_62 = 0.0, $D$3219_63 = 0.0, $D$3220_64 = 0.0, $D$3224_66 = 0, $D$3226_67 = 0, $D$3228_68 = 0.0, $D$3229_69 = 0.0, $D$3230_70 = 0.0, $D$3231_71 = 0.0;
 var $D$3236_74 = 0, $D$3238_75 = 0, $D$3240_76 = 0.0, $D$3241_77 = 0.0, $D$3242_78 = 0.0, $D$3243_79 = 0.0, $D$3248_82 = 0, $D$3250_83 = 0, $D$3255_87 = 0, $D$3258_88 = 0, $D$3261_89 = 0.0, $D$3262_90 = 0.0, $D$3263_91 = 0.0, $D$3264_92 = 0.0, $D$3267_94 = 0.0, $__result_bvnmvn = 0.0, $__result_bvnmvn$174_21 = 0.0, $__result_bvnmvn$175_30 = 0.0, $__result_bvnmvn$176_39 = 0.0, $__result_bvnmvn$177_52 = 0.0;
 var $__result_bvnmvn$178_65 = 0.0, $__result_bvnmvn$179_73 = 0.0, $__result_bvnmvn$180_81 = 0.0, $__result_bvnmvn$181_86 = 0.0, $__result_bvnmvn$182_93 = 0.0, $ar1 = 0, $ar11 = 0, $ar12 = 0, $ar14 = 0, $ar17 = 0, $ar18 = 0, $ar2 = 0, $ar20 = 0, $ar23 = 0, $ar25 = 0, $ar27 = 0, $ar29 = 0, $ar31 = 0, $ar33 = 0, $ar35 = 0;
 var $ar36 = 0, $ar39 = 0, $ar4 = 0, $ar41 = 0, $ar43 = 0, $ar44 = 0, $ar47 = 0, $ar49 = 0, $ar6 = 0, $ar8 = 0, $correl_7 = 0, $correl_addr = 0, $infin_1 = 0, $infin_addr = 0, $lower_4 = 0, $lower_addr = 0, $upper_10 = 0, $upper_addr = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 144|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $D$1800 = sp + 112|0;
 $D$1799 = sp + 104|0;
 $D$1798 = sp + 96|0;
 $D$1797 = sp + 88|0;
 $D$1804 = sp + 80|0;
 $D$1803 = sp + 72|0;
 $D$1802 = sp + 64|0;
 $D$1801 = sp + 56|0;
 $D$1806 = sp + 48|0;
 $D$1805 = sp + 40|0;
 $D$1808 = sp + 32|0;
 $D$1807 = sp + 24|0;
 $D$1810 = sp + 16|0;
 $D$1809 = sp + 8|0;
 $lower_addr = $lower;
 $upper_addr = $upper;
 $infin_addr = $infin;
 $correl_addr = $correl;
 $infin_1 = $infin_addr;
 $lower_4 = $lower_addr;
 $correl_7 = $correl_addr;
 $upper_10 = $upper_addr;
 $D$3143_2 = HEAP32[$infin_1>>2]|0;
 $0 = ($D$3143_2|0)==(2);
 if ($0) {
  $ar1 = (($infin_1) + 4|0);
  $D$3145_3 = HEAP32[$ar1>>2]|0;
  $1 = ($D$3145_3|0)==(2);
  if ($1) {
   $ar2 = (($lower_4) + 8|0);
   $D$3149_8 = (+_bvu_($lower_4,$ar2,$correl_7));
   $ar4 = (($lower_4) + 8|0);
   $D$3152_12 = (+_bvu_($upper_10,$ar4,$correl_7));
   $D$3153_13 = $D$3149_8 - $D$3152_12;
   $ar6 = (($upper_10) + 8|0);
   $D$3156_16 = (+_bvu_($lower_4,$ar6,$correl_7));
   $D$3157_17 = $D$3153_13 - $D$3156_16;
   $ar8 = (($upper_10) + 8|0);
   $D$3160_20 = (+_bvu_($upper_10,$ar8,$correl_7));
   $__result_bvnmvn$174_21 = $D$3157_17 + $D$3160_20;
   $__result_bvnmvn = $__result_bvnmvn$174_21;
  } else {
   label = 5;
  }
 } else {
  label = 5;
 }
 do {
  if ((label|0) == 5) {
   $D$3164_22 = HEAP32[$infin_1>>2]|0;
   $2 = ($D$3164_22|0)==(2);
   if ($2) {
    $ar11 = (($infin_1) + 4|0);
    $D$3166_23 = HEAP32[$ar11>>2]|0;
    $3 = ($D$3166_23|0)==(1);
    if ($3) {
     $ar12 = (($lower_4) + 8|0);
     $D$3170_26 = (+_bvu_($lower_4,$ar12,$correl_7));
     $ar14 = (($lower_4) + 8|0);
     $D$3173_29 = (+_bvu_($upper_10,$ar14,$correl_7));
     $__result_bvnmvn$175_30 = $D$3170_26 - $D$3173_29;
     $__result_bvnmvn = $__result_bvnmvn$175_30;
     break;
    }
   }
   $D$3177_31 = HEAP32[$infin_1>>2]|0;
   $4 = ($D$3177_31|0)==(1);
   if ($4) {
    $ar17 = (($infin_1) + 4|0);
    $D$3179_32 = HEAP32[$ar17>>2]|0;
    $5 = ($D$3179_32|0)==(2);
    if ($5) {
     $ar18 = (($lower_4) + 8|0);
     $D$3183_35 = (+_bvu_($lower_4,$ar18,$correl_7));
     $ar20 = (($upper_10) + 8|0);
     $D$3186_38 = (+_bvu_($lower_4,$ar20,$correl_7));
     $__result_bvnmvn$176_39 = $D$3183_35 - $D$3186_38;
     $__result_bvnmvn = $__result_bvnmvn$176_39;
     break;
    }
   }
   $D$3190_40 = HEAP32[$infin_1>>2]|0;
   $6 = ($D$3190_40|0)==(2);
   if ($6) {
    $ar23 = (($infin_1) + 4|0);
    $D$3192_41 = HEAP32[$ar23>>2]|0;
    $7 = ($D$3192_41|0)==(0);
    if ($7) {
     HEAP32[tempDoublePtr>>2]=HEAP32[$upper_10>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$upper_10+4>>2];$D$3194_42 = +HEAPF64[tempDoublePtr>>3];
     $D$3195_43 = -$D$3194_42;
     HEAPF64[$D$1797>>3] = $D$3195_43;
     $ar25 = (($upper_10) + 8|0);
     HEAP32[tempDoublePtr>>2]=HEAP32[$ar25>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar25+4>>2];$D$3196_44 = +HEAPF64[tempDoublePtr>>3];
     $D$3197_45 = -$D$3196_44;
     HEAPF64[$D$1798>>3] = $D$3197_45;
     HEAP32[tempDoublePtr>>2]=HEAP32[$lower_4>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$lower_4+4>>2];$D$3198_46 = +HEAPF64[tempDoublePtr>>3];
     $D$3199_47 = -$D$3198_46;
     HEAPF64[$D$1799>>3] = $D$3199_47;
     $ar27 = (($upper_10) + 8|0);
     HEAP32[tempDoublePtr>>2]=HEAP32[$ar27>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar27+4>>2];$D$3200_48 = +HEAPF64[tempDoublePtr>>3];
     $D$3201_49 = -$D$3200_48;
     HEAPF64[$D$1800>>3] = $D$3201_49;
     $D$3202_50 = (+_bvu_($D$1797,$D$1798,$correl_7));
     $D$3203_51 = (+_bvu_($D$1799,$D$1800,$correl_7));
     $__result_bvnmvn$177_52 = $D$3202_50 - $D$3203_51;
     $__result_bvnmvn = $__result_bvnmvn$177_52;
     break;
    }
   }
   $D$3207_53 = HEAP32[$infin_1>>2]|0;
   $8 = ($D$3207_53|0)==(0);
   if ($8) {
    $ar29 = (($infin_1) + 4|0);
    $D$3209_54 = HEAP32[$ar29>>2]|0;
    $9 = ($D$3209_54|0)==(2);
    if ($9) {
     HEAP32[tempDoublePtr>>2]=HEAP32[$upper_10>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$upper_10+4>>2];$D$3211_55 = +HEAPF64[tempDoublePtr>>3];
     $D$3212_56 = -$D$3211_55;
     HEAPF64[$D$1801>>3] = $D$3212_56;
     $ar31 = (($upper_10) + 8|0);
     HEAP32[tempDoublePtr>>2]=HEAP32[$ar31>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar31+4>>2];$D$3213_57 = +HEAPF64[tempDoublePtr>>3];
     $D$3214_58 = -$D$3213_57;
     HEAPF64[$D$1802>>3] = $D$3214_58;
     HEAP32[tempDoublePtr>>2]=HEAP32[$upper_10>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$upper_10+4>>2];$D$3215_59 = +HEAPF64[tempDoublePtr>>3];
     $D$3216_60 = -$D$3215_59;
     HEAPF64[$D$1803>>3] = $D$3216_60;
     $ar33 = (($lower_4) + 8|0);
     HEAP32[tempDoublePtr>>2]=HEAP32[$ar33>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar33+4>>2];$D$3217_61 = +HEAPF64[tempDoublePtr>>3];
     $D$3218_62 = -$D$3217_61;
     HEAPF64[$D$1804>>3] = $D$3218_62;
     $D$3219_63 = (+_bvu_($D$1801,$D$1802,$correl_7));
     $D$3220_64 = (+_bvu_($D$1803,$D$1804,$correl_7));
     $__result_bvnmvn$178_65 = $D$3219_63 - $D$3220_64;
     $__result_bvnmvn = $__result_bvnmvn$178_65;
     break;
    }
   }
   $D$3224_66 = HEAP32[$infin_1>>2]|0;
   $10 = ($D$3224_66|0)==(1);
   if ($10) {
    $ar35 = (($infin_1) + 4|0);
    $D$3226_67 = HEAP32[$ar35>>2]|0;
    $11 = ($D$3226_67|0)==(0);
    if ($11) {
     $ar36 = (($upper_10) + 8|0);
     HEAP32[tempDoublePtr>>2]=HEAP32[$ar36>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar36+4>>2];$D$3228_68 = +HEAPF64[tempDoublePtr>>3];
     $D$3229_69 = -$D$3228_68;
     HEAPF64[$D$1805>>3] = $D$3229_69;
     $D$3230_70 = +HEAPF64[$correl_7>>3];
     $D$3231_71 = -$D$3230_70;
     HEAPF64[$D$1806>>3] = $D$3231_71;
     $__result_bvnmvn$179_73 = (+_bvu_($lower_4,$D$1805,$D$1806));
     $__result_bvnmvn = $__result_bvnmvn$179_73;
     break;
    }
   }
   $D$3236_74 = HEAP32[$infin_1>>2]|0;
   $12 = ($D$3236_74|0)==(0);
   if ($12) {
    $ar39 = (($infin_1) + 4|0);
    $D$3238_75 = HEAP32[$ar39>>2]|0;
    $13 = ($D$3238_75|0)==(1);
    if ($13) {
     HEAP32[tempDoublePtr>>2]=HEAP32[$upper_10>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$upper_10+4>>2];$D$3240_76 = +HEAPF64[tempDoublePtr>>3];
     $D$3241_77 = -$D$3240_76;
     HEAPF64[$D$1807>>3] = $D$3241_77;
     $D$3242_78 = +HEAPF64[$correl_7>>3];
     $D$3243_79 = -$D$3242_78;
     HEAPF64[$D$1808>>3] = $D$3243_79;
     $ar41 = (($lower_4) + 8|0);
     $__result_bvnmvn$180_81 = (+_bvu_($D$1807,$ar41,$D$1808));
     $__result_bvnmvn = $__result_bvnmvn$180_81;
     break;
    }
   }
   $D$3248_82 = HEAP32[$infin_1>>2]|0;
   $14 = ($D$3248_82|0)==(1);
   if ($14) {
    $ar43 = (($infin_1) + 4|0);
    $D$3250_83 = HEAP32[$ar43>>2]|0;
    $15 = ($D$3250_83|0)==(1);
    if ($15) {
     $ar44 = (($lower_4) + 8|0);
     $__result_bvnmvn$181_86 = (+_bvu_($lower_4,$ar44,$correl_7));
     $__result_bvnmvn = $__result_bvnmvn$181_86;
     break;
    }
   }
   $D$3255_87 = HEAP32[$infin_1>>2]|0;
   $16 = ($D$3255_87|0)==(0);
   if ($16) {
    $ar47 = (($infin_1) + 4|0);
    $D$3258_88 = HEAP32[$ar47>>2]|0;
    $17 = ($D$3258_88|0)==(0);
    if ($17) {
     HEAP32[tempDoublePtr>>2]=HEAP32[$upper_10>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$upper_10+4>>2];$D$3261_89 = +HEAPF64[tempDoublePtr>>3];
     $D$3262_90 = -$D$3261_89;
     HEAPF64[$D$1809>>3] = $D$3262_90;
     $ar49 = (($upper_10) + 8|0);
     HEAP32[tempDoublePtr>>2]=HEAP32[$ar49>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar49+4>>2];$D$3263_91 = +HEAPF64[tempDoublePtr>>3];
     $D$3264_92 = -$D$3263_91;
     HEAPF64[$D$1810>>3] = $D$3264_92;
     $__result_bvnmvn$182_93 = (+_bvu_($D$1809,$D$1810,$correl_7));
     $__result_bvnmvn = $__result_bvnmvn$182_93;
    }
   }
  }
 } while(0);
 $D$3267_94 = $__result_bvnmvn;
 $$retval$3C3E = $D$3267_94;
 $18 = $$retval$3C3E;
 STACKTOP = sp;return (+$18);
}
function _mvnphi_($z) {
 $z = $z|0;
 var $$expand_i1_val = 0, $$expand_i1_val1 = 0, $$expand_i1_val2 = 0, $$retval$3C3E = 0.0, $0 = 0, $1 = 0, $2 = 0, $3 = 0.0, $D$1879_31 = 0, $D$1879_31$expand_i1_val = 0, $D$2832_9 = 0.0, $D$2833_10 = 0.0, $D$2834_12 = 0, $D$2834_12$expand_i1_val = 0, $D$2838_14 = 0.0, $D$2839_15 = 0.0, $D$2841_17 = 0.0, $D$2842_18 = 0.0, $D$2847_27 = 0.0, $D$2848_28 = 0.0;
 var $D$2849_29 = 0.0, $D$2851_33 = 0.0, $D$2852_34 = 0.0, $D$2853_35 = 0.0, $D$2854_36 = 0.0, $D$2856_38 = 0.0, $D$2857_40 = 0.0, $D$2858_41 = 0, $D$2858_41$expand_i1_val = 0, $D$2862_43 = 0.0, $__result_mvnphi = 0.0, $ar = 0, $b_1 = 0.0, $b_1$phi = 0.0, $bm_2 = 0.0, $bm_3 = 0.0, $bm_30 = 0.0, $bp_4 = 0.0, $i_32 = 0, $i_5 = 0;
 var $p_39 = 0.0, $p_42 = 0.0, $p_6 = 0.0, $p_7 = 0.0, $t_20 = 0.0, $xa_11 = 0.0, $z_8 = 0, $z_addr = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $z_addr = $z;
 $z_8 = $z_addr;
 $D$2832_9 = +HEAPF64[$z_8>>3];
 $D$2833_10 = (+Math_abs((+$D$2832_9)));
 $xa_11 = $D$2833_10 / 1.4142135623730951;
 $D$2834_12 = $xa_11 > 100.0;
 $D$2834_12$expand_i1_val = $D$2834_12&1;
 $$expand_i1_val = 0;
 $0 = ($D$2834_12$expand_i1_val<<24>>24)!=($$expand_i1_val<<24>>24);
 if ($0) {
  $p_6 = 0.0;
 } else {
  $D$2838_14 = $xa_11 * 8.0;
  $D$2839_15 = $D$2838_14 - 30.0;
  $D$2841_17 = $xa_11 * 4.0;
  $D$2842_18 = $D$2841_17 + 15.0;
  $t_20 = $D$2839_15 / $D$2842_18;
  L5: do {
   if (1) {
    $b_1 = 0.0;$bm_2 = 0.0;$i_5 = 24;
    while(1) {
     $D$2847_27 = $t_20 * $bm_2;
     $D$2848_28 = $D$2847_27 - $b_1;
     $ar = (1023768 + ($i_5<<3)|0);
     HEAP32[tempDoublePtr>>2]=HEAP32[$ar>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar+4>>2];$D$2849_29 = +HEAPF64[tempDoublePtr>>3];
     $bm_30 = $D$2848_28 + $D$2849_29;
     $D$1879_31 = ($i_5|0)==(0);
     $i_32 = (($i_5) + -1)|0;
     $D$1879_31$expand_i1_val = $D$1879_31&1;
     $$expand_i1_val1 = 0;
     $1 = ($D$1879_31$expand_i1_val<<24>>24)!=($$expand_i1_val1<<24>>24);
     if ($1) {
      $bm_3 = $bm_30;$bp_4 = $b_1;
      break L5;
     }
     $b_1$phi = $bm_2;$bm_2 = $bm_30;$i_5 = $i_32;$b_1 = $b_1$phi;
    }
   } else {
    $bm_3 = 0.0;$bp_4 = 0.0;
   }
  } while(0);
  $D$2851_33 = $xa_11 * $xa_11;
  $D$2852_34 = -$D$2851_33;
  $D$2853_35 = (+Math_exp((+$D$2852_34)));
  $D$2854_36 = $bm_3 - $bp_4;
  $D$2856_38 = $D$2853_35 * $D$2854_36;
  $p_39 = $D$2856_38 / 4.0;
  $p_6 = $p_39;
 }
 $D$2857_40 = +HEAPF64[$z_8>>3];
 $D$2858_41 = $D$2857_40 > 0.0;
 $D$2858_41$expand_i1_val = $D$2858_41&1;
 $$expand_i1_val2 = 0;
 $2 = ($D$2858_41$expand_i1_val<<24>>24)!=($$expand_i1_val2<<24>>24);
 if ($2) {
  $p_42 = 1.0 - $p_6;
  $p_7 = $p_42;
 } else {
  $p_7 = $p_6;
 }
 $__result_mvnphi = $p_7;
 $D$2862_43 = $__result_mvnphi;
 $$retval$3C3E = $D$2862_43;
 $3 = $$retval$3C3E;
 STACKTOP = sp;return (+$3);
}
function _bvu_($sh,$sk,$r) {
 $sh = $sh|0;
 $sk = $sk|0;
 $r = $r|0;
 var $$expand_i1_val = 0, $$expand_i1_val1 = 0, $$expand_i1_val10 = 0, $$expand_i1_val11 = 0, $$expand_i1_val12 = 0, $$expand_i1_val13 = 0, $$expand_i1_val2 = 0, $$expand_i1_val3 = 0, $$expand_i1_val4 = 0, $$expand_i1_val5 = 0, $$expand_i1_val6 = 0, $$expand_i1_val7 = 0, $$expand_i1_val8 = 0, $$expand_i1_val9 = 0, $$retval$3C3E = 0.0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0;
 var $13 = 0, $14 = 0.0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $D$1838_97 = 0, $D$1838_97$expand_i1_val = 0, $D$1839 = 0, $D$1840 = 0, $D$1846 = 0, $D$1853_237 = 0.0, $D$1855_244 = 0.0, $D$1856_275 = 0, $D$1856_275$expand_i1_val = 0, $D$1859 = 0;
 var $D$1862 = 0, $D$1863 = 0, $D$2864_15 = 0.0, $D$2865_16 = 0.0, $D$2866_17 = 0, $D$2866_17$expand_i1_val = 0, $D$2870_20 = 0.0, $D$2871_21 = 0.0, $D$2872_22 = 0, $D$2872_22$expand_i1_val = 0, $D$2880_35 = 0.0, $D$2881_36 = 0.0, $D$2882_37 = 0, $D$2882_37$expand_i1_val = 0, $D$2887_40 = 0.0, $D$2890_43 = 0.0, $D$2891_44 = 0.0, $D$2893_47 = 0.0, $D$2897_51 = 0, $D$2898_52 = 0;
 var $D$2899_53 = 0, $D$2900_54 = 0.0, $D$2901_55 = 0.0, $D$2903_57 = 0.0, $D$2904_58 = 0.0, $D$2905_60 = 0, $D$2906_61 = 0, $D$2907_62 = 0, $D$2908_63 = 0.0, $D$2909_64 = 0.0, $D$2910_65 = 0.0, $D$2912_67 = 0.0, $D$2913_68 = 0.0, $D$2915_70 = 0.0, $D$2916_71 = 0.0, $D$2917_72 = 0.0, $D$2918_74 = 0, $D$2919_75 = 0, $D$2920_76 = 0, $D$2921_77 = 0.0;
 var $D$2922_78 = 0.0, $D$2924_80 = 0.0, $D$2925_81 = 0.0, $D$2926_83 = 0, $D$2927_84 = 0, $D$2928_85 = 0, $D$2929_86 = 0.0, $D$2930_87 = 0.0, $D$2931_88 = 0.0, $D$2933_90 = 0.0, $D$2934_91 = 0.0, $D$2936_93 = 0.0, $D$2937_94 = 0.0, $D$2938_95 = 0.0, $D$2941_100 = 0.0, $D$2943_102 = 0.0, $D$2944_103 = 0.0, $D$2945_104 = 0.0, $D$2946_105 = 0.0, $D$2947_106 = 0.0;
 var $D$2948_107 = 0.0, $D$2950_109 = 0.0, $D$2951_110 = 0, $D$2951_110$expand_i1_val = 0, $D$2957_114 = 0.0, $D$2958_115 = 0.0, $D$2959_116 = 0, $D$2959_116$expand_i1_val = 0, $D$2962_117 = 0.0, $D$2963_118 = 0.0, $D$2965_120 = 0.0, $D$2966_121 = 0.0, $D$2970_127 = 0.0, $D$2971_131 = 0.0, $D$2973_134 = 0.0, $D$2975_137 = 0.0, $D$2976_138 = 0.0, $D$2978_140 = 0.0, $D$2979_141 = 0.0, $D$2980_142 = 0.0;
 var $D$2981_143 = 0.0, $D$2982_144 = 0.0, $D$2984_146 = 0.0, $D$2985_147 = 0.0, $D$2986_148 = 0.0, $D$2987_149 = 0.0, $D$2989_151 = 0.0, $D$2990_152 = 0.0, $D$2991_153 = 0.0, $D$2992_154 = 0.0, $D$2993_155 = 0.0, $D$2994_156 = 0.0, $D$2995_157 = 0.0, $D$2996_158 = 0.0, $D$2998_161 = 0, $D$2998_161$expand_i1_val = 0, $D$3001_163 = 0.0, $D$3002_164 = 0.0, $D$3003_165 = 0.0, $D$3004_166 = 0.0;
 var $D$3005_167 = 0.0, $D$3006_168 = 0.0, $D$3007_169 = 0.0, $D$3008_170 = 0.0, $D$3009_171 = 0.0, $D$3010_172 = 0.0, $D$3011_173 = 0.0, $D$3012_174 = 0.0, $D$3013_175 = 0.0, $D$3015_177 = 0.0, $D$3016_178 = 0.0, $D$3017_179 = 0.0, $D$3019_181 = 0.0, $D$3024_186 = 0, $D$3025_187 = 0, $D$3026_188 = 0, $D$3027_189 = 0.0, $D$3028_190 = 0.0, $D$3030_192 = 0.0, $D$3031_196 = 0.0;
 var $D$3032_198 = 0, $D$3033_199 = 0, $D$3034_200 = 0, $D$3035_201 = 0.0, $D$3036_202 = 0.0, $D$3037_203 = 0.0, $D$3039_205 = 0.0, $D$3040_206 = 0.0, $D$3041_207 = 0.0, $D$3043_209 = 0.0, $D$3044_210 = 0.0, $D$3045_211 = 0.0, $D$3046_212 = 0.0, $D$3047_213 = 0.0, $D$3048_214 = 0.0, $D$3050_216 = 0.0, $D$3051_217 = 0.0, $D$3052_218 = 0.0, $D$3053_219 = 0.0, $D$3054_220 = 0.0;
 var $D$3055_221 = 0.0, $D$3057_223 = 0.0, $D$3058_224 = 0.0, $D$3060_226 = 0.0, $D$3061_227 = 0.0, $D$3063_229 = 0.0, $D$3064_231 = 0, $D$3065_232 = 0, $D$3066_233 = 0, $D$3067_234 = 0.0, $D$3068_235 = 0.0, $D$3069_238 = 0.0, $D$3070_240 = 0.0, $D$3071_242 = 0.0, $D$3072_245 = 0, $D$3073_246 = 0, $D$3074_247 = 0, $D$3075_248 = 0.0, $D$3076_249 = 0.0, $D$3077_250 = 0.0;
 var $D$3078_251 = 0.0, $D$3080_253 = 0.0, $D$3081_254 = 0.0, $D$3082_255 = 0.0, $D$3083_256 = 0.0, $D$3084_257 = 0.0, $D$3085_258 = 0.0, $D$3087_260 = 0.0, $D$3088_261 = 0.0, $D$3089_262 = 0.0, $D$3090_263 = 0.0, $D$3091_264 = 0.0, $D$3092_265 = 0.0, $D$3093_266 = 0.0, $D$3095_268 = 0.0, $D$3096_269 = 0.0, $D$3098_271 = 0.0, $D$3100_273 = 0.0, $D$3102_277 = 0.0, $D$3104_279 = 0.0;
 var $D$3105_280 = 0, $D$3105_280$expand_i1_val = 0, $D$3109_283 = 0, $D$3109_283$expand_i1_val = 0, $D$3110_284 = 0, $D$3110_284$expand_i1_val = 0, $D$3111_285 = 0, $D$3111_285$expand_i1_val = 0, $D$3115_287 = 0.0, $D$3116_288 = 0.0, $D$3120_293 = 0, $D$3120_293$expand_i1_val = 0, $D$3124_295 = 0, $D$3124_295$expand_i1_val = 0, $D$3127_296 = 0.0, $D$3128_297 = 0.0, $D$3129_298 = 0.0, $D$3132_301 = 0.0, $D$3134_303 = 0.0, $D$3135_304 = 0.0;
 var $D$3136_305 = 0.0, $D$3137_306 = 0.0, $D$3139_308 = 0.0, $M$14_13 = 0.0, $M$14_281 = 0.0, $M$14_286 = 0.0, $__result_bvu = 0.0, $a_124 = 0.0, $a_183 = 0.0, $ar = 0, $ar1 = 0, $ar2 = 0, $ar3 = 0, $ar4 = 0, $ar5 = 0, $ar6 = 0, $ar7 = 0, $as_123 = 0.0, $asr_48 = 0.0, $b_162 = 0.0;
 var $bs$166_129 = 0.0, $bvn_1 = 0.0, $bvn_108 = 0.0, $bvn_160 = 0.0, $bvn_182 = 0.0, $bvn_2 = 0.0, $bvn_230 = 0.0, $bvn_274 = 0.0, $bvn_278 = 0.0, $bvn_289 = 0.0, $bvn_290 = 0.0, $bvn_299 = 0.0, $bvn_3 = 0.0, $bvn_307 = 0.0, $bvn_4 = 0.0, $bvn_5 = 0.0, $bvn_6 = 0.0, $bvn_7 = 0.0, $bvn_73 = 0.0, $bvn_96 = 0.0;
 var $c_133 = 0.0, $d_136 = 0.0, $h = 0, $h$152_28 = 0.0, $h$154_31 = 0.0, $h$156_38 = 0.0, $h$157_39 = 0.0, $h$160_99 = 0.0, $h$164_125 = 0.0, $h$170_292 = 0.0, $h$171_294 = 0.0, $h$172_300 = 0.0, $hk_113 = 0.0, $hk_33 = 0.0, $hk_8 = 0.0, $hs_46 = 0.0, $i_10 = 0, $i_276 = 0, $i_9 = 0, $i_98 = 0;
 var $k = 0, $k$153_30 = 0.0, $k$155_32 = 0.0, $k$158_41 = 0.0, $k$159_42 = 0.0, $k$161_101 = 0.0, $k$162_111 = 0.0, $k$163_112 = 0.0, $k$165_126 = 0.0, $k$168_282 = 0.0, $k$169_291 = 0.0, $k$173_302 = 0.0, $lg_11 = 0, $ng_12 = 0, $r_14 = 0, $r_addr = 0, $rs_197 = 0.0, $rs_241 = 0.0, $sh_27 = 0, $sh_addr = 0;
 var $sk_29 = 0, $sk_addr = 0, $sn_59 = 0.0, $sn_82 = 0.0, $toBool = 0, $toBool8 = 0, $xs$167_194 = 0.0, $xs_239 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 96|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $h = sp + 72|0;
 $k = sp + 64|0;
 $D$1840 = sp + 48|0;
 $D$1839 = sp + 40|0;
 $D$1846 = sp + 32|0;
 $D$1859 = sp + 24|0;
 $D$1863 = sp + 16|0;
 $D$1862 = sp + 8|0;
 $sh_addr = $sh;
 $sk_addr = $sk;
 $r_addr = $r;
 $r_14 = $r_addr;
 $sh_27 = $sh_addr;
 $sk_29 = $sk_addr;
 $D$2864_15 = +HEAPF64[$r_14>>3];
 $D$2865_16 = (+Math_abs((+$D$2864_15)));
 $D$2866_17 = $D$2865_16 < 0.30000001192092896;
 $D$2866_17$expand_i1_val = $D$2866_17&1;
 $$expand_i1_val = 0;
 $0 = ($D$2866_17$expand_i1_val<<24>>24)!=($$expand_i1_val<<24>>24);
 do {
  if ($0) {
   $lg_11 = 3;$ng_12 = 1;
  } else {
   $D$2870_20 = +HEAPF64[$r_14>>3];
   $D$2871_21 = (+Math_abs((+$D$2870_20)));
   $D$2872_22 = $D$2871_21 < 0.75;
   $D$2872_22$expand_i1_val = $D$2872_22&1;
   $$expand_i1_val1 = 0;
   $1 = ($D$2872_22$expand_i1_val<<24>>24)!=($$expand_i1_val1<<24>>24);
   if ($1) {
    $lg_11 = 6;$ng_12 = 2;
    break;
   } else {
    $lg_11 = 10;$ng_12 = 3;
    break;
   }
  }
 } while(0);
 $h$152_28 = +HEAPF64[$sh_27>>3];
 HEAPF64[$h>>3] = $h$152_28;
 $k$153_30 = +HEAPF64[$sk_29>>3];
 HEAPF64[$k>>3] = $k$153_30;
 $h$154_31 = +HEAPF64[$h>>3];
 $k$155_32 = +HEAPF64[$k>>3];
 $hk_33 = $h$154_31 * $k$155_32;
 $D$2880_35 = +HEAPF64[$r_14>>3];
 $D$2881_36 = (+Math_abs((+$D$2880_35)));
 $D$2882_37 = $D$2881_36 < 0.92500001192092896;
 $D$2882_37$expand_i1_val = $D$2882_37&1;
 $$expand_i1_val2 = 0;
 $2 = ($D$2882_37$expand_i1_val<<24>>24)!=($$expand_i1_val2<<24>>24);
 do {
  if ($2) {
   $h$156_38 = +HEAPF64[$h>>3];
   $h$157_39 = +HEAPF64[$h>>3];
   $D$2887_40 = $h$156_38 * $h$157_39;
   $k$158_41 = +HEAPF64[$k>>3];
   $k$159_42 = +HEAPF64[$k>>3];
   $D$2890_43 = $k$158_41 * $k$159_42;
   $D$2891_44 = $D$2887_40 + $D$2890_43;
   $hs_46 = $D$2891_44 / 2.0;
   $D$2893_47 = +HEAPF64[$r_14>>3];
   $asr_48 = (+Math_asin((+$D$2893_47)));
   $3 = (1)<=($lg_11|0);
   L36: do {
    if ($3) {
     $bvn_1 = 0.0;$i_9 = 1;
     while(1) {
      $D$2897_51 = ($ng_12*10)|0;
      $D$2898_52 = (($D$2897_51) + ($i_9))|0;
      $D$2899_53 = (($D$2898_52) + -11)|0;
      $ar = (1023528 + ($D$2899_53<<3)|0);
      HEAP32[tempDoublePtr>>2]=HEAP32[$ar>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar+4>>2];$D$2900_54 = +HEAPF64[tempDoublePtr>>3];
      $D$2901_55 = $D$2900_54 + 1.0;
      $D$2903_57 = $D$2901_55 * $asr_48;
      $D$2904_58 = $D$2903_57 / 2.0;
      $sn_59 = (+Math_sin((+$D$2904_58)));
      $D$2905_60 = ($ng_12*10)|0;
      $D$2906_61 = (($D$2905_60) + ($i_9))|0;
      $D$2907_62 = (($D$2906_61) + -11)|0;
      $ar1 = (1023288 + ($D$2907_62<<3)|0);
      HEAP32[tempDoublePtr>>2]=HEAP32[$ar1>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar1+4>>2];$D$2908_63 = +HEAPF64[tempDoublePtr>>3];
      $D$2909_64 = $sn_59 * $hk_33;
      $D$2910_65 = $D$2909_64 - $hs_46;
      $D$2912_67 = $sn_59 * $sn_59;
      $D$2913_68 = 1.0 - $D$2912_67;
      $D$2915_70 = $D$2910_65 / $D$2913_68;
      $D$2916_71 = (+Math_exp((+$D$2915_70)));
      $D$2917_72 = $D$2908_63 * $D$2916_71;
      $bvn_73 = $D$2917_72 + $bvn_1;
      $D$2918_74 = ($ng_12*10)|0;
      $D$2919_75 = (($D$2918_74) + ($i_9))|0;
      $D$2920_76 = (($D$2919_75) + -11)|0;
      $ar2 = (1023528 + ($D$2920_76<<3)|0);
      HEAP32[tempDoublePtr>>2]=HEAP32[$ar2>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar2+4>>2];$D$2921_77 = +HEAPF64[tempDoublePtr>>3];
      $D$2922_78 = 1.0 - $D$2921_77;
      $D$2924_80 = $D$2922_78 * $asr_48;
      $D$2925_81 = $D$2924_80 / 2.0;
      $sn_82 = (+Math_sin((+$D$2925_81)));
      $D$2926_83 = ($ng_12*10)|0;
      $D$2927_84 = (($D$2926_83) + ($i_9))|0;
      $D$2928_85 = (($D$2927_84) + -11)|0;
      $ar3 = (1023288 + ($D$2928_85<<3)|0);
      HEAP32[tempDoublePtr>>2]=HEAP32[$ar3>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar3+4>>2];$D$2929_86 = +HEAPF64[tempDoublePtr>>3];
      $D$2930_87 = $sn_82 * $hk_33;
      $D$2931_88 = $D$2930_87 - $hs_46;
      $D$2933_90 = $sn_82 * $sn_82;
      $D$2934_91 = 1.0 - $D$2933_90;
      $D$2936_93 = $D$2931_88 / $D$2934_91;
      $D$2937_94 = (+Math_exp((+$D$2936_93)));
      $D$2938_95 = $D$2929_86 * $D$2937_94;
      $bvn_96 = $D$2938_95 + $bvn_73;
      $D$1838_97 = ($i_9|0)==($lg_11|0);
      $i_98 = (($i_9) + 1)|0;
      $D$1838_97$expand_i1_val = $D$1838_97&1;
      $$expand_i1_val3 = 0;
      $4 = ($D$1838_97$expand_i1_val<<24>>24)!=($$expand_i1_val3<<24>>24);
      if ($4) {
       $bvn_2 = $bvn_96;
       break L36;
      }
      $bvn_1 = $bvn_96;$i_9 = $i_98;
     }
    } else {
     $bvn_2 = 0.0;
    }
   } while(0);
   $h$160_99 = +HEAPF64[$h>>3];
   $D$2941_100 = -$h$160_99;
   HEAPF64[$D$1839>>3] = $D$2941_100;
   $k$161_101 = +HEAPF64[$k>>3];
   $D$2943_102 = -$k$161_101;
   HEAPF64[$D$1840>>3] = $D$2943_102;
   $D$2944_103 = $bvn_2 * $asr_48;
   $D$2945_104 = $D$2944_103 / 12.566370614359172;
   $D$2946_105 = (+_mvnphi_($D$1839));
   $D$2947_106 = (+_mvnphi_($D$1840));
   $D$2948_107 = $D$2946_105 * $D$2947_106;
   $bvn_108 = $D$2945_104 + $D$2948_107;
   $bvn_7 = $bvn_108;
  } else {
   $D$2950_109 = +HEAPF64[$r_14>>3];
   $D$2951_110 = $D$2950_109 < 0.0;
   $D$2951_110$expand_i1_val = $D$2951_110&1;
   $$expand_i1_val4 = 0;
   $5 = ($D$2951_110$expand_i1_val<<24>>24)!=($$expand_i1_val4<<24>>24);
   if ($5) {
    $k$162_111 = +HEAPF64[$k>>3];
    $k$163_112 = -$k$162_111;
    HEAPF64[$k>>3] = $k$163_112;
    $hk_113 = -$hk_33;
    $hk_8 = $hk_113;
   } else {
    $hk_8 = $hk_33;
   }
   $D$2957_114 = +HEAPF64[$r_14>>3];
   $D$2958_115 = (+Math_abs((+$D$2957_114)));
   $D$2959_116 = $D$2958_115 < 1.0;
   $D$2959_116$expand_i1_val = $D$2959_116&1;
   $$expand_i1_val5 = 0;
   $6 = ($D$2959_116$expand_i1_val<<24>>24)!=($$expand_i1_val5<<24>>24);
   if ($6) {
    $D$2962_117 = +HEAPF64[$r_14>>3];
    $D$2963_118 = 1.0 - $D$2962_117;
    $D$2965_120 = +HEAPF64[$r_14>>3];
    $D$2966_121 = $D$2965_120 + 1.0;
    $as_123 = $D$2963_118 * $D$2966_121;
    $a_124 = (+Math_sqrt((+$as_123)));
    $h$164_125 = +HEAPF64[$h>>3];
    $k$165_126 = +HEAPF64[$k>>3];
    $D$2970_127 = $h$164_125 - $k$165_126;
    $bs$166_129 = $D$2970_127 * $D$2970_127;
    $D$2971_131 = 4.0 - $hk_8;
    $c_133 = $D$2971_131 / 8.0;
    $D$2973_134 = 12.0 - $hk_8;
    $d_136 = $D$2973_134 / 16.0;
    $D$2975_137 = $bs$166_129 / $as_123;
    $D$2976_138 = $D$2975_137 + $hk_8;
    $D$2978_140 = $D$2976_138 / 2.0;
    $D$2979_141 = -$D$2978_140;
    $D$2980_142 = (+Math_exp((+$D$2979_141)));
    $D$2981_143 = $D$2980_142 * $a_124;
    $D$2982_144 = $bs$166_129 - $as_123;
    $D$2984_146 = $D$2982_144 * $c_133;
    $D$2985_147 = $d_136 * $bs$166_129;
    $D$2986_148 = $D$2985_147 / 5.0;
    $D$2987_149 = 1.0 - $D$2986_148;
    $D$2989_151 = $D$2984_146 * $D$2987_149;
    $D$2990_152 = $D$2989_151 / 3.0;
    $D$2991_153 = 1.0 - $D$2990_152;
    $D$2992_154 = $c_133 * $d_136;
    $D$2993_155 = $D$2992_154 * $as_123;
    $D$2994_156 = $D$2993_155 * $as_123;
    $D$2995_157 = $D$2994_156 / 5.0;
    $D$2996_158 = $D$2991_153 + $D$2995_157;
    $bvn_160 = $D$2981_143 * $D$2996_158;
    $D$2998_161 = $hk_8 > -160.0;
    $D$2998_161$expand_i1_val = $D$2998_161&1;
    $$expand_i1_val6 = 0;
    $7 = ($D$2998_161$expand_i1_val<<24>>24)!=($$expand_i1_val6<<24>>24);
    if ($7) {
     $b_162 = (+Math_sqrt((+$bs$166_129)));
     $D$3001_163 = $b_162 / $a_124;
     $D$3002_164 = -$D$3001_163;
     HEAPF64[$D$1846>>3] = $D$3002_164;
     $D$3003_165 = $hk_8 / 2.0;
     $D$3004_166 = -$D$3003_165;
     $D$3005_167 = (+Math_exp((+$D$3004_166)));
     $D$3006_168 = $D$3005_167 * 2.5066282746310002;
     $D$3007_169 = (+_mvnphi_($D$1846));
     $D$3008_170 = $D$3006_168 * $D$3007_169;
     $D$3009_171 = $D$3008_170 * $b_162;
     $D$3010_172 = $c_133 * $bs$166_129;
     $D$3011_173 = $d_136 * $bs$166_129;
     $D$3012_174 = $D$3011_173 / 5.0;
     $D$3013_175 = 1.0 - $D$3012_174;
     $D$3015_177 = $D$3010_172 * $D$3013_175;
     $D$3016_178 = $D$3015_177 / 3.0;
     $D$3017_179 = 1.0 - $D$3016_178;
     $D$3019_181 = $D$3009_171 * $D$3017_179;
     $bvn_182 = $bvn_160 - $D$3019_181;
     $bvn_3 = $bvn_182;
    } else {
     $bvn_3 = $bvn_160;
    }
    $a_183 = $a_124 / 2.0;
    $8 = (1)<=($lg_11|0);
    L19: do {
     if ($8) {
      $bvn_4 = $bvn_3;$i_10 = 1;
      while(1) {
       $D$3024_186 = ($ng_12*10)|0;
       $D$3025_187 = (($D$3024_186) + ($i_10))|0;
       $D$3026_188 = (($D$3025_187) + -11)|0;
       $ar4 = (1023528 + ($D$3026_188<<3)|0);
       HEAP32[tempDoublePtr>>2]=HEAP32[$ar4>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar4+4>>2];$D$3027_189 = +HEAPF64[tempDoublePtr>>3];
       $D$3028_190 = $D$3027_189 + 1.0;
       $D$3030_192 = $D$3028_190 * $a_183;
       $xs$167_194 = $D$3030_192 * $D$3030_192;
       $D$3031_196 = 1.0 - $xs$167_194;
       $rs_197 = (+Math_sqrt((+$D$3031_196)));
       $D$3032_198 = ($ng_12*10)|0;
       $D$3033_199 = (($D$3032_198) + ($i_10))|0;
       $D$3034_200 = (($D$3033_199) + -11)|0;
       $ar5 = (1023288 + ($D$3034_200<<3)|0);
       HEAP32[tempDoublePtr>>2]=HEAP32[$ar5>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar5+4>>2];$D$3035_201 = +HEAPF64[tempDoublePtr>>3];
       $D$3036_202 = $D$3035_201 * $a_183;
       $D$3037_203 = $xs$167_194 * 2.0;
       $D$3039_205 = $bs$166_129 / $D$3037_203;
       $D$3040_206 = -$D$3039_205;
       $D$3041_207 = $rs_197 + 1.0;
       $D$3043_209 = $hk_8 / $D$3041_207;
       $D$3044_210 = $D$3040_206 - $D$3043_209;
       $D$3045_211 = (+Math_exp((+$D$3044_210)));
       $D$3046_212 = $D$3045_211 / $rs_197;
       $D$3047_213 = $bs$166_129 / $xs$167_194;
       $D$3048_214 = $D$3047_213 + $hk_8;
       $D$3050_216 = $D$3048_214 / 2.0;
       $D$3051_217 = -$D$3050_216;
       $D$3052_218 = (+Math_exp((+$D$3051_217)));
       $D$3053_219 = $c_133 * $xs$167_194;
       $D$3054_220 = $d_136 * $xs$167_194;
       $D$3055_221 = $D$3054_220 + 1.0;
       $D$3057_223 = $D$3053_219 * $D$3055_221;
       $D$3058_224 = $D$3057_223 + 1.0;
       $D$3060_226 = $D$3052_218 * $D$3058_224;
       $D$3061_227 = $D$3046_212 - $D$3060_226;
       $D$3063_229 = $D$3036_202 * $D$3061_227;
       $bvn_230 = $D$3063_229 + $bvn_4;
       $D$3064_231 = ($ng_12*10)|0;
       $D$3065_232 = (($D$3064_231) + ($i_10))|0;
       $D$3066_233 = (($D$3065_232) + -11)|0;
       $ar6 = (1023528 + ($D$3066_233<<3)|0);
       HEAP32[tempDoublePtr>>2]=HEAP32[$ar6>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar6+4>>2];$D$3067_234 = +HEAPF64[tempDoublePtr>>3];
       $D$3068_235 = 1.0 - $D$3067_234;
       $D$1853_237 = $D$3068_235 * $D$3068_235;
       $D$3069_238 = $as_123 * $D$1853_237;
       $xs_239 = $D$3069_238 / 4.0;
       $D$3070_240 = 1.0 - $xs_239;
       $rs_241 = (+Math_sqrt((+$D$3070_240)));
       $D$3071_242 = $rs_241 + 1.0;
       $D$1855_244 = $D$3071_242 * $D$3071_242;
       $D$3072_245 = ($ng_12*10)|0;
       $D$3073_246 = (($D$3072_245) + ($i_10))|0;
       $D$3074_247 = (($D$3073_246) + -11)|0;
       $ar7 = (1023288 + ($D$3074_247<<3)|0);
       HEAP32[tempDoublePtr>>2]=HEAP32[$ar7>>2];HEAP32[tempDoublePtr+4>>2]=HEAP32[$ar7+4>>2];$D$3075_248 = +HEAPF64[tempDoublePtr>>3];
       $D$3076_249 = $D$3075_248 * $a_183;
       $D$3077_250 = $bs$166_129 / $xs_239;
       $D$3078_251 = $D$3077_250 + $hk_8;
       $D$3080_253 = $D$3078_251 / 2.0;
       $D$3081_254 = -$D$3080_253;
       $D$3082_255 = (+Math_exp((+$D$3081_254)));
       $D$3083_256 = $D$3076_249 * $D$3082_255;
       $D$3084_257 = $hk_8 * $xs_239;
       $D$3085_258 = $D$1855_244 * 2.0;
       $D$3087_260 = $D$3084_257 / $D$3085_258;
       $D$3088_261 = -$D$3087_260;
       $D$3089_262 = (+Math_exp((+$D$3088_261)));
       $D$3090_263 = $D$3089_262 / $rs_241;
       $D$3091_264 = $c_133 * $xs_239;
       $D$3092_265 = $d_136 * $xs_239;
       $D$3093_266 = $D$3092_265 + 1.0;
       $D$3095_268 = $D$3091_264 * $D$3093_266;
       $D$3096_269 = $D$3095_268 + 1.0;
       $D$3098_271 = $D$3090_263 - $D$3096_269;
       $D$3100_273 = $D$3083_256 * $D$3098_271;
       $bvn_274 = $D$3100_273 + $bvn_230;
       $D$1856_275 = ($i_10|0)==($lg_11|0);
       $i_276 = (($i_10) + 1)|0;
       $D$1856_275$expand_i1_val = $D$1856_275&1;
       $$expand_i1_val7 = 0;
       $9 = ($D$1856_275$expand_i1_val<<24>>24)!=($$expand_i1_val7<<24>>24);
       if ($9) {
        $bvn_5 = $bvn_274;
        break L19;
       }
       $bvn_4 = $bvn_274;$i_10 = $i_276;
      }
     } else {
      $bvn_5 = $bvn_3;
     }
    } while(0);
    $D$3102_277 = $bvn_5 / 6.2831853071795862;
    $bvn_278 = -$D$3102_277;
    $bvn_6 = $bvn_278;
   } else {
    $bvn_6 = 0.0;
   }
   $D$3104_279 = +HEAPF64[$r_14>>3];
   $D$3105_280 = $D$3104_279 > 0.0;
   $D$3105_280$expand_i1_val = $D$3105_280&1;
   $$expand_i1_val8 = 0;
   $10 = ($D$3105_280$expand_i1_val<<24>>24)!=($$expand_i1_val8<<24>>24);
   if ($10) {
    $M$14_281 = +HEAPF64[$h>>3];
    $k$168_282 = +HEAPF64[$k>>3];
    $D$3109_283 = $k$168_282 > $M$14_281;
    $D$3110_284 = ($M$14_281 != $M$14_281) | ($M$14_281 != $M$14_281);
    $D$3109_283$expand_i1_val = $D$3109_283&1;
    $$expand_i1_val9 = 0;
    $toBool = ($D$3109_283$expand_i1_val<<24>>24)!=($$expand_i1_val9<<24>>24);
    $D$3110_284$expand_i1_val = $D$3110_284&1;
    $$expand_i1_val10 = 0;
    $toBool8 = ($D$3110_284$expand_i1_val<<24>>24)!=($$expand_i1_val10<<24>>24);
    $D$3111_285 = $toBool | $toBool8;
    $D$3111_285$expand_i1_val = $D$3111_285&1;
    $$expand_i1_val11 = 0;
    $11 = ($D$3111_285$expand_i1_val<<24>>24)!=($$expand_i1_val11<<24>>24);
    if ($11) {
     $M$14_286 = +HEAPF64[$k>>3];
     $M$14_13 = $M$14_286;
    } else {
     $M$14_13 = $M$14_281;
    }
    $D$3115_287 = -$M$14_13;
    HEAPF64[$D$1859>>3] = $D$3115_287;
    $D$3116_288 = (+_mvnphi_($D$1859));
    $bvn_289 = $D$3116_288 + $bvn_6;
    $bvn_7 = $bvn_289;
    break;
   }
   $bvn_290 = -$bvn_6;
   $k$169_291 = +HEAPF64[$k>>3];
   $h$170_292 = +HEAPF64[$h>>3];
   $D$3120_293 = $k$169_291 > $h$170_292;
   $D$3120_293$expand_i1_val = $D$3120_293&1;
   $$expand_i1_val12 = 0;
   $12 = ($D$3120_293$expand_i1_val<<24>>24)!=($$expand_i1_val12<<24>>24);
   if ($12) {
    $h$171_294 = +HEAPF64[$h>>3];
    $D$3124_295 = $h$171_294 < 0.0;
    $D$3124_295$expand_i1_val = $D$3124_295&1;
    $$expand_i1_val13 = 0;
    $13 = ($D$3124_295$expand_i1_val<<24>>24)!=($$expand_i1_val13<<24>>24);
    if ($13) {
     $D$3127_296 = (+_mvnphi_($k));
     $D$3128_297 = $D$3127_296 + $bvn_290;
     $D$3129_298 = (+_mvnphi_($h));
     $bvn_299 = $D$3128_297 - $D$3129_298;
     $bvn_7 = $bvn_299;
     break;
    } else {
     $h$172_300 = +HEAPF64[$h>>3];
     $D$3132_301 = -$h$172_300;
     HEAPF64[$D$1862>>3] = $D$3132_301;
     $k$173_302 = +HEAPF64[$k>>3];
     $D$3134_303 = -$k$173_302;
     HEAPF64[$D$1863>>3] = $D$3134_303;
     $D$3135_304 = (+_mvnphi_($D$1862));
     $D$3136_305 = $D$3135_304 + $bvn_290;
     $D$3137_306 = (+_mvnphi_($D$1863));
     $bvn_307 = $D$3136_305 - $D$3137_306;
     $bvn_7 = $bvn_307;
     break;
    }
   } else {
    $bvn_7 = $bvn_290;
   }
  }
 } while(0);
 $__result_bvu = $bvn_7;
 $D$3139_308 = $__result_bvu;
 $$retval$3C3E = $D$3139_308;
 $14 = $$retval$3C3E;
 STACKTOP = sp;return (+$14);
}
function _rcswp_($p,$q,$a,$b,$infin,$n,$c) {
 $p = $p|0;
 $q = $q|0;
 $a = $a|0;
 $b = $b|0;
 $infin = $infin|0;
 $n = $n|0;
 $c = $c|0;
 var $$expand_i1_val = 0, $$expand_i1_val1 = 0, $$expand_i1_val2 = 0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $D$2027_53 = 0, $D$2030_61 = 0, $D$2030_61$expand_i1_val = 0, $D$2032_68 = 0, $D$2035_78 = 0, $D$2035_78$expand_i1_val = 0, $D$2037_85 = 0, $D$2040_96 = 0, $D$2040_96$expand_i1_val = 0, $D$2317_7 = 0, $D$2318_8 = 0;
 var $D$2320_12 = 0, $D$2321_13 = 0, $D$2323_15 = 0, $D$2324_16 = 0, $D$2326_19 = 0, $D$2327_20 = 0, $D$2329_22 = 0, $D$2330_23 = 0, $D$2331_26 = 0, $D$2332_27 = 0, $D$2333_28 = 0, $D$2334_29 = 0, $D$2335_30 = 0, $D$2336_31 = 0, $D$2337_32 = 0, $D$2338_33 = 0, $D$2339_34 = 0, $D$2340_35 = 0, $D$2341_36 = 0, $D$2342_38 = 0;
 var $D$2343_39 = 0, $D$2344_40 = 0, $D$2345_41 = 0, $D$2346_43 = 0, $D$2347_44 = 0, $D$2348_45 = 0, $D$2350_48 = 0, $D$2351_49 = 0, $D$2352_50 = 0, $D$2354_52 = 0, $D$2358_55 = 0, $D$2359_56 = 0, $D$2361_58 = 0, $D$2362_59 = 0, $D$2365_63 = 0, $D$2366_65 = 0, $D$2367_67 = 0, $D$2371_70 = 0, $D$2372_71 = 0, $D$2374_73 = 0;
 var $D$2375_74 = 0, $D$2376_75 = 0, $D$2379_80 = 0, $D$2380_82 = 0, $D$2384_87 = 0, $D$2385_88 = 0, $D$2386_89 = 0, $D$2388_91 = 0, $D$2389_92 = 0, $D$2390_93 = 0, $a_9 = 0, $a_addr = 0, $ar = 0, $ar1 = 0, $ar10 = 0, $ar11 = 0, $ar12 = 0, $ar13 = 0, $ar14 = 0, $ar15 = 0;
 var $ar2 = 0, $ar3 = 0, $ar4 = 0, $ar5 = 0, $ar6 = 0, $ar7 = 0, $ar8 = 0, $ar9 = 0, $b_17 = 0, $b_addr = 0, $c_46 = 0, $c_addr = 0, $i$26_66 = 0, $i$27_83 = 0, $i_1 = 0, $i_2 = 0, $i_79 = 0, $i_97 = 0, $ii_3 = 0, $ii_42 = 0;
 var $ii_81 = 0, $ii_95 = 0, $infin_24 = 0, $infin_addr = 0, $j_25 = 0, $j_4 = 0, $j_62 = 0, $jj_37 = 0, $jj_5 = 0, $jj_64 = 0, $jj_77 = 0, $n_84 = 0, $n_addr = 0, $p_11 = 0, $p_addr = 0, $q_6 = 0, $q_addr = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $p_addr = $p;
 $q_addr = $q;
 $a_addr = $a;
 $b_addr = $b;
 $infin_addr = $infin;
 $n_addr = $n;
 $c_addr = $c;
 $q_6 = $q_addr;
 $a_9 = $a_addr;
 $p_11 = $p_addr;
 $b_17 = $b_addr;
 $infin_24 = $infin_addr;
 $c_46 = $c_addr;
 $n_84 = $n_addr;
 $D$2317_7 = HEAP32[$q_6>>2]|0;
 $D$2318_8 = (($D$2317_7) + -1)|0;
 $ar = (($a_9) + ($D$2318_8<<3)|0);
 $D$2320_12 = HEAP32[$p_11>>2]|0;
 $D$2321_13 = (($D$2320_12) + -1)|0;
 $ar1 = (($a_9) + ($D$2321_13<<3)|0);
 _dkswap_($ar1,$ar);
 $D$2323_15 = HEAP32[$q_6>>2]|0;
 $D$2324_16 = (($D$2323_15) + -1)|0;
 $ar2 = (($b_17) + ($D$2324_16<<3)|0);
 $D$2326_19 = HEAP32[$p_11>>2]|0;
 $D$2327_20 = (($D$2326_19) + -1)|0;
 $ar3 = (($b_17) + ($D$2327_20<<3)|0);
 _dkswap_($ar3,$ar2);
 $D$2329_22 = HEAP32[$p_11>>2]|0;
 $D$2330_23 = (($D$2329_22) + -1)|0;
 $ar4 = (($infin_24) + ($D$2330_23<<2)|0);
 $j_25 = HEAP32[$ar4>>2]|0;
 $D$2331_26 = HEAP32[$p_11>>2]|0;
 $D$2332_27 = (($D$2331_26) + -1)|0;
 $D$2333_28 = HEAP32[$q_6>>2]|0;
 $D$2334_29 = (($D$2333_28) + -1)|0;
 $ar5 = (($infin_24) + ($D$2334_29<<2)|0);
 $D$2335_30 = HEAP32[$ar5>>2]|0;
 $ar6 = (($infin_24) + ($D$2332_27<<2)|0);
 HEAP32[$ar6>>2] = $D$2335_30;
 $D$2336_31 = HEAP32[$q_6>>2]|0;
 $D$2337_32 = (($D$2336_31) + -1)|0;
 $ar7 = (($infin_24) + ($D$2337_32<<2)|0);
 HEAP32[$ar7>>2] = $j_25;
 $D$2338_33 = HEAP32[$p_11>>2]|0;
 $D$2339_34 = HEAP32[$p_11>>2]|0;
 $D$2340_35 = (($D$2339_34) + -1)|0;
 $D$2341_36 = Math_imul($D$2338_33, $D$2340_35)|0;
 $jj_37 = (($D$2341_36|0) / 2)&-1;
 $D$2342_38 = HEAP32[$q_6>>2]|0;
 $D$2343_39 = HEAP32[$q_6>>2]|0;
 $D$2344_40 = (($D$2343_39) + -1)|0;
 $D$2345_41 = Math_imul($D$2342_38, $D$2344_40)|0;
 $ii_42 = (($D$2345_41|0) / 2)&-1;
 $D$2346_43 = HEAP32[$q_6>>2]|0;
 $D$2347_44 = (($D$2346_43) + ($ii_42))|0;
 $D$2348_45 = (($D$2347_44) + -1)|0;
 $ar8 = (($c_46) + ($D$2348_45<<3)|0);
 $D$2350_48 = HEAP32[$p_11>>2]|0;
 $D$2351_49 = (($D$2350_48) + ($jj_37))|0;
 $D$2352_50 = (($D$2351_49) + -1)|0;
 $ar9 = (($c_46) + ($D$2352_50<<3)|0);
 _dkswap_($ar9,$ar8);
 $D$2354_52 = HEAP32[$p_11>>2]|0;
 $D$2027_53 = (($D$2354_52) + -1)|0;
 $0 = (1)<=($D$2027_53|0);
 L2: do {
  if ($0) {
   $j_4 = 1;
   while(1) {
    $D$2358_55 = (($ii_42) + ($j_4))|0;
    $D$2359_56 = (($D$2358_55) + -1)|0;
    $ar10 = (($c_46) + ($D$2359_56<<3)|0);
    $D$2361_58 = (($jj_37) + ($j_4))|0;
    $D$2362_59 = (($D$2361_58) + -1)|0;
    $ar11 = (($c_46) + ($D$2362_59<<3)|0);
    _dkswap_($ar11,$ar10);
    $D$2030_61 = ($j_4|0)==($D$2027_53|0);
    $j_62 = (($j_4) + 1)|0;
    $D$2030_61$expand_i1_val = $D$2030_61&1;
    $$expand_i1_val = 0;
    $1 = ($D$2030_61$expand_i1_val<<24>>24)!=($$expand_i1_val<<24>>24);
    if ($1) {
     break L2;
    }
    $j_4 = $j_62;
   }
  }
 } while(0);
 $D$2365_63 = HEAP32[$p_11>>2]|0;
 $jj_64 = (($D$2365_63) + ($jj_37))|0;
 $D$2366_65 = HEAP32[$p_11>>2]|0;
 $i$26_66 = (($D$2366_65) + 1)|0;
 $D$2367_67 = HEAP32[$q_6>>2]|0;
 $D$2032_68 = (($D$2367_67) + -1)|0;
 $2 = ($i$26_66|0)<=($D$2032_68|0);
 L7: do {
  if ($2) {
   $i_1 = $i$26_66;$jj_5 = $jj_64;
   while(1) {
    $D$2371_70 = (($ii_42) + ($i_1))|0;
    $D$2372_71 = (($D$2371_70) + -1)|0;
    $ar12 = (($c_46) + ($D$2372_71<<3)|0);
    $D$2374_73 = HEAP32[$p_11>>2]|0;
    $D$2375_74 = (($D$2374_73) + ($jj_5))|0;
    $D$2376_75 = (($D$2375_74) + -1)|0;
    $ar13 = (($c_46) + ($D$2376_75<<3)|0);
    _dkswap_($ar13,$ar12);
    $jj_77 = (($jj_5) + ($i_1))|0;
    $D$2035_78 = ($i_1|0)==($D$2032_68|0);
    $i_79 = (($i_1) + 1)|0;
    $D$2035_78$expand_i1_val = $D$2035_78&1;
    $$expand_i1_val1 = 0;
    $3 = ($D$2035_78$expand_i1_val<<24>>24)!=($$expand_i1_val1<<24>>24);
    if ($3) {
     break L7;
    }
    $i_1 = $i_79;$jj_5 = $jj_77;
   }
  }
 } while(0);
 $D$2379_80 = HEAP32[$q_6>>2]|0;
 $ii_81 = (($D$2379_80) + ($ii_42))|0;
 $D$2380_82 = HEAP32[$q_6>>2]|0;
 $i$27_83 = (($D$2380_82) + 1)|0;
 $D$2037_85 = HEAP32[$n_84>>2]|0;
 $4 = ($i$27_83|0)<=($D$2037_85|0);
 L12: do {
  if ($4) {
   $i_2 = $i$27_83;$ii_3 = $ii_81;
   while(1) {
    $D$2384_87 = HEAP32[$q_6>>2]|0;
    $D$2385_88 = (($D$2384_87) + ($ii_3))|0;
    $D$2386_89 = (($D$2385_88) + -1)|0;
    $ar14 = (($c_46) + ($D$2386_89<<3)|0);
    $D$2388_91 = HEAP32[$p_11>>2]|0;
    $D$2389_92 = (($D$2388_91) + ($ii_3))|0;
    $D$2390_93 = (($D$2389_92) + -1)|0;
    $ar15 = (($c_46) + ($D$2390_93<<3)|0);
    _dkswap_($ar15,$ar14);
    $ii_95 = (($ii_3) + ($i_2))|0;
    $D$2040_96 = ($i_2|0)==($D$2037_85|0);
    $i_97 = (($i_2) + 1)|0;
    $D$2040_96$expand_i1_val = $D$2040_96&1;
    $$expand_i1_val2 = 0;
    $5 = ($D$2040_96$expand_i1_val<<24>>24)!=($$expand_i1_val2<<24>>24);
    if ($5) {
     break L12;
    }
    $i_2 = $i_97;$ii_3 = $ii_95;
   }
  }
 } while(0);
 STACKTOP = sp;return;
}
function _dkswap_($x,$y) {
 $x = $x|0;
 $y = $y|0;
 var $D$2393_4 = 0.0, $t_2 = 0.0, $x_1 = 0, $x_addr = 0, $y_3 = 0, $y_addr = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $x_addr = $x;
 $y_addr = $y;
 $x_1 = $x_addr;
 $y_3 = $y_addr;
 $t_2 = +HEAPF64[$x_1>>3];
 $D$2393_4 = +HEAPF64[$y_3>>3];
 HEAPF64[$x_1>>3] = $D$2393_4;
 HEAPF64[$y_3>>3] = $t_2;
 STACKTOP = sp;return;
}
function _mvndst_($n,$lower,$upper,$infin,$correl,$maxpts,$abseps,$releps,$error,$value,$inform) {
 $n = $n|0;
 $lower = $lower|0;
 $upper = $upper|0;
 $infin = $infin|0;
 $correl = $correl|0;
 $maxpts = $maxpts|0;
 $abseps = $abseps|0;
 $releps = $releps|0;
 $error = $error|0;
 $value = $value|0;
 $inform = $inform|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $D$2125 = 0, $D$2129_2 = 0, $D$2131_3 = 0, $D$2132_8 = 0.0, $D$2133_9 = 0, $D$2134_11 = 0, $D$2139_15 = 0, $D$2141_17 = 0, $D$2146_20 = 0.0, $D$2148_21 = 0, $D$2150_23 = 0, $D$2151_24 = 0, $abseps_26 = 0, $abseps_addr = 0, $correl_4 = 0, $correl_addr = 0;
 var $d = 0, $d$19_19 = 0.0, $e = 0, $e$18_18 = 0.0, $error_14 = 0, $error_addr = 0, $infin_7 = 0, $infin_addr = 0, $infis = 0, $infis$16_12 = 0, $infis$17_16 = 0, $infis$20_22 = 0, $inform_10 = 0, $inform_addr = 0, $lower_5 = 0, $lower_addr = 0, $maxpts_25 = 0, $maxpts_addr = 0, $n_1 = 0, $n_addr = 0;
 var $releps_27 = 0, $releps_addr = 0, $upper_6 = 0, $upper_addr = 0, $value_13 = 0, $value_addr = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 80|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $d = sp + 8|0;
 $e = sp;
 $infis = sp + 20|0;
 $D$2125 = sp + 16|0;
 $n_addr = $n;
 $lower_addr = $lower;
 $upper_addr = $upper;
 $infin_addr = $infin;
 $correl_addr = $correl;
 $maxpts_addr = $maxpts;
 $abseps_addr = $abseps;
 $releps_addr = $releps;
 $error_addr = $error;
 $value_addr = $value;
 $inform_addr = $inform;
 $n_1 = $n_addr;
 $inform_10 = $inform_addr;
 $value_13 = $value_addr;
 $error_14 = $error_addr;
 $correl_4 = $correl_addr;
 $lower_5 = $lower_addr;
 $upper_6 = $upper_addr;
 $infin_7 = $infin_addr;
 $maxpts_25 = $maxpts_addr;
 $abseps_26 = $abseps_addr;
 $releps_27 = $releps_addr;
 $D$2129_2 = HEAP32[$n_1>>2]|0;
 $0 = ($D$2129_2|0)>(500);
 do {
  if ($0) {
   label = 4;
  } else {
   $D$2131_3 = HEAP32[$n_1>>2]|0;
   $1 = ($D$2131_3|0)<=(0);
   if ($1) {
    label = 4;
   } else {
    $D$2132_8 = (+_mvndnt_($n_1,$correl_4,$lower_5,$upper_6,$infin_7,$infis,$d,$e));
    $D$2133_9 = (~~(($D$2132_8)));
    HEAP32[$inform_10>>2] = $D$2133_9;
    $D$2134_11 = HEAP32[$n_1>>2]|0;
    $infis$16_12 = HEAP32[$infis>>2]|0;
    $2 = ($D$2134_11|0)==($infis$16_12|0);
    if ($2) {
     HEAPF64[$value_13>>3] = 1.0;
     HEAPF64[$error_14>>3] = 0.0;
     break;
    }
    $D$2139_15 = HEAP32[$n_1>>2]|0;
    $infis$17_16 = HEAP32[$infis>>2]|0;
    $D$2141_17 = (($D$2139_15) - ($infis$17_16))|0;
    $3 = ($D$2141_17|0)==(1);
    if ($3) {
     $e$18_18 = +HEAPF64[$e>>3];
     $d$19_19 = +HEAPF64[$d>>3];
     $D$2146_20 = $e$18_18 - $d$19_19;
     HEAPF64[$value_13>>3] = $D$2146_20;
     HEAPF64[$error_14>>3] = 2.0E-16;
     break;
    } else {
     HEAP32[8>>2] = 0;
     $D$2148_21 = HEAP32[$n_1>>2]|0;
     $infis$20_22 = HEAP32[$infis>>2]|0;
     $D$2150_23 = (($D$2148_21) - ($infis$20_22))|0;
     $D$2151_24 = (($D$2150_23) + -1)|0;
     HEAP32[$D$2125>>2] = $D$2151_24;
     _dkbvrc_($D$2125,8,$maxpts_25,1,$abseps_26,$releps_27,$error_14,$value_13,$inform_10);
     break;
    }
   }
  }
 } while(0);
 if ((label|0) == 4) {
  HEAP32[$inform_10>>2] = 2;
  HEAPF64[$value_13>>3] = 0.0;
  HEAPF64[$error_14>>3] = 1.0;
 }
 STACKTOP = sp;return;
}
function _mvndst($n,$lower,$upper,$infin,$correl,$maxpts,$abseps,$releps,$error,$value,$inform) {
 $n = $n|0;
 $lower = $lower|0;
 $upper = $upper|0;
 $infin = $infin|0;
 $correl = $correl|0;
 $maxpts = $maxpts|0;
 $abseps = +$abseps;
 $releps = +$releps;
 $error = $error|0;
 $value = $value|0;
 $inform = $inform|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = sp + 48|0;
 $5 = sp + 28|0;
 $6 = sp + 8|0;
 $7 = sp;
 HEAP32[$0>>2] = $n;
 $1 = $lower;
 $2 = $upper;
 $3 = $infin;
 $4 = $correl;
 HEAP32[$5>>2] = $maxpts;
 HEAPF64[$6>>3] = $abseps;
 HEAPF64[$7>>3] = $releps;
 $8 = $error;
 $9 = $value;
 $10 = $inform;
 $11 = $1;
 $12 = $2;
 $13 = $3;
 $14 = $4;
 $15 = $8;
 $16 = $9;
 $17 = $10;
 _mvndst_($0,$11,$12,$13,$14,$5,$6,$7,$15,$16,$17);
 STACKTOP = sp;return;
}
function _malloc($bytes) {
 $bytes = $bytes|0;
 var $$$i = 0, $$3$i = 0, $$4$i = 0, $$pre = 0, $$pre$i = 0, $$pre$i$i = 0, $$pre$i25 = 0, $$pre$i25$i = 0, $$pre$phi$i$iZ2D = 0, $$pre$phi$i26$iZ2D = 0, $$pre$phi$i26Z2D = 0, $$pre$phi$iZ2D = 0, $$pre$phi58$i$iZ2D = 0, $$pre$phiZ2D = 0, $$pre57$i$i = 0, $$rsize$0$i = 0, $$rsize$3$i = 0, $$sum = 0, $$sum$i$i = 0, $$sum$i$i$i = 0;
 var $$sum$i14$i = 0, $$sum$i15$i = 0, $$sum$i18$i = 0, $$sum$i21$i = 0, $$sum$i2334 = 0, $$sum$i32 = 0, $$sum$i35 = 0, $$sum1 = 0, $$sum1$i = 0, $$sum1$i$i = 0, $$sum1$i16$i = 0, $$sum1$i22$i = 0, $$sum1$i24 = 0, $$sum10 = 0, $$sum10$i = 0, $$sum10$i$i = 0, $$sum10$pre$i$i = 0, $$sum107$i = 0, $$sum108$i = 0, $$sum109$i = 0;
 var $$sum11$i = 0, $$sum11$i$i = 0, $$sum11$i24$i = 0, $$sum110$i = 0, $$sum111$i = 0, $$sum1112 = 0, $$sum112$i = 0, $$sum113$i = 0, $$sum114$i = 0, $$sum115$i = 0, $$sum116$i = 0, $$sum117$i = 0, $$sum118$i = 0, $$sum119$i = 0, $$sum12$i = 0, $$sum12$i$i = 0, $$sum120$i = 0, $$sum13$i = 0, $$sum13$i$i = 0, $$sum14$i$i = 0;
 var $$sum14$pre$i = 0, $$sum15$i = 0, $$sum15$i$i = 0, $$sum16$i = 0, $$sum16$i$i = 0, $$sum17$i = 0, $$sum17$i$i = 0, $$sum18$i = 0, $$sum1819$i$i = 0, $$sum2 = 0, $$sum2$i = 0, $$sum2$i$i = 0, $$sum2$i$i$i = 0, $$sum2$i17$i = 0, $$sum2$i19$i = 0, $$sum2$i23$i = 0, $$sum2$pre$i = 0, $$sum20$i$i = 0, $$sum21$i$i = 0, $$sum22$i$i = 0;
 var $$sum23$i$i = 0, $$sum24$i$i = 0, $$sum25$i$i = 0, $$sum26$pre$i$i = 0, $$sum27$i$i = 0, $$sum28$i$i = 0, $$sum29$i$i = 0, $$sum3$i = 0, $$sum3$i$i = 0, $$sum3$i27 = 0, $$sum30$i$i = 0, $$sum3132$i$i = 0, $$sum34$i$i = 0, $$sum3536$i$i = 0, $$sum3738$i$i = 0, $$sum39$i$i = 0, $$sum4 = 0, $$sum4$i = 0, $$sum4$i28 = 0, $$sum40$i$i = 0;
 var $$sum41$i$i = 0, $$sum42$i$i = 0, $$sum5$i = 0, $$sum5$i$i = 0, $$sum56 = 0, $$sum6$i = 0, $$sum67$i$i = 0, $$sum7$i = 0, $$sum8$i = 0, $$sum8$pre = 0, $$sum9 = 0, $$sum9$i = 0, $$sum9$i$i = 0, $$tsize$1$i = 0, $$v$0$i = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $1000 = 0;
 var $1001 = 0, $1002 = 0, $1003 = 0, $1004 = 0, $1005 = 0, $1006 = 0, $1007 = 0, $1008 = 0, $1009 = 0, $101 = 0, $1010 = 0, $1011 = 0, $1012 = 0, $1013 = 0, $1014 = 0, $1015 = 0, $1016 = 0, $1017 = 0, $1018 = 0, $1019 = 0;
 var $102 = 0, $1020 = 0, $1021 = 0, $1022 = 0, $1023 = 0, $1024 = 0, $1025 = 0, $1026 = 0, $1027 = 0, $1028 = 0, $1029 = 0, $103 = 0, $1030 = 0, $1031 = 0, $1032 = 0, $1033 = 0, $1034 = 0, $1035 = 0, $1036 = 0, $1037 = 0;
 var $1038 = 0, $1039 = 0, $104 = 0, $1040 = 0, $1041 = 0, $1042 = 0, $1043 = 0, $1044 = 0, $1045 = 0, $1046 = 0, $1047 = 0, $1048 = 0, $1049 = 0, $105 = 0, $1050 = 0, $1051 = 0, $1052 = 0, $1053 = 0, $1054 = 0, $1055 = 0;
 var $1056 = 0, $1057 = 0, $1058 = 0, $1059 = 0, $106 = 0, $1060 = 0, $1061 = 0, $1062 = 0, $1063 = 0, $1064 = 0, $1065 = 0, $1066 = 0, $1067 = 0, $1068 = 0, $1069 = 0, $107 = 0, $1070 = 0, $1071 = 0, $1072 = 0, $1073 = 0;
 var $1074 = 0, $1075 = 0, $1076 = 0, $1077 = 0, $1078 = 0, $1079 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0;
 var $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0;
 var $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0;
 var $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0;
 var $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0;
 var $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0;
 var $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0;
 var $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0;
 var $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0;
 var $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0;
 var $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0;
 var $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0;
 var $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0, $336 = 0;
 var $337 = 0, $338 = 0, $339 = 0, $34 = 0, $340 = 0, $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0, $346 = 0, $347 = 0, $348 = 0, $349 = 0, $35 = 0, $350 = 0, $351 = 0, $352 = 0, $353 = 0, $354 = 0;
 var $355 = 0, $356 = 0, $357 = 0, $358 = 0, $359 = 0, $36 = 0, $360 = 0, $361 = 0, $362 = 0, $363 = 0, $364 = 0, $365 = 0, $366 = 0, $367 = 0, $368 = 0, $369 = 0, $37 = 0, $370 = 0, $371 = 0, $372 = 0;
 var $373 = 0, $374 = 0, $375 = 0, $376 = 0, $377 = 0, $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0, $382 = 0, $383 = 0, $384 = 0, $385 = 0, $386 = 0, $387 = 0, $388 = 0, $389 = 0, $39 = 0, $390 = 0;
 var $391 = 0, $392 = 0, $393 = 0, $394 = 0, $395 = 0, $396 = 0, $397 = 0, $398 = 0, $399 = 0, $4 = 0, $40 = 0, $400 = 0, $401 = 0, $402 = 0, $403 = 0, $404 = 0, $405 = 0, $406 = 0, $407 = 0, $408 = 0;
 var $409 = 0, $41 = 0, $410 = 0, $411 = 0, $412 = 0, $413 = 0, $414 = 0, $415 = 0, $416 = 0, $417 = 0, $418 = 0, $419 = 0, $42 = 0, $420 = 0, $421 = 0, $422 = 0, $423 = 0, $424 = 0, $425 = 0, $426 = 0;
 var $427 = 0, $428 = 0, $429 = 0, $43 = 0, $430 = 0, $431 = 0, $432 = 0, $433 = 0, $434 = 0, $435 = 0, $436 = 0, $437 = 0, $438 = 0, $439 = 0, $44 = 0, $440 = 0, $441 = 0, $442 = 0, $443 = 0, $444 = 0;
 var $445 = 0, $446 = 0, $447 = 0, $448 = 0, $449 = 0, $45 = 0, $450 = 0, $451 = 0, $452 = 0, $453 = 0, $454 = 0, $455 = 0, $456 = 0, $457 = 0, $458 = 0, $459 = 0, $46 = 0, $460 = 0, $461 = 0, $462 = 0;
 var $463 = 0, $464 = 0, $465 = 0, $466 = 0, $467 = 0, $468 = 0, $469 = 0, $47 = 0, $470 = 0, $471 = 0, $472 = 0, $473 = 0, $474 = 0, $475 = 0, $476 = 0, $477 = 0, $478 = 0, $479 = 0, $48 = 0, $480 = 0;
 var $481 = 0, $482 = 0, $483 = 0, $484 = 0, $485 = 0, $486 = 0, $487 = 0, $488 = 0, $489 = 0, $49 = 0, $490 = 0, $491 = 0, $492 = 0, $493 = 0, $494 = 0, $495 = 0, $496 = 0, $497 = 0, $498 = 0, $499 = 0;
 var $5 = 0, $50 = 0, $500 = 0, $501 = 0, $502 = 0, $503 = 0, $504 = 0, $505 = 0, $506 = 0, $507 = 0, $508 = 0, $509 = 0, $51 = 0, $510 = 0, $511 = 0, $512 = 0, $513 = 0, $514 = 0, $515 = 0, $516 = 0;
 var $517 = 0, $518 = 0, $519 = 0, $52 = 0, $520 = 0, $521 = 0, $522 = 0, $523 = 0, $524 = 0, $525 = 0, $526 = 0, $527 = 0, $528 = 0, $529 = 0, $53 = 0, $530 = 0, $531 = 0, $532 = 0, $533 = 0, $534 = 0;
 var $535 = 0, $536 = 0, $537 = 0, $538 = 0, $539 = 0, $54 = 0, $540 = 0, $541 = 0, $542 = 0, $543 = 0, $544 = 0, $545 = 0, $546 = 0, $547 = 0, $548 = 0, $549 = 0, $55 = 0, $550 = 0, $551 = 0, $552 = 0;
 var $553 = 0, $554 = 0, $555 = 0, $556 = 0, $557 = 0, $558 = 0, $559 = 0, $56 = 0, $560 = 0, $561 = 0, $562 = 0, $563 = 0, $564 = 0, $565 = 0, $566 = 0, $567 = 0, $568 = 0, $569 = 0, $57 = 0, $570 = 0;
 var $571 = 0, $572 = 0, $573 = 0, $574 = 0, $575 = 0, $576 = 0, $577 = 0, $578 = 0, $579 = 0, $58 = 0, $580 = 0, $581 = 0, $582 = 0, $583 = 0, $584 = 0, $585 = 0, $586 = 0, $587 = 0, $588 = 0, $589 = 0;
 var $59 = 0, $590 = 0, $591 = 0, $592 = 0, $593 = 0, $594 = 0, $595 = 0, $596 = 0, $597 = 0, $598 = 0, $599 = 0, $6 = 0, $60 = 0, $600 = 0, $601 = 0, $602 = 0, $603 = 0, $604 = 0, $605 = 0, $606 = 0;
 var $607 = 0, $608 = 0, $609 = 0, $61 = 0, $610 = 0, $611 = 0, $612 = 0, $613 = 0, $614 = 0, $615 = 0, $616 = 0, $617 = 0, $618 = 0, $619 = 0, $62 = 0, $620 = 0, $621 = 0, $622 = 0, $623 = 0, $624 = 0;
 var $625 = 0, $626 = 0, $627 = 0, $628 = 0, $629 = 0, $63 = 0, $630 = 0, $631 = 0, $632 = 0, $633 = 0, $634 = 0, $635 = 0, $636 = 0, $637 = 0, $638 = 0, $639 = 0, $64 = 0, $640 = 0, $641 = 0, $642 = 0;
 var $643 = 0, $644 = 0, $645 = 0, $646 = 0, $647 = 0, $648 = 0, $649 = 0, $65 = 0, $650 = 0, $651 = 0, $652 = 0, $653 = 0, $654 = 0, $655 = 0, $656 = 0, $657 = 0, $658 = 0, $659 = 0, $66 = 0, $660 = 0;
 var $661 = 0, $662 = 0, $663 = 0, $664 = 0, $665 = 0, $666 = 0, $667 = 0, $668 = 0, $669 = 0, $67 = 0, $670 = 0, $671 = 0, $672 = 0, $673 = 0, $674 = 0, $675 = 0, $676 = 0, $677 = 0, $678 = 0, $679 = 0;
 var $68 = 0, $680 = 0, $681 = 0, $682 = 0, $683 = 0, $684 = 0, $685 = 0, $686 = 0, $687 = 0, $688 = 0, $689 = 0, $69 = 0, $690 = 0, $691 = 0, $692 = 0, $693 = 0, $694 = 0, $695 = 0, $696 = 0, $697 = 0;
 var $698 = 0, $699 = 0, $7 = 0, $70 = 0, $700 = 0, $701 = 0, $702 = 0, $703 = 0, $704 = 0, $705 = 0, $706 = 0, $707 = 0, $708 = 0, $709 = 0, $71 = 0, $710 = 0, $711 = 0, $712 = 0, $713 = 0, $714 = 0;
 var $715 = 0, $716 = 0, $717 = 0, $718 = 0, $719 = 0, $72 = 0, $720 = 0, $721 = 0, $722 = 0, $723 = 0, $724 = 0, $725 = 0, $726 = 0, $727 = 0, $728 = 0, $729 = 0, $73 = 0, $730 = 0, $731 = 0, $732 = 0;
 var $733 = 0, $734 = 0, $735 = 0, $736 = 0, $737 = 0, $738 = 0, $739 = 0, $74 = 0, $740 = 0, $741 = 0, $742 = 0, $743 = 0, $744 = 0, $745 = 0, $746 = 0, $747 = 0, $748 = 0, $749 = 0, $75 = 0, $750 = 0;
 var $751 = 0, $752 = 0, $753 = 0, $754 = 0, $755 = 0, $756 = 0, $757 = 0, $758 = 0, $759 = 0, $76 = 0, $760 = 0, $761 = 0, $762 = 0, $763 = 0, $764 = 0, $765 = 0, $766 = 0, $767 = 0, $768 = 0, $769 = 0;
 var $77 = 0, $770 = 0, $771 = 0, $772 = 0, $773 = 0, $774 = 0, $775 = 0, $776 = 0, $777 = 0, $778 = 0, $779 = 0, $78 = 0, $780 = 0, $781 = 0, $782 = 0, $783 = 0, $784 = 0, $785 = 0, $786 = 0, $787 = 0;
 var $788 = 0, $789 = 0, $79 = 0, $790 = 0, $791 = 0, $792 = 0, $793 = 0, $794 = 0, $795 = 0, $796 = 0, $797 = 0, $798 = 0, $799 = 0, $8 = 0, $80 = 0, $800 = 0, $801 = 0, $802 = 0, $803 = 0, $804 = 0;
 var $805 = 0, $806 = 0, $807 = 0, $808 = 0, $809 = 0, $81 = 0, $810 = 0, $811 = 0, $812 = 0, $813 = 0, $814 = 0, $815 = 0, $816 = 0, $817 = 0, $818 = 0, $819 = 0, $82 = 0, $820 = 0, $821 = 0, $822 = 0;
 var $823 = 0, $824 = 0, $825 = 0, $826 = 0, $827 = 0, $828 = 0, $829 = 0, $83 = 0, $830 = 0, $831 = 0, $832 = 0, $833 = 0, $834 = 0, $835 = 0, $836 = 0, $837 = 0, $838 = 0, $839 = 0, $84 = 0, $840 = 0;
 var $841 = 0, $842 = 0, $843 = 0, $844 = 0, $845 = 0, $846 = 0, $847 = 0, $848 = 0, $849 = 0, $85 = 0, $850 = 0, $851 = 0, $852 = 0, $853 = 0, $854 = 0, $855 = 0, $856 = 0, $857 = 0, $858 = 0, $859 = 0;
 var $86 = 0, $860 = 0, $861 = 0, $862 = 0, $863 = 0, $864 = 0, $865 = 0, $866 = 0, $867 = 0, $868 = 0, $869 = 0, $87 = 0, $870 = 0, $871 = 0, $872 = 0, $873 = 0, $874 = 0, $875 = 0, $876 = 0, $877 = 0;
 var $878 = 0, $879 = 0, $88 = 0, $880 = 0, $881 = 0, $882 = 0, $883 = 0, $884 = 0, $885 = 0, $886 = 0, $887 = 0, $888 = 0, $889 = 0, $89 = 0, $890 = 0, $891 = 0, $892 = 0, $893 = 0, $894 = 0, $895 = 0;
 var $896 = 0, $897 = 0, $898 = 0, $899 = 0, $9 = 0, $90 = 0, $900 = 0, $901 = 0, $902 = 0, $903 = 0, $904 = 0, $905 = 0, $906 = 0, $907 = 0, $908 = 0, $909 = 0, $91 = 0, $910 = 0, $911 = 0, $912 = 0;
 var $913 = 0, $914 = 0, $915 = 0, $916 = 0, $917 = 0, $918 = 0, $919 = 0, $92 = 0, $920 = 0, $921 = 0, $922 = 0, $923 = 0, $924 = 0, $925 = 0, $926 = 0, $927 = 0, $928 = 0, $929 = 0, $93 = 0, $930 = 0;
 var $931 = 0, $932 = 0, $933 = 0, $934 = 0, $935 = 0, $936 = 0, $937 = 0, $938 = 0, $939 = 0, $94 = 0, $940 = 0, $941 = 0, $942 = 0, $943 = 0, $944 = 0, $945 = 0, $946 = 0, $947 = 0, $948 = 0, $949 = 0;
 var $95 = 0, $950 = 0, $951 = 0, $952 = 0, $953 = 0, $954 = 0, $955 = 0, $956 = 0, $957 = 0, $958 = 0, $959 = 0, $96 = 0, $960 = 0, $961 = 0, $962 = 0, $963 = 0, $964 = 0, $965 = 0, $966 = 0, $967 = 0;
 var $968 = 0, $969 = 0, $97 = 0, $970 = 0, $971 = 0, $972 = 0, $973 = 0, $974 = 0, $975 = 0, $976 = 0, $977 = 0, $978 = 0, $979 = 0, $98 = 0, $980 = 0, $981 = 0, $982 = 0, $983 = 0, $984 = 0, $985 = 0;
 var $986 = 0, $987 = 0, $988 = 0, $989 = 0, $99 = 0, $990 = 0, $991 = 0, $992 = 0, $993 = 0, $994 = 0, $995 = 0, $996 = 0, $997 = 0, $998 = 0, $999 = 0, $F$0$i$i = 0, $F1$0$i = 0, $F4$0 = 0, $F4$0$i$i = 0, $F5$0$i = 0;
 var $I1$0$c$i$i = 0, $I1$0$i$i = 0, $I7$0$i = 0, $I7$0$i$i = 0, $K12$025$i = 0, $K2$014$i$i = 0, $K8$052$i$i = 0, $R$0$i = 0, $R$0$i$i = 0, $R$0$i18 = 0, $R$1$i = 0, $R$1$i$i = 0, $R$1$i20 = 0, $RP$0$i = 0, $RP$0$i$i = 0, $RP$0$i17 = 0, $T$0$lcssa$i = 0, $T$0$lcssa$i$i = 0, $T$0$lcssa$i28$i = 0, $T$013$i$i = 0;
 var $T$024$i = 0, $T$051$i$i = 0, $br$0$i = 0, $cond$i = 0, $cond$i$i = 0, $cond$i21 = 0, $exitcond$i$i = 0, $i$02$i$i = 0, $idx$0$i = 0, $mem$0 = 0, $nb$0 = 0, $notlhs$i = 0, $notrhs$i = 0, $oldfirst$0$i$i = 0, $or$cond$i = 0, $or$cond$i29 = 0, $or$cond1$i = 0, $or$cond10$i = 0, $or$cond19$i = 0, $or$cond2$i = 0;
 var $or$cond49$i = 0, $or$cond5$i = 0, $or$cond6$i = 0, $or$cond8$not$i = 0, $or$cond9$i = 0, $qsize$0$i$i = 0, $rsize$0$i = 0, $rsize$0$i15 = 0, $rsize$1$i = 0, $rsize$2$i = 0, $rsize$3$lcssa$i = 0, $rsize$329$i = 0, $rst$0$i = 0, $rst$1$i = 0, $sizebits$0$i = 0, $sp$0$i$i = 0, $sp$0$i$i$i = 0, $sp$075$i = 0, $sp$168$i = 0, $ssize$0$$i = 0;
 var $ssize$0$i = 0, $ssize$1$i = 0, $ssize$2$i = 0, $t$0$i = 0, $t$0$i14 = 0, $t$1$i = 0, $t$2$ph$i = 0, $t$2$v$3$i = 0, $t$228$i = 0, $tbase$0$i = 0, $tbase$247$i = 0, $tsize$0$i = 0, $tsize$0323841$i = 0, $tsize$1$i = 0, $tsize$246$i = 0, $v$0$i = 0, $v$0$i16 = 0, $v$1$i = 0, $v$2$i = 0, $v$3$lcssa$i = 0;
 var $v$330$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($bytes>>>0)<(245);
 do {
  if ($0) {
   $1 = ($bytes>>>0)<(11);
   if ($1) {
    $5 = 16;
   } else {
    $2 = (($bytes) + 11)|0;
    $3 = $2 & -8;
    $5 = $3;
   }
   $4 = $5 >>> 3;
   $6 = HEAP32[1024120>>2]|0;
   $7 = $6 >>> $4;
   $8 = $7 & 3;
   $9 = ($8|0)==(0);
   if (!($9)) {
    $10 = $7 & 1;
    $11 = $10 ^ 1;
    $12 = (($11) + ($4))|0;
    $13 = $12 << 1;
    $14 = ((1024120 + ($13<<2)|0) + 40|0);
    $$sum10 = (($13) + 2)|0;
    $15 = ((1024120 + ($$sum10<<2)|0) + 40|0);
    $16 = HEAP32[$15>>2]|0;
    $17 = (($16) + 8|0);
    $18 = HEAP32[$17>>2]|0;
    $19 = ($14|0)==($18|0);
    do {
     if ($19) {
      $20 = 1 << $12;
      $21 = $20 ^ -1;
      $22 = $6 & $21;
      HEAP32[1024120>>2] = $22;
     } else {
      $23 = HEAP32[((1024120 + 16|0))>>2]|0;
      $24 = ($18>>>0)<($23>>>0);
      if ($24) {
       _abort();
       // unreachable;
      }
      $25 = (($18) + 12|0);
      $26 = HEAP32[$25>>2]|0;
      $27 = ($26|0)==($16|0);
      if ($27) {
       HEAP32[$25>>2] = $14;
       HEAP32[$15>>2] = $18;
       break;
      } else {
       _abort();
       // unreachable;
      }
     }
    } while(0);
    $28 = $12 << 3;
    $29 = $28 | 3;
    $30 = (($16) + 4|0);
    HEAP32[$30>>2] = $29;
    $$sum1112 = $28 | 4;
    $31 = (($16) + ($$sum1112)|0);
    $32 = HEAP32[$31>>2]|0;
    $33 = $32 | 1;
    HEAP32[$31>>2] = $33;
    $mem$0 = $17;
    STACKTOP = sp;return ($mem$0|0);
   }
   $34 = HEAP32[((1024120 + 8|0))>>2]|0;
   $35 = ($5>>>0)>($34>>>0);
   if ($35) {
    $36 = ($7|0)==(0);
    if (!($36)) {
     $37 = $7 << $4;
     $38 = 2 << $4;
     $39 = (0 - ($38))|0;
     $40 = $38 | $39;
     $41 = $37 & $40;
     $42 = (0 - ($41))|0;
     $43 = $41 & $42;
     $44 = (($43) + -1)|0;
     $45 = $44 >>> 12;
     $46 = $45 & 16;
     $47 = $44 >>> $46;
     $48 = $47 >>> 5;
     $49 = $48 & 8;
     $50 = $49 | $46;
     $51 = $47 >>> $49;
     $52 = $51 >>> 2;
     $53 = $52 & 4;
     $54 = $50 | $53;
     $55 = $51 >>> $53;
     $56 = $55 >>> 1;
     $57 = $56 & 2;
     $58 = $54 | $57;
     $59 = $55 >>> $57;
     $60 = $59 >>> 1;
     $61 = $60 & 1;
     $62 = $58 | $61;
     $63 = $59 >>> $61;
     $64 = (($62) + ($63))|0;
     $65 = $64 << 1;
     $66 = ((1024120 + ($65<<2)|0) + 40|0);
     $$sum4 = (($65) + 2)|0;
     $67 = ((1024120 + ($$sum4<<2)|0) + 40|0);
     $68 = HEAP32[$67>>2]|0;
     $69 = (($68) + 8|0);
     $70 = HEAP32[$69>>2]|0;
     $71 = ($66|0)==($70|0);
     do {
      if ($71) {
       $72 = 1 << $64;
       $73 = $72 ^ -1;
       $74 = $6 & $73;
       HEAP32[1024120>>2] = $74;
      } else {
       $75 = HEAP32[((1024120 + 16|0))>>2]|0;
       $76 = ($70>>>0)<($75>>>0);
       if ($76) {
        _abort();
        // unreachable;
       }
       $77 = (($70) + 12|0);
       $78 = HEAP32[$77>>2]|0;
       $79 = ($78|0)==($68|0);
       if ($79) {
        HEAP32[$77>>2] = $66;
        HEAP32[$67>>2] = $70;
        break;
       } else {
        _abort();
        // unreachable;
       }
      }
     } while(0);
     $80 = $64 << 3;
     $81 = (($80) - ($5))|0;
     $82 = $5 | 3;
     $83 = (($68) + 4|0);
     HEAP32[$83>>2] = $82;
     $84 = (($68) + ($5)|0);
     $85 = $81 | 1;
     $$sum56 = $5 | 4;
     $86 = (($68) + ($$sum56)|0);
     HEAP32[$86>>2] = $85;
     $87 = (($68) + ($80)|0);
     HEAP32[$87>>2] = $81;
     $88 = HEAP32[((1024120 + 8|0))>>2]|0;
     $89 = ($88|0)==(0);
     if (!($89)) {
      $90 = HEAP32[((1024120 + 20|0))>>2]|0;
      $91 = $88 >>> 3;
      $92 = $91 << 1;
      $93 = ((1024120 + ($92<<2)|0) + 40|0);
      $94 = HEAP32[1024120>>2]|0;
      $95 = 1 << $91;
      $96 = $94 & $95;
      $97 = ($96|0)==(0);
      if ($97) {
       $98 = $94 | $95;
       HEAP32[1024120>>2] = $98;
       $$sum8$pre = (($92) + 2)|0;
       $$pre = ((1024120 + ($$sum8$pre<<2)|0) + 40|0);
       $$pre$phiZ2D = $$pre;$F4$0 = $93;
      } else {
       $$sum9 = (($92) + 2)|0;
       $99 = ((1024120 + ($$sum9<<2)|0) + 40|0);
       $100 = HEAP32[$99>>2]|0;
       $101 = HEAP32[((1024120 + 16|0))>>2]|0;
       $102 = ($100>>>0)<($101>>>0);
       if ($102) {
        _abort();
        // unreachable;
       } else {
        $$pre$phiZ2D = $99;$F4$0 = $100;
       }
      }
      HEAP32[$$pre$phiZ2D>>2] = $90;
      $103 = (($F4$0) + 12|0);
      HEAP32[$103>>2] = $90;
      $104 = (($90) + 8|0);
      HEAP32[$104>>2] = $F4$0;
      $105 = (($90) + 12|0);
      HEAP32[$105>>2] = $93;
     }
     HEAP32[((1024120 + 8|0))>>2] = $81;
     HEAP32[((1024120 + 20|0))>>2] = $84;
     $mem$0 = $69;
     STACKTOP = sp;return ($mem$0|0);
    }
    $106 = HEAP32[((1024120 + 4|0))>>2]|0;
    $107 = ($106|0)==(0);
    if ($107) {
     $nb$0 = $5;
    } else {
     $108 = (0 - ($106))|0;
     $109 = $106 & $108;
     $110 = (($109) + -1)|0;
     $111 = $110 >>> 12;
     $112 = $111 & 16;
     $113 = $110 >>> $112;
     $114 = $113 >>> 5;
     $115 = $114 & 8;
     $116 = $115 | $112;
     $117 = $113 >>> $115;
     $118 = $117 >>> 2;
     $119 = $118 & 4;
     $120 = $116 | $119;
     $121 = $117 >>> $119;
     $122 = $121 >>> 1;
     $123 = $122 & 2;
     $124 = $120 | $123;
     $125 = $121 >>> $123;
     $126 = $125 >>> 1;
     $127 = $126 & 1;
     $128 = $124 | $127;
     $129 = $125 >>> $127;
     $130 = (($128) + ($129))|0;
     $131 = ((1024120 + ($130<<2)|0) + 304|0);
     $132 = HEAP32[$131>>2]|0;
     $133 = (($132) + 4|0);
     $134 = HEAP32[$133>>2]|0;
     $135 = $134 & -8;
     $136 = (($135) - ($5))|0;
     $rsize$0$i = $136;$t$0$i = $132;$v$0$i = $132;
     while(1) {
      $137 = (($t$0$i) + 16|0);
      $138 = HEAP32[$137>>2]|0;
      $139 = ($138|0)==(0|0);
      if ($139) {
       $140 = (($t$0$i) + 20|0);
       $141 = HEAP32[$140>>2]|0;
       $142 = ($141|0)==(0|0);
       if ($142) {
        break;
       } else {
        $144 = $141;
       }
      } else {
       $144 = $138;
      }
      $143 = (($144) + 4|0);
      $145 = HEAP32[$143>>2]|0;
      $146 = $145 & -8;
      $147 = (($146) - ($5))|0;
      $148 = ($147>>>0)<($rsize$0$i>>>0);
      $$rsize$0$i = $148 ? $147 : $rsize$0$i;
      $$v$0$i = $148 ? $144 : $v$0$i;
      $rsize$0$i = $$rsize$0$i;$t$0$i = $144;$v$0$i = $$v$0$i;
     }
     $149 = HEAP32[((1024120 + 16|0))>>2]|0;
     $150 = ($v$0$i>>>0)<($149>>>0);
     if ($150) {
      _abort();
      // unreachable;
     }
     $151 = (($v$0$i) + ($5)|0);
     $152 = ($v$0$i>>>0)<($151>>>0);
     if (!($152)) {
      _abort();
      // unreachable;
     }
     $153 = (($v$0$i) + 24|0);
     $154 = HEAP32[$153>>2]|0;
     $155 = (($v$0$i) + 12|0);
     $156 = HEAP32[$155>>2]|0;
     $157 = ($156|0)==($v$0$i|0);
     do {
      if ($157) {
       $167 = (($v$0$i) + 20|0);
       $168 = HEAP32[$167>>2]|0;
       $169 = ($168|0)==(0|0);
       if ($169) {
        $170 = (($v$0$i) + 16|0);
        $171 = HEAP32[$170>>2]|0;
        $172 = ($171|0)==(0|0);
        if ($172) {
         $R$1$i = 0;
         break;
        } else {
         $R$0$i = $171;$RP$0$i = $170;
        }
       } else {
        $R$0$i = $168;$RP$0$i = $167;
       }
       while(1) {
        $173 = (($R$0$i) + 20|0);
        $174 = HEAP32[$173>>2]|0;
        $175 = ($174|0)==(0|0);
        if (!($175)) {
         $R$0$i = $174;$RP$0$i = $173;
         continue;
        }
        $176 = (($R$0$i) + 16|0);
        $177 = HEAP32[$176>>2]|0;
        $178 = ($177|0)==(0|0);
        if ($178) {
         break;
        } else {
         $R$0$i = $177;$RP$0$i = $176;
        }
       }
       $179 = ($RP$0$i>>>0)<($149>>>0);
       if ($179) {
        _abort();
        // unreachable;
       } else {
        HEAP32[$RP$0$i>>2] = 0;
        $R$1$i = $R$0$i;
        break;
       }
      } else {
       $158 = (($v$0$i) + 8|0);
       $159 = HEAP32[$158>>2]|0;
       $160 = ($159>>>0)<($149>>>0);
       if ($160) {
        _abort();
        // unreachable;
       }
       $161 = (($159) + 12|0);
       $162 = HEAP32[$161>>2]|0;
       $163 = ($162|0)==($v$0$i|0);
       if (!($163)) {
        _abort();
        // unreachable;
       }
       $164 = (($156) + 8|0);
       $165 = HEAP32[$164>>2]|0;
       $166 = ($165|0)==($v$0$i|0);
       if ($166) {
        HEAP32[$161>>2] = $156;
        HEAP32[$164>>2] = $159;
        $R$1$i = $156;
        break;
       } else {
        _abort();
        // unreachable;
       }
      }
     } while(0);
     $180 = ($154|0)==(0|0);
     do {
      if (!($180)) {
       $181 = (($v$0$i) + 28|0);
       $182 = HEAP32[$181>>2]|0;
       $183 = ((1024120 + ($182<<2)|0) + 304|0);
       $184 = HEAP32[$183>>2]|0;
       $185 = ($v$0$i|0)==($184|0);
       if ($185) {
        HEAP32[$183>>2] = $R$1$i;
        $cond$i = ($R$1$i|0)==(0|0);
        if ($cond$i) {
         $186 = 1 << $182;
         $187 = $186 ^ -1;
         $188 = HEAP32[((1024120 + 4|0))>>2]|0;
         $189 = $188 & $187;
         HEAP32[((1024120 + 4|0))>>2] = $189;
         break;
        }
       } else {
        $190 = HEAP32[((1024120 + 16|0))>>2]|0;
        $191 = ($154>>>0)<($190>>>0);
        if ($191) {
         _abort();
         // unreachable;
        }
        $192 = (($154) + 16|0);
        $193 = HEAP32[$192>>2]|0;
        $194 = ($193|0)==($v$0$i|0);
        if ($194) {
         HEAP32[$192>>2] = $R$1$i;
        } else {
         $195 = (($154) + 20|0);
         HEAP32[$195>>2] = $R$1$i;
        }
        $196 = ($R$1$i|0)==(0|0);
        if ($196) {
         break;
        }
       }
       $197 = HEAP32[((1024120 + 16|0))>>2]|0;
       $198 = ($R$1$i>>>0)<($197>>>0);
       if ($198) {
        _abort();
        // unreachable;
       }
       $199 = (($R$1$i) + 24|0);
       HEAP32[$199>>2] = $154;
       $200 = (($v$0$i) + 16|0);
       $201 = HEAP32[$200>>2]|0;
       $202 = ($201|0)==(0|0);
       do {
        if (!($202)) {
         $203 = HEAP32[((1024120 + 16|0))>>2]|0;
         $204 = ($201>>>0)<($203>>>0);
         if ($204) {
          _abort();
          // unreachable;
         } else {
          $205 = (($R$1$i) + 16|0);
          HEAP32[$205>>2] = $201;
          $206 = (($201) + 24|0);
          HEAP32[$206>>2] = $R$1$i;
          break;
         }
        }
       } while(0);
       $207 = (($v$0$i) + 20|0);
       $208 = HEAP32[$207>>2]|0;
       $209 = ($208|0)==(0|0);
       if (!($209)) {
        $210 = HEAP32[((1024120 + 16|0))>>2]|0;
        $211 = ($208>>>0)<($210>>>0);
        if ($211) {
         _abort();
         // unreachable;
        } else {
         $212 = (($R$1$i) + 20|0);
         HEAP32[$212>>2] = $208;
         $213 = (($208) + 24|0);
         HEAP32[$213>>2] = $R$1$i;
         break;
        }
       }
      }
     } while(0);
     $214 = ($rsize$0$i>>>0)<(16);
     if ($214) {
      $215 = (($rsize$0$i) + ($5))|0;
      $216 = $215 | 3;
      $217 = (($v$0$i) + 4|0);
      HEAP32[$217>>2] = $216;
      $$sum4$i = (($215) + 4)|0;
      $218 = (($v$0$i) + ($$sum4$i)|0);
      $219 = HEAP32[$218>>2]|0;
      $220 = $219 | 1;
      HEAP32[$218>>2] = $220;
     } else {
      $221 = $5 | 3;
      $222 = (($v$0$i) + 4|0);
      HEAP32[$222>>2] = $221;
      $223 = $rsize$0$i | 1;
      $$sum$i35 = $5 | 4;
      $224 = (($v$0$i) + ($$sum$i35)|0);
      HEAP32[$224>>2] = $223;
      $$sum1$i = (($rsize$0$i) + ($5))|0;
      $225 = (($v$0$i) + ($$sum1$i)|0);
      HEAP32[$225>>2] = $rsize$0$i;
      $226 = HEAP32[((1024120 + 8|0))>>2]|0;
      $227 = ($226|0)==(0);
      if (!($227)) {
       $228 = HEAP32[((1024120 + 20|0))>>2]|0;
       $229 = $226 >>> 3;
       $230 = $229 << 1;
       $231 = ((1024120 + ($230<<2)|0) + 40|0);
       $232 = HEAP32[1024120>>2]|0;
       $233 = 1 << $229;
       $234 = $232 & $233;
       $235 = ($234|0)==(0);
       if ($235) {
        $236 = $232 | $233;
        HEAP32[1024120>>2] = $236;
        $$sum2$pre$i = (($230) + 2)|0;
        $$pre$i = ((1024120 + ($$sum2$pre$i<<2)|0) + 40|0);
        $$pre$phi$iZ2D = $$pre$i;$F1$0$i = $231;
       } else {
        $$sum3$i = (($230) + 2)|0;
        $237 = ((1024120 + ($$sum3$i<<2)|0) + 40|0);
        $238 = HEAP32[$237>>2]|0;
        $239 = HEAP32[((1024120 + 16|0))>>2]|0;
        $240 = ($238>>>0)<($239>>>0);
        if ($240) {
         _abort();
         // unreachable;
        } else {
         $$pre$phi$iZ2D = $237;$F1$0$i = $238;
        }
       }
       HEAP32[$$pre$phi$iZ2D>>2] = $228;
       $241 = (($F1$0$i) + 12|0);
       HEAP32[$241>>2] = $228;
       $242 = (($228) + 8|0);
       HEAP32[$242>>2] = $F1$0$i;
       $243 = (($228) + 12|0);
       HEAP32[$243>>2] = $231;
      }
      HEAP32[((1024120 + 8|0))>>2] = $rsize$0$i;
      HEAP32[((1024120 + 20|0))>>2] = $151;
     }
     $244 = (($v$0$i) + 8|0);
     $mem$0 = $244;
     STACKTOP = sp;return ($mem$0|0);
    }
   } else {
    $nb$0 = $5;
   }
  } else {
   $245 = ($bytes>>>0)>(4294967231);
   if ($245) {
    $nb$0 = -1;
   } else {
    $246 = (($bytes) + 11)|0;
    $247 = $246 & -8;
    $248 = HEAP32[((1024120 + 4|0))>>2]|0;
    $249 = ($248|0)==(0);
    if ($249) {
     $nb$0 = $247;
    } else {
     $250 = (0 - ($247))|0;
     $251 = $246 >>> 8;
     $252 = ($251|0)==(0);
     if ($252) {
      $idx$0$i = 0;
     } else {
      $253 = ($247>>>0)>(16777215);
      if ($253) {
       $idx$0$i = 31;
      } else {
       $254 = (($251) + 1048320)|0;
       $255 = $254 >>> 16;
       $256 = $255 & 8;
       $257 = $251 << $256;
       $258 = (($257) + 520192)|0;
       $259 = $258 >>> 16;
       $260 = $259 & 4;
       $261 = $260 | $256;
       $262 = $257 << $260;
       $263 = (($262) + 245760)|0;
       $264 = $263 >>> 16;
       $265 = $264 & 2;
       $266 = $261 | $265;
       $267 = (14 - ($266))|0;
       $268 = $262 << $265;
       $269 = $268 >>> 15;
       $270 = (($267) + ($269))|0;
       $271 = $270 << 1;
       $272 = (($270) + 7)|0;
       $273 = $247 >>> $272;
       $274 = $273 & 1;
       $275 = $274 | $271;
       $idx$0$i = $275;
      }
     }
     $276 = ((1024120 + ($idx$0$i<<2)|0) + 304|0);
     $277 = HEAP32[$276>>2]|0;
     $278 = ($277|0)==(0|0);
     L126: do {
      if ($278) {
       $rsize$2$i = $250;$t$1$i = 0;$v$2$i = 0;
      } else {
       $279 = ($idx$0$i|0)==(31);
       if ($279) {
        $283 = 0;
       } else {
        $280 = $idx$0$i >>> 1;
        $281 = (25 - ($280))|0;
        $283 = $281;
       }
       $282 = $247 << $283;
       $rsize$0$i15 = $250;$rst$0$i = 0;$sizebits$0$i = $282;$t$0$i14 = $277;$v$0$i16 = 0;
       while(1) {
        $284 = (($t$0$i14) + 4|0);
        $285 = HEAP32[$284>>2]|0;
        $286 = $285 & -8;
        $287 = (($286) - ($247))|0;
        $288 = ($287>>>0)<($rsize$0$i15>>>0);
        if ($288) {
         $289 = ($286|0)==($247|0);
         if ($289) {
          $rsize$2$i = $287;$t$1$i = $t$0$i14;$v$2$i = $t$0$i14;
          break L126;
         } else {
          $rsize$1$i = $287;$v$1$i = $t$0$i14;
         }
        } else {
         $rsize$1$i = $rsize$0$i15;$v$1$i = $v$0$i16;
        }
        $290 = (($t$0$i14) + 20|0);
        $291 = HEAP32[$290>>2]|0;
        $292 = $sizebits$0$i >>> 31;
        $293 = ((($t$0$i14) + ($292<<2)|0) + 16|0);
        $294 = HEAP32[$293>>2]|0;
        $295 = ($291|0)==(0|0);
        $296 = ($291|0)==($294|0);
        $or$cond$i = $295 | $296;
        $rst$1$i = $or$cond$i ? $rst$0$i : $291;
        $297 = ($294|0)==(0|0);
        $298 = $sizebits$0$i << 1;
        if ($297) {
         $rsize$2$i = $rsize$1$i;$t$1$i = $rst$1$i;$v$2$i = $v$1$i;
         break;
        } else {
         $rsize$0$i15 = $rsize$1$i;$rst$0$i = $rst$1$i;$sizebits$0$i = $298;$t$0$i14 = $294;$v$0$i16 = $v$1$i;
        }
       }
      }
     } while(0);
     $299 = ($t$1$i|0)==(0|0);
     $300 = ($v$2$i|0)==(0|0);
     $or$cond19$i = $299 & $300;
     if ($or$cond19$i) {
      $301 = 2 << $idx$0$i;
      $302 = (0 - ($301))|0;
      $303 = $301 | $302;
      $304 = $248 & $303;
      $305 = ($304|0)==(0);
      if ($305) {
       $nb$0 = $247;
       break;
      }
      $306 = (0 - ($304))|0;
      $307 = $304 & $306;
      $308 = (($307) + -1)|0;
      $309 = $308 >>> 12;
      $310 = $309 & 16;
      $311 = $308 >>> $310;
      $312 = $311 >>> 5;
      $313 = $312 & 8;
      $314 = $313 | $310;
      $315 = $311 >>> $313;
      $316 = $315 >>> 2;
      $317 = $316 & 4;
      $318 = $314 | $317;
      $319 = $315 >>> $317;
      $320 = $319 >>> 1;
      $321 = $320 & 2;
      $322 = $318 | $321;
      $323 = $319 >>> $321;
      $324 = $323 >>> 1;
      $325 = $324 & 1;
      $326 = $322 | $325;
      $327 = $323 >>> $325;
      $328 = (($326) + ($327))|0;
      $329 = ((1024120 + ($328<<2)|0) + 304|0);
      $330 = HEAP32[$329>>2]|0;
      $t$2$ph$i = $330;
     } else {
      $t$2$ph$i = $t$1$i;
     }
     $331 = ($t$2$ph$i|0)==(0|0);
     if ($331) {
      $rsize$3$lcssa$i = $rsize$2$i;$v$3$lcssa$i = $v$2$i;
     } else {
      $rsize$329$i = $rsize$2$i;$t$228$i = $t$2$ph$i;$v$330$i = $v$2$i;
      while(1) {
       $332 = (($t$228$i) + 4|0);
       $333 = HEAP32[$332>>2]|0;
       $334 = $333 & -8;
       $335 = (($334) - ($247))|0;
       $336 = ($335>>>0)<($rsize$329$i>>>0);
       $$rsize$3$i = $336 ? $335 : $rsize$329$i;
       $t$2$v$3$i = $336 ? $t$228$i : $v$330$i;
       $337 = (($t$228$i) + 16|0);
       $338 = HEAP32[$337>>2]|0;
       $339 = ($338|0)==(0|0);
       if (!($339)) {
        $rsize$329$i = $$rsize$3$i;$t$228$i = $338;$v$330$i = $t$2$v$3$i;
        continue;
       }
       $340 = (($t$228$i) + 20|0);
       $341 = HEAP32[$340>>2]|0;
       $342 = ($341|0)==(0|0);
       if ($342) {
        $rsize$3$lcssa$i = $$rsize$3$i;$v$3$lcssa$i = $t$2$v$3$i;
        break;
       } else {
        $rsize$329$i = $$rsize$3$i;$t$228$i = $341;$v$330$i = $t$2$v$3$i;
       }
      }
     }
     $343 = ($v$3$lcssa$i|0)==(0|0);
     if ($343) {
      $nb$0 = $247;
     } else {
      $344 = HEAP32[((1024120 + 8|0))>>2]|0;
      $345 = (($344) - ($247))|0;
      $346 = ($rsize$3$lcssa$i>>>0)<($345>>>0);
      if ($346) {
       $347 = HEAP32[((1024120 + 16|0))>>2]|0;
       $348 = ($v$3$lcssa$i>>>0)<($347>>>0);
       if ($348) {
        _abort();
        // unreachable;
       }
       $349 = (($v$3$lcssa$i) + ($247)|0);
       $350 = ($v$3$lcssa$i>>>0)<($349>>>0);
       if (!($350)) {
        _abort();
        // unreachable;
       }
       $351 = (($v$3$lcssa$i) + 24|0);
       $352 = HEAP32[$351>>2]|0;
       $353 = (($v$3$lcssa$i) + 12|0);
       $354 = HEAP32[$353>>2]|0;
       $355 = ($354|0)==($v$3$lcssa$i|0);
       do {
        if ($355) {
         $365 = (($v$3$lcssa$i) + 20|0);
         $366 = HEAP32[$365>>2]|0;
         $367 = ($366|0)==(0|0);
         if ($367) {
          $368 = (($v$3$lcssa$i) + 16|0);
          $369 = HEAP32[$368>>2]|0;
          $370 = ($369|0)==(0|0);
          if ($370) {
           $R$1$i20 = 0;
           break;
          } else {
           $R$0$i18 = $369;$RP$0$i17 = $368;
          }
         } else {
          $R$0$i18 = $366;$RP$0$i17 = $365;
         }
         while(1) {
          $371 = (($R$0$i18) + 20|0);
          $372 = HEAP32[$371>>2]|0;
          $373 = ($372|0)==(0|0);
          if (!($373)) {
           $R$0$i18 = $372;$RP$0$i17 = $371;
           continue;
          }
          $374 = (($R$0$i18) + 16|0);
          $375 = HEAP32[$374>>2]|0;
          $376 = ($375|0)==(0|0);
          if ($376) {
           break;
          } else {
           $R$0$i18 = $375;$RP$0$i17 = $374;
          }
         }
         $377 = ($RP$0$i17>>>0)<($347>>>0);
         if ($377) {
          _abort();
          // unreachable;
         } else {
          HEAP32[$RP$0$i17>>2] = 0;
          $R$1$i20 = $R$0$i18;
          break;
         }
        } else {
         $356 = (($v$3$lcssa$i) + 8|0);
         $357 = HEAP32[$356>>2]|0;
         $358 = ($357>>>0)<($347>>>0);
         if ($358) {
          _abort();
          // unreachable;
         }
         $359 = (($357) + 12|0);
         $360 = HEAP32[$359>>2]|0;
         $361 = ($360|0)==($v$3$lcssa$i|0);
         if (!($361)) {
          _abort();
          // unreachable;
         }
         $362 = (($354) + 8|0);
         $363 = HEAP32[$362>>2]|0;
         $364 = ($363|0)==($v$3$lcssa$i|0);
         if ($364) {
          HEAP32[$359>>2] = $354;
          HEAP32[$362>>2] = $357;
          $R$1$i20 = $354;
          break;
         } else {
          _abort();
          // unreachable;
         }
        }
       } while(0);
       $378 = ($352|0)==(0|0);
       do {
        if (!($378)) {
         $379 = (($v$3$lcssa$i) + 28|0);
         $380 = HEAP32[$379>>2]|0;
         $381 = ((1024120 + ($380<<2)|0) + 304|0);
         $382 = HEAP32[$381>>2]|0;
         $383 = ($v$3$lcssa$i|0)==($382|0);
         if ($383) {
          HEAP32[$381>>2] = $R$1$i20;
          $cond$i21 = ($R$1$i20|0)==(0|0);
          if ($cond$i21) {
           $384 = 1 << $380;
           $385 = $384 ^ -1;
           $386 = HEAP32[((1024120 + 4|0))>>2]|0;
           $387 = $386 & $385;
           HEAP32[((1024120 + 4|0))>>2] = $387;
           break;
          }
         } else {
          $388 = HEAP32[((1024120 + 16|0))>>2]|0;
          $389 = ($352>>>0)<($388>>>0);
          if ($389) {
           _abort();
           // unreachable;
          }
          $390 = (($352) + 16|0);
          $391 = HEAP32[$390>>2]|0;
          $392 = ($391|0)==($v$3$lcssa$i|0);
          if ($392) {
           HEAP32[$390>>2] = $R$1$i20;
          } else {
           $393 = (($352) + 20|0);
           HEAP32[$393>>2] = $R$1$i20;
          }
          $394 = ($R$1$i20|0)==(0|0);
          if ($394) {
           break;
          }
         }
         $395 = HEAP32[((1024120 + 16|0))>>2]|0;
         $396 = ($R$1$i20>>>0)<($395>>>0);
         if ($396) {
          _abort();
          // unreachable;
         }
         $397 = (($R$1$i20) + 24|0);
         HEAP32[$397>>2] = $352;
         $398 = (($v$3$lcssa$i) + 16|0);
         $399 = HEAP32[$398>>2]|0;
         $400 = ($399|0)==(0|0);
         do {
          if (!($400)) {
           $401 = HEAP32[((1024120 + 16|0))>>2]|0;
           $402 = ($399>>>0)<($401>>>0);
           if ($402) {
            _abort();
            // unreachable;
           } else {
            $403 = (($R$1$i20) + 16|0);
            HEAP32[$403>>2] = $399;
            $404 = (($399) + 24|0);
            HEAP32[$404>>2] = $R$1$i20;
            break;
           }
          }
         } while(0);
         $405 = (($v$3$lcssa$i) + 20|0);
         $406 = HEAP32[$405>>2]|0;
         $407 = ($406|0)==(0|0);
         if (!($407)) {
          $408 = HEAP32[((1024120 + 16|0))>>2]|0;
          $409 = ($406>>>0)<($408>>>0);
          if ($409) {
           _abort();
           // unreachable;
          } else {
           $410 = (($R$1$i20) + 20|0);
           HEAP32[$410>>2] = $406;
           $411 = (($406) + 24|0);
           HEAP32[$411>>2] = $R$1$i20;
           break;
          }
         }
        }
       } while(0);
       $412 = ($rsize$3$lcssa$i>>>0)<(16);
       L204: do {
        if ($412) {
         $413 = (($rsize$3$lcssa$i) + ($247))|0;
         $414 = $413 | 3;
         $415 = (($v$3$lcssa$i) + 4|0);
         HEAP32[$415>>2] = $414;
         $$sum18$i = (($413) + 4)|0;
         $416 = (($v$3$lcssa$i) + ($$sum18$i)|0);
         $417 = HEAP32[$416>>2]|0;
         $418 = $417 | 1;
         HEAP32[$416>>2] = $418;
        } else {
         $419 = $247 | 3;
         $420 = (($v$3$lcssa$i) + 4|0);
         HEAP32[$420>>2] = $419;
         $421 = $rsize$3$lcssa$i | 1;
         $$sum$i2334 = $247 | 4;
         $422 = (($v$3$lcssa$i) + ($$sum$i2334)|0);
         HEAP32[$422>>2] = $421;
         $$sum1$i24 = (($rsize$3$lcssa$i) + ($247))|0;
         $423 = (($v$3$lcssa$i) + ($$sum1$i24)|0);
         HEAP32[$423>>2] = $rsize$3$lcssa$i;
         $424 = $rsize$3$lcssa$i >>> 3;
         $425 = ($rsize$3$lcssa$i>>>0)<(256);
         if ($425) {
          $426 = $424 << 1;
          $427 = ((1024120 + ($426<<2)|0) + 40|0);
          $428 = HEAP32[1024120>>2]|0;
          $429 = 1 << $424;
          $430 = $428 & $429;
          $431 = ($430|0)==(0);
          do {
           if ($431) {
            $432 = $428 | $429;
            HEAP32[1024120>>2] = $432;
            $$sum14$pre$i = (($426) + 2)|0;
            $$pre$i25 = ((1024120 + ($$sum14$pre$i<<2)|0) + 40|0);
            $$pre$phi$i26Z2D = $$pre$i25;$F5$0$i = $427;
           } else {
            $$sum17$i = (($426) + 2)|0;
            $433 = ((1024120 + ($$sum17$i<<2)|0) + 40|0);
            $434 = HEAP32[$433>>2]|0;
            $435 = HEAP32[((1024120 + 16|0))>>2]|0;
            $436 = ($434>>>0)<($435>>>0);
            if (!($436)) {
             $$pre$phi$i26Z2D = $433;$F5$0$i = $434;
             break;
            }
            _abort();
            // unreachable;
           }
          } while(0);
          HEAP32[$$pre$phi$i26Z2D>>2] = $349;
          $437 = (($F5$0$i) + 12|0);
          HEAP32[$437>>2] = $349;
          $$sum15$i = (($247) + 8)|0;
          $438 = (($v$3$lcssa$i) + ($$sum15$i)|0);
          HEAP32[$438>>2] = $F5$0$i;
          $$sum16$i = (($247) + 12)|0;
          $439 = (($v$3$lcssa$i) + ($$sum16$i)|0);
          HEAP32[$439>>2] = $427;
          break;
         }
         $440 = $rsize$3$lcssa$i >>> 8;
         $441 = ($440|0)==(0);
         if ($441) {
          $I7$0$i = 0;
         } else {
          $442 = ($rsize$3$lcssa$i>>>0)>(16777215);
          if ($442) {
           $I7$0$i = 31;
          } else {
           $443 = (($440) + 1048320)|0;
           $444 = $443 >>> 16;
           $445 = $444 & 8;
           $446 = $440 << $445;
           $447 = (($446) + 520192)|0;
           $448 = $447 >>> 16;
           $449 = $448 & 4;
           $450 = $449 | $445;
           $451 = $446 << $449;
           $452 = (($451) + 245760)|0;
           $453 = $452 >>> 16;
           $454 = $453 & 2;
           $455 = $450 | $454;
           $456 = (14 - ($455))|0;
           $457 = $451 << $454;
           $458 = $457 >>> 15;
           $459 = (($456) + ($458))|0;
           $460 = $459 << 1;
           $461 = (($459) + 7)|0;
           $462 = $rsize$3$lcssa$i >>> $461;
           $463 = $462 & 1;
           $464 = $463 | $460;
           $I7$0$i = $464;
          }
         }
         $465 = ((1024120 + ($I7$0$i<<2)|0) + 304|0);
         $$sum2$i = (($247) + 28)|0;
         $466 = (($v$3$lcssa$i) + ($$sum2$i)|0);
         HEAP32[$466>>2] = $I7$0$i;
         $$sum3$i27 = (($247) + 16)|0;
         $467 = (($v$3$lcssa$i) + ($$sum3$i27)|0);
         $$sum4$i28 = (($247) + 20)|0;
         $468 = (($v$3$lcssa$i) + ($$sum4$i28)|0);
         HEAP32[$468>>2] = 0;
         HEAP32[$467>>2] = 0;
         $469 = HEAP32[((1024120 + 4|0))>>2]|0;
         $470 = 1 << $I7$0$i;
         $471 = $469 & $470;
         $472 = ($471|0)==(0);
         if ($472) {
          $473 = $469 | $470;
          HEAP32[((1024120 + 4|0))>>2] = $473;
          HEAP32[$465>>2] = $349;
          $$sum5$i = (($247) + 24)|0;
          $474 = (($v$3$lcssa$i) + ($$sum5$i)|0);
          HEAP32[$474>>2] = $465;
          $$sum6$i = (($247) + 12)|0;
          $475 = (($v$3$lcssa$i) + ($$sum6$i)|0);
          HEAP32[$475>>2] = $349;
          $$sum7$i = (($247) + 8)|0;
          $476 = (($v$3$lcssa$i) + ($$sum7$i)|0);
          HEAP32[$476>>2] = $349;
          break;
         }
         $477 = HEAP32[$465>>2]|0;
         $478 = ($I7$0$i|0)==(31);
         if ($478) {
          $486 = 0;
         } else {
          $479 = $I7$0$i >>> 1;
          $480 = (25 - ($479))|0;
          $486 = $480;
         }
         $481 = (($477) + 4|0);
         $482 = HEAP32[$481>>2]|0;
         $483 = $482 & -8;
         $484 = ($483|0)==($rsize$3$lcssa$i|0);
         L225: do {
          if ($484) {
           $T$0$lcssa$i = $477;
          } else {
           $485 = $rsize$3$lcssa$i << $486;
           $K12$025$i = $485;$T$024$i = $477;
           while(1) {
            $493 = $K12$025$i >>> 31;
            $494 = ((($T$024$i) + ($493<<2)|0) + 16|0);
            $489 = HEAP32[$494>>2]|0;
            $495 = ($489|0)==(0|0);
            if ($495) {
             break;
            }
            $487 = $K12$025$i << 1;
            $488 = (($489) + 4|0);
            $490 = HEAP32[$488>>2]|0;
            $491 = $490 & -8;
            $492 = ($491|0)==($rsize$3$lcssa$i|0);
            if ($492) {
             $T$0$lcssa$i = $489;
             break L225;
            } else {
             $K12$025$i = $487;$T$024$i = $489;
            }
           }
           $496 = HEAP32[((1024120 + 16|0))>>2]|0;
           $497 = ($494>>>0)<($496>>>0);
           if ($497) {
            _abort();
            // unreachable;
           } else {
            HEAP32[$494>>2] = $349;
            $$sum11$i = (($247) + 24)|0;
            $498 = (($v$3$lcssa$i) + ($$sum11$i)|0);
            HEAP32[$498>>2] = $T$024$i;
            $$sum12$i = (($247) + 12)|0;
            $499 = (($v$3$lcssa$i) + ($$sum12$i)|0);
            HEAP32[$499>>2] = $349;
            $$sum13$i = (($247) + 8)|0;
            $500 = (($v$3$lcssa$i) + ($$sum13$i)|0);
            HEAP32[$500>>2] = $349;
            break L204;
           }
          }
         } while(0);
         $501 = (($T$0$lcssa$i) + 8|0);
         $502 = HEAP32[$501>>2]|0;
         $503 = HEAP32[((1024120 + 16|0))>>2]|0;
         $504 = ($T$0$lcssa$i>>>0)<($503>>>0);
         if ($504) {
          _abort();
          // unreachable;
         }
         $505 = ($502>>>0)<($503>>>0);
         if ($505) {
          _abort();
          // unreachable;
         } else {
          $506 = (($502) + 12|0);
          HEAP32[$506>>2] = $349;
          HEAP32[$501>>2] = $349;
          $$sum8$i = (($247) + 8)|0;
          $507 = (($v$3$lcssa$i) + ($$sum8$i)|0);
          HEAP32[$507>>2] = $502;
          $$sum9$i = (($247) + 12)|0;
          $508 = (($v$3$lcssa$i) + ($$sum9$i)|0);
          HEAP32[$508>>2] = $T$0$lcssa$i;
          $$sum10$i = (($247) + 24)|0;
          $509 = (($v$3$lcssa$i) + ($$sum10$i)|0);
          HEAP32[$509>>2] = 0;
          break;
         }
        }
       } while(0);
       $510 = (($v$3$lcssa$i) + 8|0);
       $mem$0 = $510;
       STACKTOP = sp;return ($mem$0|0);
      } else {
       $nb$0 = $247;
      }
     }
    }
   }
  }
 } while(0);
 $511 = HEAP32[((1024120 + 8|0))>>2]|0;
 $512 = ($nb$0>>>0)>($511>>>0);
 if (!($512)) {
  $513 = (($511) - ($nb$0))|0;
  $514 = HEAP32[((1024120 + 20|0))>>2]|0;
  $515 = ($513>>>0)>(15);
  if ($515) {
   $516 = (($514) + ($nb$0)|0);
   HEAP32[((1024120 + 20|0))>>2] = $516;
   HEAP32[((1024120 + 8|0))>>2] = $513;
   $517 = $513 | 1;
   $$sum2 = (($nb$0) + 4)|0;
   $518 = (($514) + ($$sum2)|0);
   HEAP32[$518>>2] = $517;
   $519 = (($514) + ($511)|0);
   HEAP32[$519>>2] = $513;
   $520 = $nb$0 | 3;
   $521 = (($514) + 4|0);
   HEAP32[$521>>2] = $520;
  } else {
   HEAP32[((1024120 + 8|0))>>2] = 0;
   HEAP32[((1024120 + 20|0))>>2] = 0;
   $522 = $511 | 3;
   $523 = (($514) + 4|0);
   HEAP32[$523>>2] = $522;
   $$sum1 = (($511) + 4)|0;
   $524 = (($514) + ($$sum1)|0);
   $525 = HEAP32[$524>>2]|0;
   $526 = $525 | 1;
   HEAP32[$524>>2] = $526;
  }
  $527 = (($514) + 8|0);
  $mem$0 = $527;
  STACKTOP = sp;return ($mem$0|0);
 }
 $528 = HEAP32[((1024120 + 12|0))>>2]|0;
 $529 = ($nb$0>>>0)<($528>>>0);
 if ($529) {
  $530 = (($528) - ($nb$0))|0;
  HEAP32[((1024120 + 12|0))>>2] = $530;
  $531 = HEAP32[((1024120 + 24|0))>>2]|0;
  $532 = (($531) + ($nb$0)|0);
  HEAP32[((1024120 + 24|0))>>2] = $532;
  $533 = $530 | 1;
  $$sum = (($nb$0) + 4)|0;
  $534 = (($531) + ($$sum)|0);
  HEAP32[$534>>2] = $533;
  $535 = $nb$0 | 3;
  $536 = (($531) + 4|0);
  HEAP32[$536>>2] = $535;
  $537 = (($531) + 8|0);
  $mem$0 = $537;
  STACKTOP = sp;return ($mem$0|0);
 }
 $538 = HEAP32[1024592>>2]|0;
 $539 = ($538|0)==(0);
 do {
  if ($539) {
   $540 = (_sysconf(30)|0);
   $541 = (($540) + -1)|0;
   $542 = $541 & $540;
   $543 = ($542|0)==(0);
   if ($543) {
    HEAP32[((1024592 + 8|0))>>2] = $540;
    HEAP32[((1024592 + 4|0))>>2] = $540;
    HEAP32[((1024592 + 12|0))>>2] = -1;
    HEAP32[((1024592 + 16|0))>>2] = -1;
    HEAP32[((1024592 + 20|0))>>2] = 0;
    HEAP32[((1024120 + 444|0))>>2] = 0;
    $544 = (_time((0|0))|0);
    $545 = $544 & -16;
    $546 = $545 ^ 1431655768;
    HEAP32[1024592>>2] = $546;
    break;
   } else {
    _abort();
    // unreachable;
   }
  }
 } while(0);
 $547 = (($nb$0) + 48)|0;
 $548 = HEAP32[((1024592 + 8|0))>>2]|0;
 $549 = (($nb$0) + 47)|0;
 $550 = (($548) + ($549))|0;
 $551 = (0 - ($548))|0;
 $552 = $550 & $551;
 $553 = ($552>>>0)>($nb$0>>>0);
 if (!($553)) {
  $mem$0 = 0;
  STACKTOP = sp;return ($mem$0|0);
 }
 $554 = HEAP32[((1024120 + 440|0))>>2]|0;
 $555 = ($554|0)==(0);
 if (!($555)) {
  $556 = HEAP32[((1024120 + 432|0))>>2]|0;
  $557 = (($556) + ($552))|0;
  $558 = ($557>>>0)<=($556>>>0);
  $559 = ($557>>>0)>($554>>>0);
  $or$cond1$i = $558 | $559;
  if ($or$cond1$i) {
   $mem$0 = 0;
   STACKTOP = sp;return ($mem$0|0);
  }
 }
 $560 = HEAP32[((1024120 + 444|0))>>2]|0;
 $561 = $560 & 4;
 $562 = ($561|0)==(0);
 L269: do {
  if ($562) {
   $563 = HEAP32[((1024120 + 24|0))>>2]|0;
   $564 = ($563|0)==(0|0);
   L271: do {
    if ($564) {
     label = 182;
    } else {
     $sp$0$i$i = ((1024120 + 448|0));
     while(1) {
      $565 = HEAP32[$sp$0$i$i>>2]|0;
      $566 = ($565>>>0)>($563>>>0);
      if (!($566)) {
       $567 = (($sp$0$i$i) + 4|0);
       $568 = HEAP32[$567>>2]|0;
       $569 = (($565) + ($568)|0);
       $570 = ($569>>>0)>($563>>>0);
       if ($570) {
        break;
       }
      }
      $571 = (($sp$0$i$i) + 8|0);
      $572 = HEAP32[$571>>2]|0;
      $573 = ($572|0)==(0|0);
      if ($573) {
       label = 182;
       break L271;
      } else {
       $sp$0$i$i = $572;
      }
     }
     $574 = ($sp$0$i$i|0)==(0|0);
     if ($574) {
      label = 182;
     } else {
      $597 = HEAP32[((1024120 + 12|0))>>2]|0;
      $598 = (($550) - ($597))|0;
      $599 = $598 & $551;
      $600 = ($599>>>0)<(2147483647);
      if ($600) {
       $601 = (_sbrk(($599|0))|0);
       $602 = HEAP32[$sp$0$i$i>>2]|0;
       $603 = HEAP32[$567>>2]|0;
       $604 = (($602) + ($603)|0);
       $605 = ($601|0)==($604|0);
       $$3$i = $605 ? $599 : 0;
       $$4$i = $605 ? $601 : (-1);
       $br$0$i = $601;$ssize$1$i = $599;$tbase$0$i = $$4$i;$tsize$0$i = $$3$i;
       label = 191;
      } else {
       $tsize$0323841$i = 0;
      }
     }
    }
   } while(0);
   do {
    if ((label|0) == 182) {
     $575 = (_sbrk(0)|0);
     $576 = ($575|0)==((-1)|0);
     if ($576) {
      $tsize$0323841$i = 0;
     } else {
      $577 = $575;
      $578 = HEAP32[((1024592 + 4|0))>>2]|0;
      $579 = (($578) + -1)|0;
      $580 = $579 & $577;
      $581 = ($580|0)==(0);
      if ($581) {
       $ssize$0$i = $552;
      } else {
       $582 = (($579) + ($577))|0;
       $583 = (0 - ($578))|0;
       $584 = $582 & $583;
       $585 = (($552) - ($577))|0;
       $586 = (($585) + ($584))|0;
       $ssize$0$i = $586;
      }
      $587 = HEAP32[((1024120 + 432|0))>>2]|0;
      $588 = (($587) + ($ssize$0$i))|0;
      $589 = ($ssize$0$i>>>0)>($nb$0>>>0);
      $590 = ($ssize$0$i>>>0)<(2147483647);
      $or$cond$i29 = $589 & $590;
      if ($or$cond$i29) {
       $591 = HEAP32[((1024120 + 440|0))>>2]|0;
       $592 = ($591|0)==(0);
       if (!($592)) {
        $593 = ($588>>>0)<=($587>>>0);
        $594 = ($588>>>0)>($591>>>0);
        $or$cond2$i = $593 | $594;
        if ($or$cond2$i) {
         $tsize$0323841$i = 0;
         break;
        }
       }
       $595 = (_sbrk(($ssize$0$i|0))|0);
       $596 = ($595|0)==($575|0);
       $ssize$0$$i = $596 ? $ssize$0$i : 0;
       $$$i = $596 ? $575 : (-1);
       $br$0$i = $595;$ssize$1$i = $ssize$0$i;$tbase$0$i = $$$i;$tsize$0$i = $ssize$0$$i;
       label = 191;
      } else {
       $tsize$0323841$i = 0;
      }
     }
    }
   } while(0);
   L291: do {
    if ((label|0) == 191) {
     $606 = (0 - ($ssize$1$i))|0;
     $607 = ($tbase$0$i|0)==((-1)|0);
     if (!($607)) {
      $tbase$247$i = $tbase$0$i;$tsize$246$i = $tsize$0$i;
      label = 202;
      break L269;
     }
     $608 = ($br$0$i|0)!=((-1)|0);
     $609 = ($ssize$1$i>>>0)<(2147483647);
     $or$cond5$i = $608 & $609;
     $610 = ($ssize$1$i>>>0)<($547>>>0);
     $or$cond6$i = $or$cond5$i & $610;
     do {
      if ($or$cond6$i) {
       $611 = HEAP32[((1024592 + 8|0))>>2]|0;
       $612 = (($549) - ($ssize$1$i))|0;
       $613 = (($612) + ($611))|0;
       $614 = (0 - ($611))|0;
       $615 = $613 & $614;
       $616 = ($615>>>0)<(2147483647);
       if ($616) {
        $617 = (_sbrk(($615|0))|0);
        $618 = ($617|0)==((-1)|0);
        if ($618) {
         (_sbrk(($606|0))|0);
         $tsize$0323841$i = $tsize$0$i;
         break L291;
        } else {
         $619 = (($615) + ($ssize$1$i))|0;
         $ssize$2$i = $619;
         break;
        }
       } else {
        $ssize$2$i = $ssize$1$i;
       }
      } else {
       $ssize$2$i = $ssize$1$i;
      }
     } while(0);
     $620 = ($br$0$i|0)==((-1)|0);
     if ($620) {
      $tsize$0323841$i = $tsize$0$i;
     } else {
      $tbase$247$i = $br$0$i;$tsize$246$i = $ssize$2$i;
      label = 202;
      break L269;
     }
    }
   } while(0);
   $621 = HEAP32[((1024120 + 444|0))>>2]|0;
   $622 = $621 | 4;
   HEAP32[((1024120 + 444|0))>>2] = $622;
   $tsize$1$i = $tsize$0323841$i;
   label = 199;
  } else {
   $tsize$1$i = 0;
   label = 199;
  }
 } while(0);
 if ((label|0) == 199) {
  $623 = ($552>>>0)<(2147483647);
  if ($623) {
   $624 = (_sbrk(($552|0))|0);
   $625 = (_sbrk(0)|0);
   $notlhs$i = ($624|0)!=((-1)|0);
   $notrhs$i = ($625|0)!=((-1)|0);
   $or$cond8$not$i = $notrhs$i & $notlhs$i;
   $626 = ($624>>>0)<($625>>>0);
   $or$cond9$i = $or$cond8$not$i & $626;
   if ($or$cond9$i) {
    $627 = $625;
    $628 = $624;
    $629 = (($627) - ($628))|0;
    $630 = (($nb$0) + 40)|0;
    $631 = ($629>>>0)>($630>>>0);
    $$tsize$1$i = $631 ? $629 : $tsize$1$i;
    if ($631) {
     $tbase$247$i = $624;$tsize$246$i = $$tsize$1$i;
     label = 202;
    }
   }
  }
 }
 if ((label|0) == 202) {
  $632 = HEAP32[((1024120 + 432|0))>>2]|0;
  $633 = (($632) + ($tsize$246$i))|0;
  HEAP32[((1024120 + 432|0))>>2] = $633;
  $634 = HEAP32[((1024120 + 436|0))>>2]|0;
  $635 = ($633>>>0)>($634>>>0);
  if ($635) {
   HEAP32[((1024120 + 436|0))>>2] = $633;
  }
  $636 = HEAP32[((1024120 + 24|0))>>2]|0;
  $637 = ($636|0)==(0|0);
  L311: do {
   if ($637) {
    $638 = HEAP32[((1024120 + 16|0))>>2]|0;
    $639 = ($638|0)==(0|0);
    $640 = ($tbase$247$i>>>0)<($638>>>0);
    $or$cond10$i = $639 | $640;
    if ($or$cond10$i) {
     HEAP32[((1024120 + 16|0))>>2] = $tbase$247$i;
    }
    HEAP32[((1024120 + 448|0))>>2] = $tbase$247$i;
    HEAP32[((1024120 + 452|0))>>2] = $tsize$246$i;
    HEAP32[((1024120 + 460|0))>>2] = 0;
    $641 = HEAP32[1024592>>2]|0;
    HEAP32[((1024120 + 36|0))>>2] = $641;
    HEAP32[((1024120 + 32|0))>>2] = -1;
    $i$02$i$i = 0;
    while(1) {
     $642 = $i$02$i$i << 1;
     $643 = ((1024120 + ($642<<2)|0) + 40|0);
     $$sum$i$i = (($642) + 3)|0;
     $644 = ((1024120 + ($$sum$i$i<<2)|0) + 40|0);
     HEAP32[$644>>2] = $643;
     $$sum1$i$i = (($642) + 2)|0;
     $645 = ((1024120 + ($$sum1$i$i<<2)|0) + 40|0);
     HEAP32[$645>>2] = $643;
     $646 = (($i$02$i$i) + 1)|0;
     $exitcond$i$i = ($646|0)==(32);
     if ($exitcond$i$i) {
      break;
     } else {
      $i$02$i$i = $646;
     }
    }
    $647 = (($tsize$246$i) + -40)|0;
    $648 = (($tbase$247$i) + 8|0);
    $649 = $648;
    $650 = $649 & 7;
    $651 = ($650|0)==(0);
    if ($651) {
     $655 = 0;
    } else {
     $652 = (0 - ($649))|0;
     $653 = $652 & 7;
     $655 = $653;
    }
    $654 = (($tbase$247$i) + ($655)|0);
    $656 = (($647) - ($655))|0;
    HEAP32[((1024120 + 24|0))>>2] = $654;
    HEAP32[((1024120 + 12|0))>>2] = $656;
    $657 = $656 | 1;
    $$sum$i14$i = (($655) + 4)|0;
    $658 = (($tbase$247$i) + ($$sum$i14$i)|0);
    HEAP32[$658>>2] = $657;
    $$sum2$i$i = (($tsize$246$i) + -36)|0;
    $659 = (($tbase$247$i) + ($$sum2$i$i)|0);
    HEAP32[$659>>2] = 40;
    $660 = HEAP32[((1024592 + 16|0))>>2]|0;
    HEAP32[((1024120 + 28|0))>>2] = $660;
   } else {
    $sp$075$i = ((1024120 + 448|0));
    while(1) {
     $661 = HEAP32[$sp$075$i>>2]|0;
     $662 = (($sp$075$i) + 4|0);
     $663 = HEAP32[$662>>2]|0;
     $664 = (($661) + ($663)|0);
     $665 = ($tbase$247$i|0)==($664|0);
     if ($665) {
      label = 214;
      break;
     }
     $666 = (($sp$075$i) + 8|0);
     $667 = HEAP32[$666>>2]|0;
     $668 = ($667|0)==(0|0);
     if ($668) {
      break;
     } else {
      $sp$075$i = $667;
     }
    }
    if ((label|0) == 214) {
     $669 = (($sp$075$i) + 12|0);
     $670 = HEAP32[$669>>2]|0;
     $671 = $670 & 8;
     $672 = ($671|0)==(0);
     if ($672) {
      $673 = ($636>>>0)>=($661>>>0);
      $674 = ($636>>>0)<($tbase$247$i>>>0);
      $or$cond49$i = $673 & $674;
      if ($or$cond49$i) {
       $675 = (($663) + ($tsize$246$i))|0;
       HEAP32[$662>>2] = $675;
       $676 = HEAP32[((1024120 + 12|0))>>2]|0;
       $677 = (($676) + ($tsize$246$i))|0;
       $678 = (($636) + 8|0);
       $679 = $678;
       $680 = $679 & 7;
       $681 = ($680|0)==(0);
       if ($681) {
        $685 = 0;
       } else {
        $682 = (0 - ($679))|0;
        $683 = $682 & 7;
        $685 = $683;
       }
       $684 = (($636) + ($685)|0);
       $686 = (($677) - ($685))|0;
       HEAP32[((1024120 + 24|0))>>2] = $684;
       HEAP32[((1024120 + 12|0))>>2] = $686;
       $687 = $686 | 1;
       $$sum$i18$i = (($685) + 4)|0;
       $688 = (($636) + ($$sum$i18$i)|0);
       HEAP32[$688>>2] = $687;
       $$sum2$i19$i = (($677) + 4)|0;
       $689 = (($636) + ($$sum2$i19$i)|0);
       HEAP32[$689>>2] = 40;
       $690 = HEAP32[((1024592 + 16|0))>>2]|0;
       HEAP32[((1024120 + 28|0))>>2] = $690;
       break;
      }
     }
    }
    $691 = HEAP32[((1024120 + 16|0))>>2]|0;
    $692 = ($tbase$247$i>>>0)<($691>>>0);
    if ($692) {
     HEAP32[((1024120 + 16|0))>>2] = $tbase$247$i;
    }
    $693 = (($tbase$247$i) + ($tsize$246$i)|0);
    $sp$168$i = ((1024120 + 448|0));
    while(1) {
     $694 = HEAP32[$sp$168$i>>2]|0;
     $695 = ($694|0)==($693|0);
     if ($695) {
      label = 224;
      break;
     }
     $696 = (($sp$168$i) + 8|0);
     $697 = HEAP32[$696>>2]|0;
     $698 = ($697|0)==(0|0);
     if ($698) {
      break;
     } else {
      $sp$168$i = $697;
     }
    }
    if ((label|0) == 224) {
     $699 = (($sp$168$i) + 12|0);
     $700 = HEAP32[$699>>2]|0;
     $701 = $700 & 8;
     $702 = ($701|0)==(0);
     if ($702) {
      HEAP32[$sp$168$i>>2] = $tbase$247$i;
      $703 = (($sp$168$i) + 4|0);
      $704 = HEAP32[$703>>2]|0;
      $705 = (($704) + ($tsize$246$i))|0;
      HEAP32[$703>>2] = $705;
      $706 = (($tbase$247$i) + 8|0);
      $707 = $706;
      $708 = $707 & 7;
      $709 = ($708|0)==(0);
      if ($709) {
       $713 = 0;
      } else {
       $710 = (0 - ($707))|0;
       $711 = $710 & 7;
       $713 = $711;
      }
      $712 = (($tbase$247$i) + ($713)|0);
      $$sum107$i = (($tsize$246$i) + 8)|0;
      $714 = (($tbase$247$i) + ($$sum107$i)|0);
      $715 = $714;
      $716 = $715 & 7;
      $717 = ($716|0)==(0);
      if ($717) {
       $720 = 0;
      } else {
       $718 = (0 - ($715))|0;
       $719 = $718 & 7;
       $720 = $719;
      }
      $$sum108$i = (($720) + ($tsize$246$i))|0;
      $721 = (($tbase$247$i) + ($$sum108$i)|0);
      $722 = $721;
      $723 = $712;
      $724 = (($722) - ($723))|0;
      $$sum$i21$i = (($713) + ($nb$0))|0;
      $725 = (($tbase$247$i) + ($$sum$i21$i)|0);
      $726 = (($724) - ($nb$0))|0;
      $727 = $nb$0 | 3;
      $$sum1$i22$i = (($713) + 4)|0;
      $728 = (($tbase$247$i) + ($$sum1$i22$i)|0);
      HEAP32[$728>>2] = $727;
      $729 = HEAP32[((1024120 + 24|0))>>2]|0;
      $730 = ($721|0)==($729|0);
      L338: do {
       if ($730) {
        $731 = HEAP32[((1024120 + 12|0))>>2]|0;
        $732 = (($731) + ($726))|0;
        HEAP32[((1024120 + 12|0))>>2] = $732;
        HEAP32[((1024120 + 24|0))>>2] = $725;
        $733 = $732 | 1;
        $$sum42$i$i = (($$sum$i21$i) + 4)|0;
        $734 = (($tbase$247$i) + ($$sum42$i$i)|0);
        HEAP32[$734>>2] = $733;
       } else {
        $735 = HEAP32[((1024120 + 20|0))>>2]|0;
        $736 = ($721|0)==($735|0);
        if ($736) {
         $737 = HEAP32[((1024120 + 8|0))>>2]|0;
         $738 = (($737) + ($726))|0;
         HEAP32[((1024120 + 8|0))>>2] = $738;
         HEAP32[((1024120 + 20|0))>>2] = $725;
         $739 = $738 | 1;
         $$sum40$i$i = (($$sum$i21$i) + 4)|0;
         $740 = (($tbase$247$i) + ($$sum40$i$i)|0);
         HEAP32[$740>>2] = $739;
         $$sum41$i$i = (($738) + ($$sum$i21$i))|0;
         $741 = (($tbase$247$i) + ($$sum41$i$i)|0);
         HEAP32[$741>>2] = $738;
         break;
        }
        $$sum2$i23$i = (($tsize$246$i) + 4)|0;
        $$sum109$i = (($$sum2$i23$i) + ($720))|0;
        $742 = (($tbase$247$i) + ($$sum109$i)|0);
        $743 = HEAP32[$742>>2]|0;
        $744 = $743 & 3;
        $745 = ($744|0)==(1);
        if ($745) {
         $746 = $743 & -8;
         $747 = $743 >>> 3;
         $748 = ($743>>>0)<(256);
         L346: do {
          if ($748) {
           $$sum3738$i$i = $720 | 8;
           $$sum119$i = (($$sum3738$i$i) + ($tsize$246$i))|0;
           $749 = (($tbase$247$i) + ($$sum119$i)|0);
           $750 = HEAP32[$749>>2]|0;
           $$sum39$i$i = (($tsize$246$i) + 12)|0;
           $$sum120$i = (($$sum39$i$i) + ($720))|0;
           $751 = (($tbase$247$i) + ($$sum120$i)|0);
           $752 = HEAP32[$751>>2]|0;
           $753 = $747 << 1;
           $754 = ((1024120 + ($753<<2)|0) + 40|0);
           $755 = ($750|0)==($754|0);
           do {
            if (!($755)) {
             $756 = HEAP32[((1024120 + 16|0))>>2]|0;
             $757 = ($750>>>0)<($756>>>0);
             if ($757) {
              _abort();
              // unreachable;
             }
             $758 = (($750) + 12|0);
             $759 = HEAP32[$758>>2]|0;
             $760 = ($759|0)==($721|0);
             if ($760) {
              break;
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $761 = ($752|0)==($750|0);
           if ($761) {
            $762 = 1 << $747;
            $763 = $762 ^ -1;
            $764 = HEAP32[1024120>>2]|0;
            $765 = $764 & $763;
            HEAP32[1024120>>2] = $765;
            break;
           }
           $766 = ($752|0)==($754|0);
           do {
            if ($766) {
             $$pre57$i$i = (($752) + 8|0);
             $$pre$phi58$i$iZ2D = $$pre57$i$i;
            } else {
             $767 = HEAP32[((1024120 + 16|0))>>2]|0;
             $768 = ($752>>>0)<($767>>>0);
             if ($768) {
              _abort();
              // unreachable;
             }
             $769 = (($752) + 8|0);
             $770 = HEAP32[$769>>2]|0;
             $771 = ($770|0)==($721|0);
             if ($771) {
              $$pre$phi58$i$iZ2D = $769;
              break;
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $772 = (($750) + 12|0);
           HEAP32[$772>>2] = $752;
           HEAP32[$$pre$phi58$i$iZ2D>>2] = $750;
          } else {
           $$sum34$i$i = $720 | 24;
           $$sum110$i = (($$sum34$i$i) + ($tsize$246$i))|0;
           $773 = (($tbase$247$i) + ($$sum110$i)|0);
           $774 = HEAP32[$773>>2]|0;
           $$sum5$i$i = (($tsize$246$i) + 12)|0;
           $$sum111$i = (($$sum5$i$i) + ($720))|0;
           $775 = (($tbase$247$i) + ($$sum111$i)|0);
           $776 = HEAP32[$775>>2]|0;
           $777 = ($776|0)==($721|0);
           do {
            if ($777) {
             $$sum67$i$i = $720 | 16;
             $$sum117$i = (($$sum2$i23$i) + ($$sum67$i$i))|0;
             $788 = (($tbase$247$i) + ($$sum117$i)|0);
             $789 = HEAP32[$788>>2]|0;
             $790 = ($789|0)==(0|0);
             if ($790) {
              $$sum118$i = (($$sum67$i$i) + ($tsize$246$i))|0;
              $791 = (($tbase$247$i) + ($$sum118$i)|0);
              $792 = HEAP32[$791>>2]|0;
              $793 = ($792|0)==(0|0);
              if ($793) {
               $R$1$i$i = 0;
               break;
              } else {
               $R$0$i$i = $792;$RP$0$i$i = $791;
              }
             } else {
              $R$0$i$i = $789;$RP$0$i$i = $788;
             }
             while(1) {
              $794 = (($R$0$i$i) + 20|0);
              $795 = HEAP32[$794>>2]|0;
              $796 = ($795|0)==(0|0);
              if (!($796)) {
               $R$0$i$i = $795;$RP$0$i$i = $794;
               continue;
              }
              $797 = (($R$0$i$i) + 16|0);
              $798 = HEAP32[$797>>2]|0;
              $799 = ($798|0)==(0|0);
              if ($799) {
               break;
              } else {
               $R$0$i$i = $798;$RP$0$i$i = $797;
              }
             }
             $800 = HEAP32[((1024120 + 16|0))>>2]|0;
             $801 = ($RP$0$i$i>>>0)<($800>>>0);
             if ($801) {
              _abort();
              // unreachable;
             } else {
              HEAP32[$RP$0$i$i>>2] = 0;
              $R$1$i$i = $R$0$i$i;
              break;
             }
            } else {
             $$sum3536$i$i = $720 | 8;
             $$sum112$i = (($$sum3536$i$i) + ($tsize$246$i))|0;
             $778 = (($tbase$247$i) + ($$sum112$i)|0);
             $779 = HEAP32[$778>>2]|0;
             $780 = HEAP32[((1024120 + 16|0))>>2]|0;
             $781 = ($779>>>0)<($780>>>0);
             if ($781) {
              _abort();
              // unreachable;
             }
             $782 = (($779) + 12|0);
             $783 = HEAP32[$782>>2]|0;
             $784 = ($783|0)==($721|0);
             if (!($784)) {
              _abort();
              // unreachable;
             }
             $785 = (($776) + 8|0);
             $786 = HEAP32[$785>>2]|0;
             $787 = ($786|0)==($721|0);
             if ($787) {
              HEAP32[$782>>2] = $776;
              HEAP32[$785>>2] = $779;
              $R$1$i$i = $776;
              break;
             } else {
              _abort();
              // unreachable;
             }
            }
           } while(0);
           $802 = ($774|0)==(0|0);
           if ($802) {
            break;
           }
           $$sum30$i$i = (($tsize$246$i) + 28)|0;
           $$sum113$i = (($$sum30$i$i) + ($720))|0;
           $803 = (($tbase$247$i) + ($$sum113$i)|0);
           $804 = HEAP32[$803>>2]|0;
           $805 = ((1024120 + ($804<<2)|0) + 304|0);
           $806 = HEAP32[$805>>2]|0;
           $807 = ($721|0)==($806|0);
           do {
            if ($807) {
             HEAP32[$805>>2] = $R$1$i$i;
             $cond$i$i = ($R$1$i$i|0)==(0|0);
             if (!($cond$i$i)) {
              break;
             }
             $808 = 1 << $804;
             $809 = $808 ^ -1;
             $810 = HEAP32[((1024120 + 4|0))>>2]|0;
             $811 = $810 & $809;
             HEAP32[((1024120 + 4|0))>>2] = $811;
             break L346;
            } else {
             $812 = HEAP32[((1024120 + 16|0))>>2]|0;
             $813 = ($774>>>0)<($812>>>0);
             if ($813) {
              _abort();
              // unreachable;
             }
             $814 = (($774) + 16|0);
             $815 = HEAP32[$814>>2]|0;
             $816 = ($815|0)==($721|0);
             if ($816) {
              HEAP32[$814>>2] = $R$1$i$i;
             } else {
              $817 = (($774) + 20|0);
              HEAP32[$817>>2] = $R$1$i$i;
             }
             $818 = ($R$1$i$i|0)==(0|0);
             if ($818) {
              break L346;
             }
            }
           } while(0);
           $819 = HEAP32[((1024120 + 16|0))>>2]|0;
           $820 = ($R$1$i$i>>>0)<($819>>>0);
           if ($820) {
            _abort();
            // unreachable;
           }
           $821 = (($R$1$i$i) + 24|0);
           HEAP32[$821>>2] = $774;
           $$sum3132$i$i = $720 | 16;
           $$sum114$i = (($$sum3132$i$i) + ($tsize$246$i))|0;
           $822 = (($tbase$247$i) + ($$sum114$i)|0);
           $823 = HEAP32[$822>>2]|0;
           $824 = ($823|0)==(0|0);
           do {
            if (!($824)) {
             $825 = HEAP32[((1024120 + 16|0))>>2]|0;
             $826 = ($823>>>0)<($825>>>0);
             if ($826) {
              _abort();
              // unreachable;
             } else {
              $827 = (($R$1$i$i) + 16|0);
              HEAP32[$827>>2] = $823;
              $828 = (($823) + 24|0);
              HEAP32[$828>>2] = $R$1$i$i;
              break;
             }
            }
           } while(0);
           $$sum115$i = (($$sum2$i23$i) + ($$sum3132$i$i))|0;
           $829 = (($tbase$247$i) + ($$sum115$i)|0);
           $830 = HEAP32[$829>>2]|0;
           $831 = ($830|0)==(0|0);
           if ($831) {
            break;
           }
           $832 = HEAP32[((1024120 + 16|0))>>2]|0;
           $833 = ($830>>>0)<($832>>>0);
           if ($833) {
            _abort();
            // unreachable;
           } else {
            $834 = (($R$1$i$i) + 20|0);
            HEAP32[$834>>2] = $830;
            $835 = (($830) + 24|0);
            HEAP32[$835>>2] = $R$1$i$i;
            break;
           }
          }
         } while(0);
         $$sum9$i$i = $746 | $720;
         $$sum116$i = (($$sum9$i$i) + ($tsize$246$i))|0;
         $836 = (($tbase$247$i) + ($$sum116$i)|0);
         $837 = (($746) + ($726))|0;
         $oldfirst$0$i$i = $836;$qsize$0$i$i = $837;
        } else {
         $oldfirst$0$i$i = $721;$qsize$0$i$i = $726;
        }
        $838 = (($oldfirst$0$i$i) + 4|0);
        $839 = HEAP32[$838>>2]|0;
        $840 = $839 & -2;
        HEAP32[$838>>2] = $840;
        $841 = $qsize$0$i$i | 1;
        $$sum10$i$i = (($$sum$i21$i) + 4)|0;
        $842 = (($tbase$247$i) + ($$sum10$i$i)|0);
        HEAP32[$842>>2] = $841;
        $$sum11$i24$i = (($qsize$0$i$i) + ($$sum$i21$i))|0;
        $843 = (($tbase$247$i) + ($$sum11$i24$i)|0);
        HEAP32[$843>>2] = $qsize$0$i$i;
        $844 = $qsize$0$i$i >>> 3;
        $845 = ($qsize$0$i$i>>>0)<(256);
        if ($845) {
         $846 = $844 << 1;
         $847 = ((1024120 + ($846<<2)|0) + 40|0);
         $848 = HEAP32[1024120>>2]|0;
         $849 = 1 << $844;
         $850 = $848 & $849;
         $851 = ($850|0)==(0);
         do {
          if ($851) {
           $852 = $848 | $849;
           HEAP32[1024120>>2] = $852;
           $$sum26$pre$i$i = (($846) + 2)|0;
           $$pre$i25$i = ((1024120 + ($$sum26$pre$i$i<<2)|0) + 40|0);
           $$pre$phi$i26$iZ2D = $$pre$i25$i;$F4$0$i$i = $847;
          } else {
           $$sum29$i$i = (($846) + 2)|0;
           $853 = ((1024120 + ($$sum29$i$i<<2)|0) + 40|0);
           $854 = HEAP32[$853>>2]|0;
           $855 = HEAP32[((1024120 + 16|0))>>2]|0;
           $856 = ($854>>>0)<($855>>>0);
           if (!($856)) {
            $$pre$phi$i26$iZ2D = $853;$F4$0$i$i = $854;
            break;
           }
           _abort();
           // unreachable;
          }
         } while(0);
         HEAP32[$$pre$phi$i26$iZ2D>>2] = $725;
         $857 = (($F4$0$i$i) + 12|0);
         HEAP32[$857>>2] = $725;
         $$sum27$i$i = (($$sum$i21$i) + 8)|0;
         $858 = (($tbase$247$i) + ($$sum27$i$i)|0);
         HEAP32[$858>>2] = $F4$0$i$i;
         $$sum28$i$i = (($$sum$i21$i) + 12)|0;
         $859 = (($tbase$247$i) + ($$sum28$i$i)|0);
         HEAP32[$859>>2] = $847;
         break;
        }
        $860 = $qsize$0$i$i >>> 8;
        $861 = ($860|0)==(0);
        do {
         if ($861) {
          $I7$0$i$i = 0;
         } else {
          $862 = ($qsize$0$i$i>>>0)>(16777215);
          if ($862) {
           $I7$0$i$i = 31;
           break;
          }
          $863 = (($860) + 1048320)|0;
          $864 = $863 >>> 16;
          $865 = $864 & 8;
          $866 = $860 << $865;
          $867 = (($866) + 520192)|0;
          $868 = $867 >>> 16;
          $869 = $868 & 4;
          $870 = $869 | $865;
          $871 = $866 << $869;
          $872 = (($871) + 245760)|0;
          $873 = $872 >>> 16;
          $874 = $873 & 2;
          $875 = $870 | $874;
          $876 = (14 - ($875))|0;
          $877 = $871 << $874;
          $878 = $877 >>> 15;
          $879 = (($876) + ($878))|0;
          $880 = $879 << 1;
          $881 = (($879) + 7)|0;
          $882 = $qsize$0$i$i >>> $881;
          $883 = $882 & 1;
          $884 = $883 | $880;
          $I7$0$i$i = $884;
         }
        } while(0);
        $885 = ((1024120 + ($I7$0$i$i<<2)|0) + 304|0);
        $$sum12$i$i = (($$sum$i21$i) + 28)|0;
        $886 = (($tbase$247$i) + ($$sum12$i$i)|0);
        HEAP32[$886>>2] = $I7$0$i$i;
        $$sum13$i$i = (($$sum$i21$i) + 16)|0;
        $887 = (($tbase$247$i) + ($$sum13$i$i)|0);
        $$sum14$i$i = (($$sum$i21$i) + 20)|0;
        $888 = (($tbase$247$i) + ($$sum14$i$i)|0);
        HEAP32[$888>>2] = 0;
        HEAP32[$887>>2] = 0;
        $889 = HEAP32[((1024120 + 4|0))>>2]|0;
        $890 = 1 << $I7$0$i$i;
        $891 = $889 & $890;
        $892 = ($891|0)==(0);
        if ($892) {
         $893 = $889 | $890;
         HEAP32[((1024120 + 4|0))>>2] = $893;
         HEAP32[$885>>2] = $725;
         $$sum15$i$i = (($$sum$i21$i) + 24)|0;
         $894 = (($tbase$247$i) + ($$sum15$i$i)|0);
         HEAP32[$894>>2] = $885;
         $$sum16$i$i = (($$sum$i21$i) + 12)|0;
         $895 = (($tbase$247$i) + ($$sum16$i$i)|0);
         HEAP32[$895>>2] = $725;
         $$sum17$i$i = (($$sum$i21$i) + 8)|0;
         $896 = (($tbase$247$i) + ($$sum17$i$i)|0);
         HEAP32[$896>>2] = $725;
         break;
        }
        $897 = HEAP32[$885>>2]|0;
        $898 = ($I7$0$i$i|0)==(31);
        if ($898) {
         $906 = 0;
        } else {
         $899 = $I7$0$i$i >>> 1;
         $900 = (25 - ($899))|0;
         $906 = $900;
        }
        $901 = (($897) + 4|0);
        $902 = HEAP32[$901>>2]|0;
        $903 = $902 & -8;
        $904 = ($903|0)==($qsize$0$i$i|0);
        L435: do {
         if ($904) {
          $T$0$lcssa$i28$i = $897;
         } else {
          $905 = $qsize$0$i$i << $906;
          $K8$052$i$i = $905;$T$051$i$i = $897;
          while(1) {
           $913 = $K8$052$i$i >>> 31;
           $914 = ((($T$051$i$i) + ($913<<2)|0) + 16|0);
           $909 = HEAP32[$914>>2]|0;
           $915 = ($909|0)==(0|0);
           if ($915) {
            break;
           }
           $907 = $K8$052$i$i << 1;
           $908 = (($909) + 4|0);
           $910 = HEAP32[$908>>2]|0;
           $911 = $910 & -8;
           $912 = ($911|0)==($qsize$0$i$i|0);
           if ($912) {
            $T$0$lcssa$i28$i = $909;
            break L435;
           } else {
            $K8$052$i$i = $907;$T$051$i$i = $909;
           }
          }
          $916 = HEAP32[((1024120 + 16|0))>>2]|0;
          $917 = ($914>>>0)<($916>>>0);
          if ($917) {
           _abort();
           // unreachable;
          } else {
           HEAP32[$914>>2] = $725;
           $$sum23$i$i = (($$sum$i21$i) + 24)|0;
           $918 = (($tbase$247$i) + ($$sum23$i$i)|0);
           HEAP32[$918>>2] = $T$051$i$i;
           $$sum24$i$i = (($$sum$i21$i) + 12)|0;
           $919 = (($tbase$247$i) + ($$sum24$i$i)|0);
           HEAP32[$919>>2] = $725;
           $$sum25$i$i = (($$sum$i21$i) + 8)|0;
           $920 = (($tbase$247$i) + ($$sum25$i$i)|0);
           HEAP32[$920>>2] = $725;
           break L338;
          }
         }
        } while(0);
        $921 = (($T$0$lcssa$i28$i) + 8|0);
        $922 = HEAP32[$921>>2]|0;
        $923 = HEAP32[((1024120 + 16|0))>>2]|0;
        $924 = ($T$0$lcssa$i28$i>>>0)<($923>>>0);
        if ($924) {
         _abort();
         // unreachable;
        }
        $925 = ($922>>>0)<($923>>>0);
        if ($925) {
         _abort();
         // unreachable;
        } else {
         $926 = (($922) + 12|0);
         HEAP32[$926>>2] = $725;
         HEAP32[$921>>2] = $725;
         $$sum20$i$i = (($$sum$i21$i) + 8)|0;
         $927 = (($tbase$247$i) + ($$sum20$i$i)|0);
         HEAP32[$927>>2] = $922;
         $$sum21$i$i = (($$sum$i21$i) + 12)|0;
         $928 = (($tbase$247$i) + ($$sum21$i$i)|0);
         HEAP32[$928>>2] = $T$0$lcssa$i28$i;
         $$sum22$i$i = (($$sum$i21$i) + 24)|0;
         $929 = (($tbase$247$i) + ($$sum22$i$i)|0);
         HEAP32[$929>>2] = 0;
         break;
        }
       }
      } while(0);
      $$sum1819$i$i = $713 | 8;
      $930 = (($tbase$247$i) + ($$sum1819$i$i)|0);
      $mem$0 = $930;
      STACKTOP = sp;return ($mem$0|0);
     }
    }
    $sp$0$i$i$i = ((1024120 + 448|0));
    while(1) {
     $931 = HEAP32[$sp$0$i$i$i>>2]|0;
     $932 = ($931>>>0)>($636>>>0);
     if (!($932)) {
      $933 = (($sp$0$i$i$i) + 4|0);
      $934 = HEAP32[$933>>2]|0;
      $935 = (($931) + ($934)|0);
      $936 = ($935>>>0)>($636>>>0);
      if ($936) {
       break;
      }
     }
     $937 = (($sp$0$i$i$i) + 8|0);
     $938 = HEAP32[$937>>2]|0;
     $sp$0$i$i$i = $938;
    }
    $$sum$i15$i = (($934) + -47)|0;
    $$sum1$i16$i = (($934) + -39)|0;
    $939 = (($931) + ($$sum1$i16$i)|0);
    $940 = $939;
    $941 = $940 & 7;
    $942 = ($941|0)==(0);
    if ($942) {
     $945 = 0;
    } else {
     $943 = (0 - ($940))|0;
     $944 = $943 & 7;
     $945 = $944;
    }
    $$sum2$i17$i = (($$sum$i15$i) + ($945))|0;
    $946 = (($931) + ($$sum2$i17$i)|0);
    $947 = (($636) + 16|0);
    $948 = ($946>>>0)<($947>>>0);
    $949 = $948 ? $636 : $946;
    $950 = (($949) + 8|0);
    $951 = (($tsize$246$i) + -40)|0;
    $952 = (($tbase$247$i) + 8|0);
    $953 = $952;
    $954 = $953 & 7;
    $955 = ($954|0)==(0);
    if ($955) {
     $959 = 0;
    } else {
     $956 = (0 - ($953))|0;
     $957 = $956 & 7;
     $959 = $957;
    }
    $958 = (($tbase$247$i) + ($959)|0);
    $960 = (($951) - ($959))|0;
    HEAP32[((1024120 + 24|0))>>2] = $958;
    HEAP32[((1024120 + 12|0))>>2] = $960;
    $961 = $960 | 1;
    $$sum$i$i$i = (($959) + 4)|0;
    $962 = (($tbase$247$i) + ($$sum$i$i$i)|0);
    HEAP32[$962>>2] = $961;
    $$sum2$i$i$i = (($tsize$246$i) + -36)|0;
    $963 = (($tbase$247$i) + ($$sum2$i$i$i)|0);
    HEAP32[$963>>2] = 40;
    $964 = HEAP32[((1024592 + 16|0))>>2]|0;
    HEAP32[((1024120 + 28|0))>>2] = $964;
    $965 = (($949) + 4|0);
    HEAP32[$965>>2] = 27;
    ;HEAP32[$950+0>>2]=HEAP32[((1024120 + 448|0))+0>>2]|0;HEAP32[$950+4>>2]=HEAP32[((1024120 + 448|0))+4>>2]|0;HEAP32[$950+8>>2]=HEAP32[((1024120 + 448|0))+8>>2]|0;HEAP32[$950+12>>2]=HEAP32[((1024120 + 448|0))+12>>2]|0;
    HEAP32[((1024120 + 448|0))>>2] = $tbase$247$i;
    HEAP32[((1024120 + 452|0))>>2] = $tsize$246$i;
    HEAP32[((1024120 + 460|0))>>2] = 0;
    HEAP32[((1024120 + 456|0))>>2] = $950;
    $966 = (($949) + 28|0);
    HEAP32[$966>>2] = 7;
    $967 = (($949) + 32|0);
    $968 = ($967>>>0)<($935>>>0);
    if ($968) {
     $970 = $966;
     while(1) {
      $969 = (($970) + 4|0);
      HEAP32[$969>>2] = 7;
      $971 = (($970) + 8|0);
      $972 = ($971>>>0)<($935>>>0);
      if ($972) {
       $970 = $969;
      } else {
       break;
      }
     }
    }
    $973 = ($949|0)==($636|0);
    if (!($973)) {
     $974 = $949;
     $975 = $636;
     $976 = (($974) - ($975))|0;
     $977 = (($636) + ($976)|0);
     $$sum3$i$i = (($976) + 4)|0;
     $978 = (($636) + ($$sum3$i$i)|0);
     $979 = HEAP32[$978>>2]|0;
     $980 = $979 & -2;
     HEAP32[$978>>2] = $980;
     $981 = $976 | 1;
     $982 = (($636) + 4|0);
     HEAP32[$982>>2] = $981;
     HEAP32[$977>>2] = $976;
     $983 = $976 >>> 3;
     $984 = ($976>>>0)<(256);
     if ($984) {
      $985 = $983 << 1;
      $986 = ((1024120 + ($985<<2)|0) + 40|0);
      $987 = HEAP32[1024120>>2]|0;
      $988 = 1 << $983;
      $989 = $987 & $988;
      $990 = ($989|0)==(0);
      do {
       if ($990) {
        $991 = $987 | $988;
        HEAP32[1024120>>2] = $991;
        $$sum10$pre$i$i = (($985) + 2)|0;
        $$pre$i$i = ((1024120 + ($$sum10$pre$i$i<<2)|0) + 40|0);
        $$pre$phi$i$iZ2D = $$pre$i$i;$F$0$i$i = $986;
       } else {
        $$sum11$i$i = (($985) + 2)|0;
        $992 = ((1024120 + ($$sum11$i$i<<2)|0) + 40|0);
        $993 = HEAP32[$992>>2]|0;
        $994 = HEAP32[((1024120 + 16|0))>>2]|0;
        $995 = ($993>>>0)<($994>>>0);
        if (!($995)) {
         $$pre$phi$i$iZ2D = $992;$F$0$i$i = $993;
         break;
        }
        _abort();
        // unreachable;
       }
      } while(0);
      HEAP32[$$pre$phi$i$iZ2D>>2] = $636;
      $996 = (($F$0$i$i) + 12|0);
      HEAP32[$996>>2] = $636;
      $997 = (($636) + 8|0);
      HEAP32[$997>>2] = $F$0$i$i;
      $998 = (($636) + 12|0);
      HEAP32[$998>>2] = $986;
      break;
     }
     $999 = $976 >>> 8;
     $1000 = ($999|0)==(0);
     if ($1000) {
      $I1$0$i$i = 0;
     } else {
      $1001 = ($976>>>0)>(16777215);
      if ($1001) {
       $I1$0$i$i = 31;
      } else {
       $1002 = (($999) + 1048320)|0;
       $1003 = $1002 >>> 16;
       $1004 = $1003 & 8;
       $1005 = $999 << $1004;
       $1006 = (($1005) + 520192)|0;
       $1007 = $1006 >>> 16;
       $1008 = $1007 & 4;
       $1009 = $1008 | $1004;
       $1010 = $1005 << $1008;
       $1011 = (($1010) + 245760)|0;
       $1012 = $1011 >>> 16;
       $1013 = $1012 & 2;
       $1014 = $1009 | $1013;
       $1015 = (14 - ($1014))|0;
       $1016 = $1010 << $1013;
       $1017 = $1016 >>> 15;
       $1018 = (($1015) + ($1017))|0;
       $1019 = $1018 << 1;
       $1020 = (($1018) + 7)|0;
       $1021 = $976 >>> $1020;
       $1022 = $1021 & 1;
       $1023 = $1022 | $1019;
       $I1$0$i$i = $1023;
      }
     }
     $1024 = ((1024120 + ($I1$0$i$i<<2)|0) + 304|0);
     $1025 = (($636) + 28|0);
     $I1$0$c$i$i = $I1$0$i$i;
     HEAP32[$1025>>2] = $I1$0$c$i$i;
     $1026 = (($636) + 20|0);
     HEAP32[$1026>>2] = 0;
     $1027 = (($636) + 16|0);
     HEAP32[$1027>>2] = 0;
     $1028 = HEAP32[((1024120 + 4|0))>>2]|0;
     $1029 = 1 << $I1$0$i$i;
     $1030 = $1028 & $1029;
     $1031 = ($1030|0)==(0);
     if ($1031) {
      $1032 = $1028 | $1029;
      HEAP32[((1024120 + 4|0))>>2] = $1032;
      HEAP32[$1024>>2] = $636;
      $1033 = (($636) + 24|0);
      HEAP32[$1033>>2] = $1024;
      $1034 = (($636) + 12|0);
      HEAP32[$1034>>2] = $636;
      $1035 = (($636) + 8|0);
      HEAP32[$1035>>2] = $636;
      break;
     }
     $1036 = HEAP32[$1024>>2]|0;
     $1037 = ($I1$0$i$i|0)==(31);
     if ($1037) {
      $1045 = 0;
     } else {
      $1038 = $I1$0$i$i >>> 1;
      $1039 = (25 - ($1038))|0;
      $1045 = $1039;
     }
     $1040 = (($1036) + 4|0);
     $1041 = HEAP32[$1040>>2]|0;
     $1042 = $1041 & -8;
     $1043 = ($1042|0)==($976|0);
     L489: do {
      if ($1043) {
       $T$0$lcssa$i$i = $1036;
      } else {
       $1044 = $976 << $1045;
       $K2$014$i$i = $1044;$T$013$i$i = $1036;
       while(1) {
        $1052 = $K2$014$i$i >>> 31;
        $1053 = ((($T$013$i$i) + ($1052<<2)|0) + 16|0);
        $1048 = HEAP32[$1053>>2]|0;
        $1054 = ($1048|0)==(0|0);
        if ($1054) {
         break;
        }
        $1046 = $K2$014$i$i << 1;
        $1047 = (($1048) + 4|0);
        $1049 = HEAP32[$1047>>2]|0;
        $1050 = $1049 & -8;
        $1051 = ($1050|0)==($976|0);
        if ($1051) {
         $T$0$lcssa$i$i = $1048;
         break L489;
        } else {
         $K2$014$i$i = $1046;$T$013$i$i = $1048;
        }
       }
       $1055 = HEAP32[((1024120 + 16|0))>>2]|0;
       $1056 = ($1053>>>0)<($1055>>>0);
       if ($1056) {
        _abort();
        // unreachable;
       } else {
        HEAP32[$1053>>2] = $636;
        $1057 = (($636) + 24|0);
        HEAP32[$1057>>2] = $T$013$i$i;
        $1058 = (($636) + 12|0);
        HEAP32[$1058>>2] = $636;
        $1059 = (($636) + 8|0);
        HEAP32[$1059>>2] = $636;
        break L311;
       }
      }
     } while(0);
     $1060 = (($T$0$lcssa$i$i) + 8|0);
     $1061 = HEAP32[$1060>>2]|0;
     $1062 = HEAP32[((1024120 + 16|0))>>2]|0;
     $1063 = ($T$0$lcssa$i$i>>>0)<($1062>>>0);
     if ($1063) {
      _abort();
      // unreachable;
     }
     $1064 = ($1061>>>0)<($1062>>>0);
     if ($1064) {
      _abort();
      // unreachable;
     } else {
      $1065 = (($1061) + 12|0);
      HEAP32[$1065>>2] = $636;
      HEAP32[$1060>>2] = $636;
      $1066 = (($636) + 8|0);
      HEAP32[$1066>>2] = $1061;
      $1067 = (($636) + 12|0);
      HEAP32[$1067>>2] = $T$0$lcssa$i$i;
      $1068 = (($636) + 24|0);
      HEAP32[$1068>>2] = 0;
      break;
     }
    }
   }
  } while(0);
  $1069 = HEAP32[((1024120 + 12|0))>>2]|0;
  $1070 = ($1069>>>0)>($nb$0>>>0);
  if ($1070) {
   $1071 = (($1069) - ($nb$0))|0;
   HEAP32[((1024120 + 12|0))>>2] = $1071;
   $1072 = HEAP32[((1024120 + 24|0))>>2]|0;
   $1073 = (($1072) + ($nb$0)|0);
   HEAP32[((1024120 + 24|0))>>2] = $1073;
   $1074 = $1071 | 1;
   $$sum$i32 = (($nb$0) + 4)|0;
   $1075 = (($1072) + ($$sum$i32)|0);
   HEAP32[$1075>>2] = $1074;
   $1076 = $nb$0 | 3;
   $1077 = (($1072) + 4|0);
   HEAP32[$1077>>2] = $1076;
   $1078 = (($1072) + 8|0);
   $mem$0 = $1078;
   STACKTOP = sp;return ($mem$0|0);
  }
 }
 $1079 = (___errno_location()|0);
 HEAP32[$1079>>2] = 12;
 $mem$0 = 0;
 STACKTOP = sp;return ($mem$0|0);
}
function _free($mem) {
 $mem = $mem|0;
 var $$pre = 0, $$pre$phi68Z2D = 0, $$pre$phi70Z2D = 0, $$pre$phiZ2D = 0, $$pre67 = 0, $$pre69 = 0, $$sum = 0, $$sum16$pre = 0, $$sum17 = 0, $$sum18 = 0, $$sum19 = 0, $$sum2 = 0, $$sum20 = 0, $$sum2324 = 0, $$sum25 = 0, $$sum26 = 0, $$sum28 = 0, $$sum29 = 0, $$sum3 = 0, $$sum30 = 0;
 var $$sum31 = 0, $$sum32 = 0, $$sum33 = 0, $$sum34 = 0, $$sum35 = 0, $$sum36 = 0, $$sum37 = 0, $$sum5 = 0, $$sum67 = 0, $$sum8 = 0, $$sum9 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0;
 var $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0;
 var $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0;
 var $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0;
 var $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0;
 var $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0;
 var $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0;
 var $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0;
 var $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0;
 var $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0;
 var $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0;
 var $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0;
 var $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0;
 var $322 = 0, $323 = 0, $324 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0;
 var $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0;
 var $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0;
 var $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $F16$0 = 0, $I18$0 = 0, $I18$0$c = 0, $K19$057 = 0;
 var $R$0 = 0, $R$1 = 0, $R7$0 = 0, $R7$1 = 0, $RP$0 = 0, $RP9$0 = 0, $T$0$lcssa = 0, $T$056 = 0, $cond = 0, $cond54 = 0, $p$0 = 0, $psize$0 = 0, $psize$1 = 0, $sp$0$i = 0, $sp$0$in$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($mem|0)==(0|0);
 if ($0) {
  STACKTOP = sp;return;
 }
 $1 = (($mem) + -8|0);
 $2 = HEAP32[((1024120 + 16|0))>>2]|0;
 $3 = ($1>>>0)<($2>>>0);
 if ($3) {
  _abort();
  // unreachable;
 }
 $4 = (($mem) + -4|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = $5 & 3;
 $7 = ($6|0)==(1);
 if ($7) {
  _abort();
  // unreachable;
 }
 $8 = $5 & -8;
 $$sum = (($8) + -8)|0;
 $9 = (($mem) + ($$sum)|0);
 $10 = $5 & 1;
 $11 = ($10|0)==(0);
 do {
  if ($11) {
   $12 = HEAP32[$1>>2]|0;
   $13 = ($6|0)==(0);
   if ($13) {
    STACKTOP = sp;return;
   }
   $$sum2 = (-8 - ($12))|0;
   $14 = (($mem) + ($$sum2)|0);
   $15 = (($12) + ($8))|0;
   $16 = ($14>>>0)<($2>>>0);
   if ($16) {
    _abort();
    // unreachable;
   }
   $17 = HEAP32[((1024120 + 20|0))>>2]|0;
   $18 = ($14|0)==($17|0);
   if ($18) {
    $$sum3 = (($8) + -4)|0;
    $104 = (($mem) + ($$sum3)|0);
    $105 = HEAP32[$104>>2]|0;
    $106 = $105 & 3;
    $107 = ($106|0)==(3);
    if (!($107)) {
     $p$0 = $14;$psize$0 = $15;
     break;
    }
    HEAP32[((1024120 + 8|0))>>2] = $15;
    $108 = HEAP32[$104>>2]|0;
    $109 = $108 & -2;
    HEAP32[$104>>2] = $109;
    $110 = $15 | 1;
    $$sum26 = (($$sum2) + 4)|0;
    $111 = (($mem) + ($$sum26)|0);
    HEAP32[$111>>2] = $110;
    HEAP32[$9>>2] = $15;
    STACKTOP = sp;return;
   }
   $19 = $12 >>> 3;
   $20 = ($12>>>0)<(256);
   if ($20) {
    $$sum36 = (($$sum2) + 8)|0;
    $21 = (($mem) + ($$sum36)|0);
    $22 = HEAP32[$21>>2]|0;
    $$sum37 = (($$sum2) + 12)|0;
    $23 = (($mem) + ($$sum37)|0);
    $24 = HEAP32[$23>>2]|0;
    $25 = $19 << 1;
    $26 = ((1024120 + ($25<<2)|0) + 40|0);
    $27 = ($22|0)==($26|0);
    if (!($27)) {
     $28 = ($22>>>0)<($2>>>0);
     if ($28) {
      _abort();
      // unreachable;
     }
     $29 = (($22) + 12|0);
     $30 = HEAP32[$29>>2]|0;
     $31 = ($30|0)==($14|0);
     if (!($31)) {
      _abort();
      // unreachable;
     }
    }
    $32 = ($24|0)==($22|0);
    if ($32) {
     $33 = 1 << $19;
     $34 = $33 ^ -1;
     $35 = HEAP32[1024120>>2]|0;
     $36 = $35 & $34;
     HEAP32[1024120>>2] = $36;
     $p$0 = $14;$psize$0 = $15;
     break;
    }
    $37 = ($24|0)==($26|0);
    if ($37) {
     $$pre69 = (($24) + 8|0);
     $$pre$phi70Z2D = $$pre69;
    } else {
     $38 = ($24>>>0)<($2>>>0);
     if ($38) {
      _abort();
      // unreachable;
     }
     $39 = (($24) + 8|0);
     $40 = HEAP32[$39>>2]|0;
     $41 = ($40|0)==($14|0);
     if ($41) {
      $$pre$phi70Z2D = $39;
     } else {
      _abort();
      // unreachable;
     }
    }
    $42 = (($22) + 12|0);
    HEAP32[$42>>2] = $24;
    HEAP32[$$pre$phi70Z2D>>2] = $22;
    $p$0 = $14;$psize$0 = $15;
    break;
   }
   $$sum28 = (($$sum2) + 24)|0;
   $43 = (($mem) + ($$sum28)|0);
   $44 = HEAP32[$43>>2]|0;
   $$sum29 = (($$sum2) + 12)|0;
   $45 = (($mem) + ($$sum29)|0);
   $46 = HEAP32[$45>>2]|0;
   $47 = ($46|0)==($14|0);
   do {
    if ($47) {
     $$sum31 = (($$sum2) + 20)|0;
     $57 = (($mem) + ($$sum31)|0);
     $58 = HEAP32[$57>>2]|0;
     $59 = ($58|0)==(0|0);
     if ($59) {
      $$sum30 = (($$sum2) + 16)|0;
      $60 = (($mem) + ($$sum30)|0);
      $61 = HEAP32[$60>>2]|0;
      $62 = ($61|0)==(0|0);
      if ($62) {
       $R$1 = 0;
       break;
      } else {
       $R$0 = $61;$RP$0 = $60;
      }
     } else {
      $R$0 = $58;$RP$0 = $57;
     }
     while(1) {
      $63 = (($R$0) + 20|0);
      $64 = HEAP32[$63>>2]|0;
      $65 = ($64|0)==(0|0);
      if (!($65)) {
       $R$0 = $64;$RP$0 = $63;
       continue;
      }
      $66 = (($R$0) + 16|0);
      $67 = HEAP32[$66>>2]|0;
      $68 = ($67|0)==(0|0);
      if ($68) {
       break;
      } else {
       $R$0 = $67;$RP$0 = $66;
      }
     }
     $69 = ($RP$0>>>0)<($2>>>0);
     if ($69) {
      _abort();
      // unreachable;
     } else {
      HEAP32[$RP$0>>2] = 0;
      $R$1 = $R$0;
      break;
     }
    } else {
     $$sum35 = (($$sum2) + 8)|0;
     $48 = (($mem) + ($$sum35)|0);
     $49 = HEAP32[$48>>2]|0;
     $50 = ($49>>>0)<($2>>>0);
     if ($50) {
      _abort();
      // unreachable;
     }
     $51 = (($49) + 12|0);
     $52 = HEAP32[$51>>2]|0;
     $53 = ($52|0)==($14|0);
     if (!($53)) {
      _abort();
      // unreachable;
     }
     $54 = (($46) + 8|0);
     $55 = HEAP32[$54>>2]|0;
     $56 = ($55|0)==($14|0);
     if ($56) {
      HEAP32[$51>>2] = $46;
      HEAP32[$54>>2] = $49;
      $R$1 = $46;
      break;
     } else {
      _abort();
      // unreachable;
     }
    }
   } while(0);
   $70 = ($44|0)==(0|0);
   if ($70) {
    $p$0 = $14;$psize$0 = $15;
   } else {
    $$sum32 = (($$sum2) + 28)|0;
    $71 = (($mem) + ($$sum32)|0);
    $72 = HEAP32[$71>>2]|0;
    $73 = ((1024120 + ($72<<2)|0) + 304|0);
    $74 = HEAP32[$73>>2]|0;
    $75 = ($14|0)==($74|0);
    if ($75) {
     HEAP32[$73>>2] = $R$1;
     $cond = ($R$1|0)==(0|0);
     if ($cond) {
      $76 = 1 << $72;
      $77 = $76 ^ -1;
      $78 = HEAP32[((1024120 + 4|0))>>2]|0;
      $79 = $78 & $77;
      HEAP32[((1024120 + 4|0))>>2] = $79;
      $p$0 = $14;$psize$0 = $15;
      break;
     }
    } else {
     $80 = HEAP32[((1024120 + 16|0))>>2]|0;
     $81 = ($44>>>0)<($80>>>0);
     if ($81) {
      _abort();
      // unreachable;
     }
     $82 = (($44) + 16|0);
     $83 = HEAP32[$82>>2]|0;
     $84 = ($83|0)==($14|0);
     if ($84) {
      HEAP32[$82>>2] = $R$1;
     } else {
      $85 = (($44) + 20|0);
      HEAP32[$85>>2] = $R$1;
     }
     $86 = ($R$1|0)==(0|0);
     if ($86) {
      $p$0 = $14;$psize$0 = $15;
      break;
     }
    }
    $87 = HEAP32[((1024120 + 16|0))>>2]|0;
    $88 = ($R$1>>>0)<($87>>>0);
    if ($88) {
     _abort();
     // unreachable;
    }
    $89 = (($R$1) + 24|0);
    HEAP32[$89>>2] = $44;
    $$sum33 = (($$sum2) + 16)|0;
    $90 = (($mem) + ($$sum33)|0);
    $91 = HEAP32[$90>>2]|0;
    $92 = ($91|0)==(0|0);
    do {
     if (!($92)) {
      $93 = HEAP32[((1024120 + 16|0))>>2]|0;
      $94 = ($91>>>0)<($93>>>0);
      if ($94) {
       _abort();
       // unreachable;
      } else {
       $95 = (($R$1) + 16|0);
       HEAP32[$95>>2] = $91;
       $96 = (($91) + 24|0);
       HEAP32[$96>>2] = $R$1;
       break;
      }
     }
    } while(0);
    $$sum34 = (($$sum2) + 20)|0;
    $97 = (($mem) + ($$sum34)|0);
    $98 = HEAP32[$97>>2]|0;
    $99 = ($98|0)==(0|0);
    if ($99) {
     $p$0 = $14;$psize$0 = $15;
    } else {
     $100 = HEAP32[((1024120 + 16|0))>>2]|0;
     $101 = ($98>>>0)<($100>>>0);
     if ($101) {
      _abort();
      // unreachable;
     } else {
      $102 = (($R$1) + 20|0);
      HEAP32[$102>>2] = $98;
      $103 = (($98) + 24|0);
      HEAP32[$103>>2] = $R$1;
      $p$0 = $14;$psize$0 = $15;
      break;
     }
    }
   }
  } else {
   $p$0 = $1;$psize$0 = $8;
  }
 } while(0);
 $112 = ($p$0>>>0)<($9>>>0);
 if (!($112)) {
  _abort();
  // unreachable;
 }
 $$sum25 = (($8) + -4)|0;
 $113 = (($mem) + ($$sum25)|0);
 $114 = HEAP32[$113>>2]|0;
 $115 = $114 & 1;
 $116 = ($115|0)==(0);
 if ($116) {
  _abort();
  // unreachable;
 }
 $117 = $114 & 2;
 $118 = ($117|0)==(0);
 if ($118) {
  $119 = HEAP32[((1024120 + 24|0))>>2]|0;
  $120 = ($9|0)==($119|0);
  if ($120) {
   $121 = HEAP32[((1024120 + 12|0))>>2]|0;
   $122 = (($121) + ($psize$0))|0;
   HEAP32[((1024120 + 12|0))>>2] = $122;
   HEAP32[((1024120 + 24|0))>>2] = $p$0;
   $123 = $122 | 1;
   $124 = (($p$0) + 4|0);
   HEAP32[$124>>2] = $123;
   $125 = HEAP32[((1024120 + 20|0))>>2]|0;
   $126 = ($p$0|0)==($125|0);
   if (!($126)) {
    STACKTOP = sp;return;
   }
   HEAP32[((1024120 + 20|0))>>2] = 0;
   HEAP32[((1024120 + 8|0))>>2] = 0;
   STACKTOP = sp;return;
  }
  $127 = HEAP32[((1024120 + 20|0))>>2]|0;
  $128 = ($9|0)==($127|0);
  if ($128) {
   $129 = HEAP32[((1024120 + 8|0))>>2]|0;
   $130 = (($129) + ($psize$0))|0;
   HEAP32[((1024120 + 8|0))>>2] = $130;
   HEAP32[((1024120 + 20|0))>>2] = $p$0;
   $131 = $130 | 1;
   $132 = (($p$0) + 4|0);
   HEAP32[$132>>2] = $131;
   $133 = (($p$0) + ($130)|0);
   HEAP32[$133>>2] = $130;
   STACKTOP = sp;return;
  }
  $134 = $114 & -8;
  $135 = (($134) + ($psize$0))|0;
  $136 = $114 >>> 3;
  $137 = ($114>>>0)<(256);
  do {
   if ($137) {
    $138 = (($mem) + ($8)|0);
    $139 = HEAP32[$138>>2]|0;
    $$sum2324 = $8 | 4;
    $140 = (($mem) + ($$sum2324)|0);
    $141 = HEAP32[$140>>2]|0;
    $142 = $136 << 1;
    $143 = ((1024120 + ($142<<2)|0) + 40|0);
    $144 = ($139|0)==($143|0);
    if (!($144)) {
     $145 = HEAP32[((1024120 + 16|0))>>2]|0;
     $146 = ($139>>>0)<($145>>>0);
     if ($146) {
      _abort();
      // unreachable;
     }
     $147 = (($139) + 12|0);
     $148 = HEAP32[$147>>2]|0;
     $149 = ($148|0)==($9|0);
     if (!($149)) {
      _abort();
      // unreachable;
     }
    }
    $150 = ($141|0)==($139|0);
    if ($150) {
     $151 = 1 << $136;
     $152 = $151 ^ -1;
     $153 = HEAP32[1024120>>2]|0;
     $154 = $153 & $152;
     HEAP32[1024120>>2] = $154;
     break;
    }
    $155 = ($141|0)==($143|0);
    if ($155) {
     $$pre67 = (($141) + 8|0);
     $$pre$phi68Z2D = $$pre67;
    } else {
     $156 = HEAP32[((1024120 + 16|0))>>2]|0;
     $157 = ($141>>>0)<($156>>>0);
     if ($157) {
      _abort();
      // unreachable;
     }
     $158 = (($141) + 8|0);
     $159 = HEAP32[$158>>2]|0;
     $160 = ($159|0)==($9|0);
     if ($160) {
      $$pre$phi68Z2D = $158;
     } else {
      _abort();
      // unreachable;
     }
    }
    $161 = (($139) + 12|0);
    HEAP32[$161>>2] = $141;
    HEAP32[$$pre$phi68Z2D>>2] = $139;
   } else {
    $$sum5 = (($8) + 16)|0;
    $162 = (($mem) + ($$sum5)|0);
    $163 = HEAP32[$162>>2]|0;
    $$sum67 = $8 | 4;
    $164 = (($mem) + ($$sum67)|0);
    $165 = HEAP32[$164>>2]|0;
    $166 = ($165|0)==($9|0);
    do {
     if ($166) {
      $$sum9 = (($8) + 12)|0;
      $177 = (($mem) + ($$sum9)|0);
      $178 = HEAP32[$177>>2]|0;
      $179 = ($178|0)==(0|0);
      if ($179) {
       $$sum8 = (($8) + 8)|0;
       $180 = (($mem) + ($$sum8)|0);
       $181 = HEAP32[$180>>2]|0;
       $182 = ($181|0)==(0|0);
       if ($182) {
        $R7$1 = 0;
        break;
       } else {
        $R7$0 = $181;$RP9$0 = $180;
       }
      } else {
       $R7$0 = $178;$RP9$0 = $177;
      }
      while(1) {
       $183 = (($R7$0) + 20|0);
       $184 = HEAP32[$183>>2]|0;
       $185 = ($184|0)==(0|0);
       if (!($185)) {
        $R7$0 = $184;$RP9$0 = $183;
        continue;
       }
       $186 = (($R7$0) + 16|0);
       $187 = HEAP32[$186>>2]|0;
       $188 = ($187|0)==(0|0);
       if ($188) {
        break;
       } else {
        $R7$0 = $187;$RP9$0 = $186;
       }
      }
      $189 = HEAP32[((1024120 + 16|0))>>2]|0;
      $190 = ($RP9$0>>>0)<($189>>>0);
      if ($190) {
       _abort();
       // unreachable;
      } else {
       HEAP32[$RP9$0>>2] = 0;
       $R7$1 = $R7$0;
       break;
      }
     } else {
      $167 = (($mem) + ($8)|0);
      $168 = HEAP32[$167>>2]|0;
      $169 = HEAP32[((1024120 + 16|0))>>2]|0;
      $170 = ($168>>>0)<($169>>>0);
      if ($170) {
       _abort();
       // unreachable;
      }
      $171 = (($168) + 12|0);
      $172 = HEAP32[$171>>2]|0;
      $173 = ($172|0)==($9|0);
      if (!($173)) {
       _abort();
       // unreachable;
      }
      $174 = (($165) + 8|0);
      $175 = HEAP32[$174>>2]|0;
      $176 = ($175|0)==($9|0);
      if ($176) {
       HEAP32[$171>>2] = $165;
       HEAP32[$174>>2] = $168;
       $R7$1 = $165;
       break;
      } else {
       _abort();
       // unreachable;
      }
     }
    } while(0);
    $191 = ($163|0)==(0|0);
    if (!($191)) {
     $$sum18 = (($8) + 20)|0;
     $192 = (($mem) + ($$sum18)|0);
     $193 = HEAP32[$192>>2]|0;
     $194 = ((1024120 + ($193<<2)|0) + 304|0);
     $195 = HEAP32[$194>>2]|0;
     $196 = ($9|0)==($195|0);
     if ($196) {
      HEAP32[$194>>2] = $R7$1;
      $cond54 = ($R7$1|0)==(0|0);
      if ($cond54) {
       $197 = 1 << $193;
       $198 = $197 ^ -1;
       $199 = HEAP32[((1024120 + 4|0))>>2]|0;
       $200 = $199 & $198;
       HEAP32[((1024120 + 4|0))>>2] = $200;
       break;
      }
     } else {
      $201 = HEAP32[((1024120 + 16|0))>>2]|0;
      $202 = ($163>>>0)<($201>>>0);
      if ($202) {
       _abort();
       // unreachable;
      }
      $203 = (($163) + 16|0);
      $204 = HEAP32[$203>>2]|0;
      $205 = ($204|0)==($9|0);
      if ($205) {
       HEAP32[$203>>2] = $R7$1;
      } else {
       $206 = (($163) + 20|0);
       HEAP32[$206>>2] = $R7$1;
      }
      $207 = ($R7$1|0)==(0|0);
      if ($207) {
       break;
      }
     }
     $208 = HEAP32[((1024120 + 16|0))>>2]|0;
     $209 = ($R7$1>>>0)<($208>>>0);
     if ($209) {
      _abort();
      // unreachable;
     }
     $210 = (($R7$1) + 24|0);
     HEAP32[$210>>2] = $163;
     $$sum19 = (($8) + 8)|0;
     $211 = (($mem) + ($$sum19)|0);
     $212 = HEAP32[$211>>2]|0;
     $213 = ($212|0)==(0|0);
     do {
      if (!($213)) {
       $214 = HEAP32[((1024120 + 16|0))>>2]|0;
       $215 = ($212>>>0)<($214>>>0);
       if ($215) {
        _abort();
        // unreachable;
       } else {
        $216 = (($R7$1) + 16|0);
        HEAP32[$216>>2] = $212;
        $217 = (($212) + 24|0);
        HEAP32[$217>>2] = $R7$1;
        break;
       }
      }
     } while(0);
     $$sum20 = (($8) + 12)|0;
     $218 = (($mem) + ($$sum20)|0);
     $219 = HEAP32[$218>>2]|0;
     $220 = ($219|0)==(0|0);
     if (!($220)) {
      $221 = HEAP32[((1024120 + 16|0))>>2]|0;
      $222 = ($219>>>0)<($221>>>0);
      if ($222) {
       _abort();
       // unreachable;
      } else {
       $223 = (($R7$1) + 20|0);
       HEAP32[$223>>2] = $219;
       $224 = (($219) + 24|0);
       HEAP32[$224>>2] = $R7$1;
       break;
      }
     }
    }
   }
  } while(0);
  $225 = $135 | 1;
  $226 = (($p$0) + 4|0);
  HEAP32[$226>>2] = $225;
  $227 = (($p$0) + ($135)|0);
  HEAP32[$227>>2] = $135;
  $228 = HEAP32[((1024120 + 20|0))>>2]|0;
  $229 = ($p$0|0)==($228|0);
  if ($229) {
   HEAP32[((1024120 + 8|0))>>2] = $135;
   STACKTOP = sp;return;
  } else {
   $psize$1 = $135;
  }
 } else {
  $230 = $114 & -2;
  HEAP32[$113>>2] = $230;
  $231 = $psize$0 | 1;
  $232 = (($p$0) + 4|0);
  HEAP32[$232>>2] = $231;
  $233 = (($p$0) + ($psize$0)|0);
  HEAP32[$233>>2] = $psize$0;
  $psize$1 = $psize$0;
 }
 $234 = $psize$1 >>> 3;
 $235 = ($psize$1>>>0)<(256);
 if ($235) {
  $236 = $234 << 1;
  $237 = ((1024120 + ($236<<2)|0) + 40|0);
  $238 = HEAP32[1024120>>2]|0;
  $239 = 1 << $234;
  $240 = $238 & $239;
  $241 = ($240|0)==(0);
  if ($241) {
   $242 = $238 | $239;
   HEAP32[1024120>>2] = $242;
   $$sum16$pre = (($236) + 2)|0;
   $$pre = ((1024120 + ($$sum16$pre<<2)|0) + 40|0);
   $$pre$phiZ2D = $$pre;$F16$0 = $237;
  } else {
   $$sum17 = (($236) + 2)|0;
   $243 = ((1024120 + ($$sum17<<2)|0) + 40|0);
   $244 = HEAP32[$243>>2]|0;
   $245 = HEAP32[((1024120 + 16|0))>>2]|0;
   $246 = ($244>>>0)<($245>>>0);
   if ($246) {
    _abort();
    // unreachable;
   } else {
    $$pre$phiZ2D = $243;$F16$0 = $244;
   }
  }
  HEAP32[$$pre$phiZ2D>>2] = $p$0;
  $247 = (($F16$0) + 12|0);
  HEAP32[$247>>2] = $p$0;
  $248 = (($p$0) + 8|0);
  HEAP32[$248>>2] = $F16$0;
  $249 = (($p$0) + 12|0);
  HEAP32[$249>>2] = $237;
  STACKTOP = sp;return;
 }
 $250 = $psize$1 >>> 8;
 $251 = ($250|0)==(0);
 if ($251) {
  $I18$0 = 0;
 } else {
  $252 = ($psize$1>>>0)>(16777215);
  if ($252) {
   $I18$0 = 31;
  } else {
   $253 = (($250) + 1048320)|0;
   $254 = $253 >>> 16;
   $255 = $254 & 8;
   $256 = $250 << $255;
   $257 = (($256) + 520192)|0;
   $258 = $257 >>> 16;
   $259 = $258 & 4;
   $260 = $259 | $255;
   $261 = $256 << $259;
   $262 = (($261) + 245760)|0;
   $263 = $262 >>> 16;
   $264 = $263 & 2;
   $265 = $260 | $264;
   $266 = (14 - ($265))|0;
   $267 = $261 << $264;
   $268 = $267 >>> 15;
   $269 = (($266) + ($268))|0;
   $270 = $269 << 1;
   $271 = (($269) + 7)|0;
   $272 = $psize$1 >>> $271;
   $273 = $272 & 1;
   $274 = $273 | $270;
   $I18$0 = $274;
  }
 }
 $275 = ((1024120 + ($I18$0<<2)|0) + 304|0);
 $276 = (($p$0) + 28|0);
 $I18$0$c = $I18$0;
 HEAP32[$276>>2] = $I18$0$c;
 $277 = (($p$0) + 20|0);
 HEAP32[$277>>2] = 0;
 $278 = (($p$0) + 16|0);
 HEAP32[$278>>2] = 0;
 $279 = HEAP32[((1024120 + 4|0))>>2]|0;
 $280 = 1 << $I18$0;
 $281 = $279 & $280;
 $282 = ($281|0)==(0);
 L199: do {
  if ($282) {
   $283 = $279 | $280;
   HEAP32[((1024120 + 4|0))>>2] = $283;
   HEAP32[$275>>2] = $p$0;
   $284 = (($p$0) + 24|0);
   HEAP32[$284>>2] = $275;
   $285 = (($p$0) + 12|0);
   HEAP32[$285>>2] = $p$0;
   $286 = (($p$0) + 8|0);
   HEAP32[$286>>2] = $p$0;
  } else {
   $287 = HEAP32[$275>>2]|0;
   $288 = ($I18$0|0)==(31);
   if ($288) {
    $296 = 0;
   } else {
    $289 = $I18$0 >>> 1;
    $290 = (25 - ($289))|0;
    $296 = $290;
   }
   $291 = (($287) + 4|0);
   $292 = HEAP32[$291>>2]|0;
   $293 = $292 & -8;
   $294 = ($293|0)==($psize$1|0);
   L205: do {
    if ($294) {
     $T$0$lcssa = $287;
    } else {
     $295 = $psize$1 << $296;
     $K19$057 = $295;$T$056 = $287;
     while(1) {
      $303 = $K19$057 >>> 31;
      $304 = ((($T$056) + ($303<<2)|0) + 16|0);
      $299 = HEAP32[$304>>2]|0;
      $305 = ($299|0)==(0|0);
      if ($305) {
       break;
      }
      $297 = $K19$057 << 1;
      $298 = (($299) + 4|0);
      $300 = HEAP32[$298>>2]|0;
      $301 = $300 & -8;
      $302 = ($301|0)==($psize$1|0);
      if ($302) {
       $T$0$lcssa = $299;
       break L205;
      } else {
       $K19$057 = $297;$T$056 = $299;
      }
     }
     $306 = HEAP32[((1024120 + 16|0))>>2]|0;
     $307 = ($304>>>0)<($306>>>0);
     if ($307) {
      _abort();
      // unreachable;
     } else {
      HEAP32[$304>>2] = $p$0;
      $308 = (($p$0) + 24|0);
      HEAP32[$308>>2] = $T$056;
      $309 = (($p$0) + 12|0);
      HEAP32[$309>>2] = $p$0;
      $310 = (($p$0) + 8|0);
      HEAP32[$310>>2] = $p$0;
      break L199;
     }
    }
   } while(0);
   $311 = (($T$0$lcssa) + 8|0);
   $312 = HEAP32[$311>>2]|0;
   $313 = HEAP32[((1024120 + 16|0))>>2]|0;
   $314 = ($T$0$lcssa>>>0)<($313>>>0);
   if ($314) {
    _abort();
    // unreachable;
   }
   $315 = ($312>>>0)<($313>>>0);
   if ($315) {
    _abort();
    // unreachable;
   } else {
    $316 = (($312) + 12|0);
    HEAP32[$316>>2] = $p$0;
    HEAP32[$311>>2] = $p$0;
    $317 = (($p$0) + 8|0);
    HEAP32[$317>>2] = $312;
    $318 = (($p$0) + 12|0);
    HEAP32[$318>>2] = $T$0$lcssa;
    $319 = (($p$0) + 24|0);
    HEAP32[$319>>2] = 0;
    break;
   }
  }
 } while(0);
 $320 = HEAP32[((1024120 + 32|0))>>2]|0;
 $321 = (($320) + -1)|0;
 HEAP32[((1024120 + 32|0))>>2] = $321;
 $322 = ($321|0)==(0);
 if ($322) {
  $sp$0$in$i = ((1024120 + 456|0));
 } else {
  STACKTOP = sp;return;
 }
 while(1) {
  $sp$0$i = HEAP32[$sp$0$in$i>>2]|0;
  $323 = ($sp$0$i|0)==(0|0);
  $324 = (($sp$0$i) + 8|0);
  if ($323) {
   break;
  } else {
   $sp$0$in$i = $324;
  }
 }
 HEAP32[((1024120 + 32|0))>>2] = -1;
 STACKTOP = sp;return;
}
function runPostSets() {
 
}
function _memset(ptr, value, num) {
    ptr = ptr|0; value = value|0; num = num|0;
    var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
    stop = (ptr + num)|0;
    if ((num|0) >= 20) {
      // This is unaligned, but quite large, so work hard to get to aligned settings
      value = value & 0xff;
      unaligned = ptr & 3;
      value4 = value | (value << 8) | (value << 16) | (value << 24);
      stop4 = stop & ~3;
      if (unaligned) {
        unaligned = (ptr + 4 - unaligned)|0;
        while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
          HEAP8[((ptr)>>0)]=value;
          ptr = (ptr+1)|0;
        }
      }
      while ((ptr|0) < (stop4|0)) {
        HEAP32[((ptr)>>2)]=value4;
        ptr = (ptr+4)|0;
      }
    }
    while ((ptr|0) < (stop|0)) {
      HEAP8[((ptr)>>0)]=value;
      ptr = (ptr+1)|0;
    }
    return (ptr-num)|0;
}
function _strlen(ptr) {
    ptr = ptr|0;
    var curr = 0;
    curr = ptr;
    while (((HEAP8[((curr)>>0)])|0)) {
      curr = (curr + 1)|0;
    }
    return (curr - ptr)|0;
}
function _memcpy(dest, src, num) {

    dest = dest|0; src = src|0; num = num|0;
    var ret = 0;
    if ((num|0) >= 4096) return _emscripten_memcpy_big(dest|0, src|0, num|0)|0;
    ret = dest|0;
    if ((dest&3) == (src&3)) {
      while (dest & 3) {
        if ((num|0) == 0) return ret|0;
        HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      while ((num|0) >= 4) {
        HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
        dest = (dest+4)|0;
        src = (src+4)|0;
        num = (num-4)|0;
      }
    }
    while ((num|0) > 0) {
      HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
      dest = (dest+1)|0;
      src = (src+1)|0;
      num = (num-1)|0;
    }
    return ret|0;
}

// EMSCRIPTEN_END_FUNCS

    
    function dynCall_dii(index,a1,a2) {
      index = index|0;
      a1=a1|0; a2=a2|0;
      return +FUNCTION_TABLE_dii[index&1](a1|0,a2|0);
    }
  
function b0(p0,p1) { p0 = p0|0;p1 = p1|0; nullFunc_dii(0);return +0; }
  // EMSCRIPTEN_END_FUNCS
  var FUNCTION_TABLE_dii = [b0,_mvndfn_];

    return { _strlen: _strlen, _free: _free, _memset: _memset, _malloc: _malloc, _memcpy: _memcpy, _mvndst: _mvndst, runPostSets: runPostSets, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, setThrew: setThrew, setTempRet0: setTempRet0, getTempRet0: getTempRet0, dynCall_dii: dynCall_dii };
  })
  // EMSCRIPTEN_END_ASM
  (Module.asmGlobalArg, Module.asmLibraryArg, buffer);
  var real__strlen = asm["_strlen"]; asm["_strlen"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__strlen.apply(null, arguments);
};

var real__mvndst = asm["_mvndst"]; asm["_mvndst"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__mvndst.apply(null, arguments);
};

var real_runPostSets = asm["runPostSets"]; asm["runPostSets"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_runPostSets.apply(null, arguments);
};
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _mvndst = Module["_mvndst"] = asm["_mvndst"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_dii = Module["dynCall_dii"] = asm["dynCall_dii"];
  
  Runtime.stackAlloc = asm['stackAlloc'];
  Runtime.stackSave = asm['stackSave'];
  Runtime.stackRestore = asm['stackRestore'];
  Runtime.setTempRet0 = asm['setTempRet0'];
  Runtime.getTempRet0 = asm['getTempRet0'];
  

// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;

// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  if (typeof Module['locateFile'] === 'function') {
    memoryInitializer = Module['locateFile'](memoryInitializer);
  } else if (Module['memoryInitializerPrefixURL']) {
    memoryInitializer = Module['memoryInitializerPrefixURL'] + memoryInitializer;
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, STATIC_BASE);
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      for (var i = 0; i < data.length; i++) {
        assert(HEAPU8[STATIC_BASE + i] === 0, "area for memory initializer should not have been touched before it's loaded");
      }
      HEAPU8.set(data, STATIC_BASE);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString(Module['thisProgram']), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    exit(ret);
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    if (ABORT) return; 

    ensureInitRuntime();

    preMain();

    if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
      Module.printErr('pre-main prep time: ' + (Date.now() - preloadStartTime) + ' ms');
    }

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  if (Module['noExitRuntime']) {
    Module.printErr('exit(' + status + ') called, but noExitRuntime, so not exiting');
    return;
  }

  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  if (ENVIRONMENT_IS_NODE) {
    // Work around a node.js bug where stdout buffer is not flushed at process exit:
    // Instead of process.exit() directly, wait for stdout flush event.
    // See https://github.com/joyent/node/issues/1669 and https://github.com/kripken/emscripten/issues/2582
    // Workaround is based on https://github.com/RReverser/acorn/commit/50ab143cecc9ed71a2d66f78b4aec3bb2e9844f6
    process['stdout']['once']('drain', function () {
      process['exit'](status);
    });
    console.log(' '); // Make sure to print something to force the drain event to occur, in case the stdout buffer was empty.
    // Work around another node bug where sometimes 'drain' is never fired - make another effort
    // to emit the exit status, after a significant delay (if node hasn't fired drain by then, give up)
    setTimeout(function() {
      process['exit'](status);
    }, 500);
  } else
  if (ENVIRONMENT_IS_SHELL && typeof quit === 'function') {
    quit(status);
  }
  // if we reach here, we must throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '';

  throw 'abort() at ' + stackTrace() + extra;
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}



